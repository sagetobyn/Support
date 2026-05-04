"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { defaultBrand, seedOrders, seedSavingsEvents } from "@/data/seed";
import type {
  ActionItem,
  AuditLog,
  BrandSettings,
  CustomerIntent,
  CustomerResponse,
  ImportRecord,
  Message,
  NdrCase,
  NdrCaseState,
  Order,
  RecommendedAction,
  Role,
  SavingsEvent
} from "@/types/domain";
import { analyzeCsvImport } from "@/lib/csvImport";
import { buildNdrCases } from "@/lib/ndrCases";
import {
  calculateRoi,
  cancelledBeforeShippingSaving,
  codConvertedPrepaidSaving,
  estimatedRtoLossPerOrder,
  ndrRescuedDeliveredSaving
} from "@/lib/roi";
import { maskPhone } from "@/lib/privacy";
import { nextActionAfterResponse, recommendedActionLabel } from "@/lib/actions";
import { renderTemplate, templateButtons, templates, type TemplateType } from "@/lib/messaging";
import { detectIntent } from "@/lib/responses";
import { generateAuditReport } from "@/lib/auditReport";
import { normalizeNdrReason } from "@/lib/ndr";
import { actionableGroupLabels, buildActionGroups, isDeliveredNoAction, isNdrOrder } from "@/lib/actionGroups";
import { estimatedLeakageForOrder, estimatedRecoverableLeakage, findPrepaidConversionOpportunities } from "@/lib/profitRecovery";
import { currentProPlan, getProLimitWarning, getScaleEnterprisePlaceholder, scaleEnterprisePlaceholders, type PlanId } from "@/features/plans";
import { exportMessagesCsv, queueMockMessage } from "@/features/messaging";
import { updateBrandSettings, starterMultiBrandMessage } from "@/features/brand";
import { runImportPipeline } from "@/shared/connectors";
import { exportWorkspaceBackup, loadWorkspaceState, saveWorkspaceState, storageVersion, type StarterWorkspaceState } from "@/shared/storage";
import { publishEvent } from "@/shared/events";
import { createMainStore, proStoreLimitMessage } from "@/features/stores";
import { defaultProRules, evaluateCustomRules } from "@/features/rules";
import { generateHighRiskCodHoldPolicies } from "@/features/policy-recommendations";
import { findAdvancedPrepaidOpportunities } from "@/features/prepaid";
import { analyzePincodePolicies } from "@/features/pincode";
import { analyzeCourierPolicies } from "@/features/courier";
import { analyzeSkuLeakage } from "@/features/sku";
import { analyzeCampaignLeakage, campaignMissingEmptyState, hasCampaignData } from "@/features/campaigns";
import { defaultNdrPlaybooks } from "@/features/ndr-playbooks";
import { buildAdvancedActionQueue } from "@/features/actions";
import { calculateSavingsLedger, updateSavingEvent } from "@/features/savings-ledger";
import { generateWeeklyFounderReport } from "@/features/weekly-report";
import { generateMonthlyStrategyReport } from "@/features/monthly-strategy";
import { simulatePolicy, type SimulatedPolicyType } from "@/features/policy-simulator";
import { integrationReadinessCards, productionSecretsWarning } from "@/features/integration-readiness";
import { defaultOnboardingChecklist, onboardingProgress } from "@/features/onboarding";
import { sopTemplates } from "@/features/sops";
import { canRole } from "@/features/roles";
import { exportRowsCsv } from "@/features/reports";
import { demoProfiles, generateDemoWorkspace, ordersToCsv, type DemoProfileId } from "@/features/demo";
import {
  ActionCard,
  DataQualityBadge,
  DemoModeBanner,
  DrawerDetailLayout,
  EmptyState,
  FilterBar,
  InsightCard,
  MetricCard,
  PageHeader,
  PrintButton,
  RiskBadge,
  SearchInput,
  Timeline
} from "@/components/ui/controlRoom";

type View =
  | "dashboard"
  | "briefing"
  | "demo"
  | "onboarding"
  | "brand"
  | "upload"
  | "stores"
  | "orders"
  | "rules"
  | "ndr"
  | "ndrPlaybooks"
  | "actions"
  | "prepaid"
  | "pincode"
  | "courier"
  | "sku"
  | "campaigns"
  | "templates"
  | "savings"
  | "reports"
  | "weekly"
  | "monthly"
  | "simulator"
  | "integrations"
  | "sops"
  | "privacy"
  | "billing";

const allNavGroups: Array<{
  title: string;
  links: Array<{ id?: View; label: string; href?: string; badge?: string }>;
}> = [
  {
    title: "Start Here",
    links: [
      { id: "briefing", label: "Morning Briefing" },
      { id: "dashboard", label: "Profit Cockpit" },
      { id: "demo", label: "Demo / Client Test Mode", badge: "Local" }
    ]
  },
  {
    title: "Service Products",
    links: [
      { href: "/calculator", label: "Free RTO Leakage Check" },
      { href: "/sample-report", label: "Sample Audit Report" },
      { href: "/audit", label: "RTO Profit Audit" },
      { href: "/pilot", label: "14-Day RTO Rescue Pilot" },
      { id: "actions", label: "Daily Ops Control Room" },
      { id: "weekly", label: "Founder Profit Intelligence" }
    ]
  },
  {
    title: "Core Workflow",
    links: [
      { id: "upload", label: "CSV Upload" },
      { id: "orders", label: "Order Risk" },
      { id: "ndr", label: "NDR Rescue" },
      { id: "prepaid", label: "Prepaid Opportunities" },
      { id: "templates", label: "Messaging Outbox" },
      { id: "savings", label: "Savings Ledger" },
      { id: "reports", label: "Leakage Report" }
    ]
  },
  {
    title: "Advanced / Pro",
    links: [
      { id: "pincode", label: "Pincode Intelligence" },
      { id: "courier", label: "Courier Intelligence" },
      { id: "sku", label: "SKU Intelligence" },
      { id: "campaigns", label: "Campaign Intelligence" },
      { id: "simulator", label: "Policy Simulator" },
      { id: "monthly", label: "Monthly Strategy Report" }
    ]
  },
  {
    title: "Setup & Admin",
    links: [
      { id: "brand", label: "Brand Settings" },
      { id: "stores", label: "Stores" },
      { id: "rules", label: "Custom Rules" },
      { id: "ndrPlaybooks", label: "NDR Playbooks" },
      { id: "integrations", label: "Integration Readiness", badge: "Gated" },
      { id: "sops", label: "SOPs" },
      { id: "onboarding", label: "Onboarding" },
      { id: "privacy", label: "Privacy & Audit" },
      { id: "billing", label: "Plan & Billing" }
    ]
  }
];

function roleNavGroups(role: Role): typeof allNavGroups {
  if (role === "admin") return allNavGroups;
  const allowed = (ids: View[]) => (link: { id?: View; label: string; href?: string; badge?: string }) => !link.id || ids.includes(link.id);
  if (role === "ops") {
    const ids: View[] = ["briefing", "dashboard", "demo", "actions", "upload", "orders", "ndr", "templates", "savings", "reports", "brand", "privacy", "billing"];
    return allNavGroups.map((group) => ({ ...group, links: group.links.filter(allowed(ids)) })).filter((g) => g.links.length);
  }
  if (role === "analyst") {
    const ids: View[] = ["briefing", "dashboard", "demo", "actions", "upload", "orders", "ndr", "prepaid", "templates", "savings", "reports", "weekly", "pincode", "courier", "sku", "campaigns", "simulator", "monthly", "brand", "privacy", "billing"];
    return allNavGroups.map((group) => ({ ...group, links: group.links.filter(allowed(ids)) })).filter((g) => g.links.length);
  }
  const ids: View[] = ["briefing", "dashboard", "demo", "weekly", "reports", "savings", "brand", "privacy", "billing"];
  return allNavGroups.map((group) => ({ ...group, links: group.links.filter(allowed(ids)) })).filter((g) => g.links.length);
}

const clientStoryStages = [
  {
    label: "1. Core problem",
    title: "Money leaks after checkout",
    description: "COD failures, weak addresses, courier/pincode issues, and slow NDR action turn orders into avoidable RTO loss."
  },
  {
    label: "2. Solution",
    title: "Prioritize recovery work",
    description: "SupportWaala identifies the biggest leakage, tells the team what to do today, rescues NDRs, and tracks estimated savings."
  },
  {
    label: "3. Product",
    title: "RTOShield by SupportWaala",
    description: "Use the leakage check, audit, pilot, action queue, NDR rescue, reports, and savings ledger only when they support that business outcome."
  }
];

const serviceProducts: Array<{
  title: string;
  persona: string;
  promise: string;
  uses: string;
  actionLabel: string;
  href?: string;
  view?: View;
}> = [
  {
    title: "Free RTO Leakage Check",
    persona: "Founders not ready to share customer data",
    promise: "Know your estimated COD/RTO loss without uploading customer data.",
    uses: "Calculator, sample report, summary-only audit",
    actionLabel: "Open calculator",
    href: "/calculator"
  },
  {
    title: "RTO Profit Audit",
    persona: "Founders, finance heads, and ecommerce heads",
    promise: "See where profit is leaking and what actions can reduce it.",
    uses: "Anonymized CSV audit, leakage report, pilot recommendation",
    actionLabel: "Start audit",
    href: "/audit"
  },
  {
    title: "14-Day RTO Rescue Pilot",
    persona: "Founders and ops managers",
    promise: "Work the highest-value COD/NDR actions and track estimated savings.",
    uses: "Daily queue, NDR rescue, mock messaging, savings ledger",
    actionLabel: "Create pilot",
    href: "/pilot"
  },
  {
    title: "Daily Ops Control Room",
    persona: "Ops executives, support teams, warehouse teams",
    promise: "Know which orders to confirm, hold, correct, reattempt, cancel, or mark RTO.",
    uses: "Order risk, action queue, NDR rescue, prepaid opportunities",
    actionLabel: "Open queue",
    view: "actions"
  },
  {
    title: "Founder Profit Intelligence",
    persona: "Founders, ecommerce heads, and growth teams",
    promise: "Turn RTO data into courier, pincode, product, and campaign decisions.",
    uses: "Profit cockpit, weekly report, monthly strategy, simulator",
    actionLabel: "Open founder report",
    view: "weekly"
  }
];

const viewLabels = Object.fromEntries(
  allNavGroups.flatMap((group) => group.links.filter((link) => link.id).map((link) => [link.id, link.label]))
) as Record<View, string>;

const templateTypes = Object.keys(templates) as TemplateType[];

type AppState = StarterWorkspaceState;

type OrderFilters = {
  payment: string;
  risk: string;
  courier: string;
  query: string;
  quick: string;
};

function money(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function percent(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function riskClass(bucket: string) {
  return bucket.toLowerCase();
}

function nowId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

function defaultTemplateForOrder(order: Order): TemplateType {
  if (isNdrOrder(order)) return "ndr_rescue";
  if (order.addressIssues.length || order.recommendedAction === "request_address_update") return "address_correction";
  return "cod_confirmation";
}

function ndrStateLabel(state: NdrCaseState) {
  const labels: Record<NdrCaseState, string> = {
    new: "New",
    message_queued: "Message queued",
    called: "Called",
    contacted: "Contacted",
    customer_responded: "Customer responded",
    reattempt_requested: "Reattempt requested",
    address_update_needed: "Address update needed",
    call_needed: "Call needed",
    cancel_requested: "Cancel requested",
    delivered_after_ndr: "Delivered after NDR",
    rto: "RTO",
    unresolved: "Unresolved"
  };
  return labels[state];
}

function formulaNote(event: SavingsEvent) {
  const formula = String(event.calculation.formula || "");
  if (event.eventType === "cancelled_before_shipping") return "forward shipping + packaging + CAC";
  if (event.eventType === "ndr_rescued_delivered" || event.eventType === "address_corrected_delivered") return "estimated RTO loss avoided";
  if (event.eventType === "cod_converted_prepaid") return "50% estimated RTO risk reduction";
  if (event.eventType === "rto_loss_recorded") return "RTO loss recorded";
  return formula.replaceAll("_", " + ");
}

function primaryActionLabel(order: Order) {
  if (isNdrOrder(order)) return "Queue WhatsApp";
  if (order.recommendedAction === "convert_to_prepaid") return "Offer prepaid";
  if (order.recommendedAction === "call_customer") return "Call customer";
  if (order.recommendedAction === "request_address_update") return "Address needed";
  if (order.recommendedAction === "request_reattempt") return "Request reattempt";
  if (order.recommendedAction === "mark_rto" || order.recommendedAction === "rto_loss_recorded") return "Mark RTO";
  if (order.recommendedAction === "mark_cancelled") return "Cancel order";
  return "Queue WhatsApp";
}

function recommendedProfitAction(order: Order) {
  if (order.paymentMode === "COD" && order.orderValue > 999 && ["Medium", "High", "Critical"].includes(order.riskBucket)) return "Offer prepaid incentive";
  return recommendedActionLabel(order.recommendedAction);
}

function initialState(): AppState {
  const ndrCases = buildNdrCases(seedOrders);
  const brand = { ...defaultBrand, softwareCost: currentProPlan.priceMonthlyInr, monthlyOrderLimit: currentProPlan.limits.monthly_order_limit };
  const stores = [createMainStore(defaultBrand.id, "Nazrana D2C Store")];
  return {
    storageVersion,
    currentPlan: "pro",
    brand,
    orders: seedOrders,
    ndrCases,
    messages: [],
    responses: [],
    savingsEvents: seedSavingsEvents,
    actions: [],
    audits: [
      {
        id: "audit-seed",
        brandId: defaultBrand.id,
        action: "csv_imported",
        entityType: "import",
        entityId: "seed-demo",
        metadata: { source: "demo seed", rows: seedOrders.length },
        createdAt: new Date().toISOString()
      }
    ],
    imports: [],
    stores,
    policyRecommendations: [],
    weeklyReports: [],
    monthlyStrategyReports: [],
    policySimulations: [],
    exports: [],
    overLimit: seedOrders.length > currentProPlan.limits.monthly_order_limit
  };
}

export default function Home() {
  const [view, setView] = useState<View>("briefing");
  const [role, setRole] = useState<Role>("ops");
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(seedOrders[0]?.id || "");
  const [filters, setFilters] = useState<OrderFilters>({ payment: "all", risk: "all", courier: "all", query: "", quick: "all" });
  const [toast, setToast] = useState("Demo data loaded.");
  const [upload, setUpload] = useState<{ filename: string; csv: string; analysis?: ReturnType<typeof analyzeCsvImport> }>({ filename: "", csv: "" });
  const [templateType, setTemplateType] = useState<TemplateType>("cod_confirmation");
  const [dateRange, setDateRange] = useState("30d");
  const [demoProfile, setDemoProfile] = useState<DemoProfileId>("fashion");
  const [demoOrderCount, setDemoOrderCount] = useState(1400);

  useEffect(() => {
    const loaded = loadWorkspaceState(initialState());
    setState({ ...initialState(), ...loaded, storageVersion, ndrCases: buildNdrCases(loaded.orders || [], loaded.ndrCases || []) });
    setSelectedOrderId(loaded.orders?.[0]?.id || "");
    setToast(loaded.migrationWarning || "Starter workspace loaded.");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveWorkspaceState(state);
  }, [hydrated, state]);

  useEffect(() => {
    setState((current) => ({ ...current, ndrCases: buildNdrCases(current.orders, current.ndrCases) }));
  }, [state.orders]);

  const { brand, orders, ndrCases, messages, responses, savingsEvents, actions, audits, imports, currentPlan } = state;
  const stores = state.stores || [];
  const roi = useMemo(() => calculateRoi(orders, savingsEvents, brand), [orders, savingsEvents, brand]);
  const report = useMemo(() => generateAuditReport(orders, brand), [orders, brand]);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || orders[0];
  const lastImport = imports[0];
  const dataQualityScore = useMemo(() => {
    if (!orders.length) return 0;
    const penalty = orders.reduce((sum, order) => {
      return (
        sum +
        (!order.pincode ? 14 : 0) +
        (!order.courier ? 12 : 0) +
        (!order.orderValue ? 12 : 0) +
        (order.paymentMode === "Unknown" ? 14 : 0) +
        (!order.sku ? 8 : 0) +
        (!order.campaignName && !order.utmCampaign ? 8 : 0) +
        (isNdrOrder(order) && !order.ndrReason ? 10 : 0)
      );
    }, 0);
    return Math.max(0, 100 - Math.round(penalty / orders.length));
  }, [orders]);

  const filteredOrders = orders.filter((order) => {
    if (filters.payment !== "all" && order.paymentMode !== filters.payment) return false;
    if (filters.risk !== "all" && order.riskBucket !== filters.risk) return false;
    if (filters.courier !== "all" && order.courier !== filters.courier) return false;
    if (filters.quick === "highRiskCod" && !(order.paymentMode === "COD" && ["High", "Critical"].includes(order.riskBucket))) return false;
    if (filters.quick === "weakAddress" && !order.addressIssues.length) return false;
    if (filters.quick === "ndr" && !isNdrOrder(order)) return false;
    if (filters.quick === "prepaid" && !(order.paymentMode === "COD" && ["Medium", "High", "Critical"].includes(order.riskBucket) && order.orderValue >= 999)) return false;
    if (filters.quick === "delivered" && !/delivered/i.test(order.finalStatus || "")) return false;
    if (filters.quick === "rto" && !/rto/i.test(order.finalStatus || "")) return false;
    if (filters.quick === "needsAction" && (order.actionStatus === "done" || isDeliveredNoAction(order))) return false;
    const haystack = `${order.orderId} ${order.awb} ${order.customerName} ${order.phone} ${order.pincode} ${order.sku} ${order.productName}`.toLowerCase();
    return haystack.includes(filters.query.toLowerCase());
  });

  const actionGroups = useMemo(() => buildActionGroups(orders, ndrCases), [orders, ndrCases]);
  const proLimitWarning = getProLimitWarning(orders.length, currentProPlan);

  function addAudit(input: Omit<AuditLog, "id" | "brandId" | "createdAt">) {
    const eventTypeByAuditAction = {
      "brand.updated": "brand.updated",
      csv_imported: "csv.imported",
      order_updated: "order.updated",
      "ndr.detected": "ndr.detected",
      "message.queued": "message.queued",
      customer_response_recorded: "customer.response.recorded",
      "customer.response.recorded": "customer.response.recorded",
      action_completed: "action.completed",
      "action.completed": "action.completed",
      "savings.event.created": "savings.event.created",
      data_deleted: "data.deleted"
    } as const;
    const eventType = eventTypeByAuditAction[input.action as keyof typeof eventTypeByAuditAction];
    if (eventType) publishEvent({ type: eventType, sourceFeature: "audit", entityType: input.entityType, entityId: input.entityId, payload: input.metadata || {} });
    setState((current) => ({
      ...current,
      audits: [
        {
          id: nowId("audit"),
          brandId: current.brand.id,
          createdAt: new Date().toISOString(),
          ...input
        },
        ...current.audits
      ]
    }));
  }

  function updateBrand(field: keyof BrandSettings, value: string | number | string[]) {
    setState((current) => ({ ...current, brand: updateBrandSettings(current.brand, { [field]: value }) }));
    setToast("Brand settings saved locally.");
    addAudit({ action: "brand.updated", entityType: "brand", entityId: brand.id, metadata: { field } });
  }

  async function handleCsvSelected(file?: File) {
    if (!file) return;
    const csv = await file.text();
    const analysis = analyzeCsvImport(csv);
    setUpload({ filename: file.name, csv, analysis });
    setToast(`${file.name} parsed. Review preview and validation before import.`);
    addAudit({ action: "csv_uploaded", entityType: "import", metadata: { filename: file.name, rows: analysis.rows.length } });
  }

  function runImport() {
    if (!upload.csv) return;
    const importId = nowId("import");
    const { summary, orders: nextOrders, ndrCases: nextNdrCases } = runImportPipeline({
      csv: upload.csv,
      brandId: brand.id,
      settings: brand,
      existingOrders: orders,
      existingNdrCases: ndrCases,
      importId
    });
    const record: ImportRecord = {
      id: importId,
      brandId: brand.id,
      filename: upload.filename || "uploaded.csv",
      sourceType: "csv",
      rowCount: summary.rowCount,
      successCount: summary.successCount,
      errorCount: summary.errorCount,
      created: summary.created,
      updated: summary.updated,
      missingFields: summary.missingFields,
      createdAt: new Date().toISOString()
    };
    setState((current) => ({
      ...current,
      orders: nextOrders,
      imports: [record, ...current.imports],
      ndrCases: nextNdrCases,
      overLimit: nextOrders.length > currentProPlan.limits.monthly_order_limit
    }));
    setToast(`${summary.limitWarning ? `${summary.limitWarning} ` : ""}Last import: ${summary.successCount} rows imported, ${summary.created} created, ${summary.updated} updated, ${summary.errorCount} invalid.`);
    addAudit({ action: "csv_imported", entityType: "import", entityId: importId, metadata: { ...record } });
  }

  function queueMessage(order: Order, selectedTemplate: TemplateType) {
    const ndr = ndrCases.find((item) => item.orderId === order.id);
    let message: Message;
    try {
      message = queueMockMessage({ brand, order, ndrCase: ndr, templateType: selectedTemplate });
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not queue message.");
      return;
    }
    setState((current) => ({
      ...current,
      messages: [message, ...current.messages],
      ndrCases: current.ndrCases.map((item) =>
        item.id === ndr?.id
          ? {
              ...item,
              state: "message_queued",
              actionStatus: "waiting_customer",
              timeline: [
                { id: nowId("tl"), type: "message_queued", label: `${selectedTemplate.replaceAll("_", " ")} queued`, createdAt: new Date().toISOString() },
                ...item.timeline
              ],
              updatedAt: new Date().toISOString()
            }
          : item
      )
    }));
    setToast("WhatsApp message queued in mock outbox.");
    addAudit({ action: "message.queued", entityType: "message", entityId: message.id, metadata: { orderId: order.orderId, template: selectedTemplate } });
  }

  function updateMessageStatus(message: Message, status: Message["status"]) {
    setState((current) => ({
      ...current,
      messages: current.messages.map((item) =>
        item.id === message.id
          ? { ...item, status, sentAt: status === "sent" || status === "manually_sent" ? new Date().toISOString() : item.sentAt, respondedAt: status === "responded" ? new Date().toISOString() : item.respondedAt }
          : item
      )
    }));
    setToast(`Message marked ${status}.`);
  }

  function createSavingsForIntent(order: Order, intent: CustomerIntent): SavingsEvent | undefined {
    if (intent === "cancel_order" && !/rto|delivered/i.test(order.finalStatus || "")) {
      return {
        id: nowId("saving"),
        brandId: brand.id,
        orderId: order.id,
        eventType: "cancelled_before_shipping",
        estimatedSaving: cancelledBeforeShippingSaving(brand),
        calculation: { formula: "forward_shipping_cost + packaging_cost + estimated_cac" },
        createdAt: new Date().toISOString()
      };
    }
    if (intent === "convert_prepaid") {
      return {
        id: nowId("saving"),
        brandId: brand.id,
        orderId: order.id,
        eventType: "cod_converted_prepaid",
        estimatedSaving: codConvertedPrepaidSaving(brand),
        calculation: { formula: "50% of estimated RTO loss as risk reduction" },
        createdAt: new Date().toISOString()
      };
    }
    return undefined;
  }

  function recordResponse(order: Order, rawResponse: string, messageId?: string) {
    const detected = detectIntent(rawResponse);
    const next = nextActionAfterResponse(order, detected.intent);
    const ndr = ndrCases.find((item) => item.orderId === order.id);
    const response: CustomerResponse = {
      id: nowId("response"),
      brandId: brand.id,
      orderId: order.id,
      ndrCaseId: ndr?.id,
      channel: messageId ? "whatsapp" : "manual",
      rawResponse,
      intent: detected.intent,
      confidence: detected.confidence,
      messageId,
      createdAt: new Date().toISOString()
    };
    const saving = createSavingsForIntent(order, detected.intent);
    if (saving) {
      publishEvent({
        type: "savings.event.created",
        sourceFeature: "responses",
        entityType: "savings_event",
        entityId: saving.id,
        payload: { eventType: saving.eventType, estimatedSaving: saving.estimatedSaving, orderId: saving.orderId }
      });
    }

    setState((current) => ({
      ...current,
      responses: [response, ...current.responses],
      savingsEvents: saving ? [saving, ...current.savingsEvents] : current.savingsEvents,
      messages: current.messages.map((item) => (item.id === messageId ? { ...item, status: "responded", respondedAt: new Date().toISOString() } : item)),
      orders: current.orders.map((item) =>
        item.id === order.id
          ? {
              ...item,
              customerResponseStatus: detected.intent,
              confirmationStatus:
                detected.intent === "confirm_delivery"
                  ? "confirmed"
                  : detected.intent === "cancel_order"
                    ? "cancelled"
                    : detected.intent === "update_address"
                      ? "address_update_requested"
                      : detected.intent === "convert_prepaid"
                        ? "prepaid_converted"
                        : item.confirmationStatus,
              recommendedAction: next.action,
              recommendedActionReason: next.reason,
              updatedAt: new Date().toISOString()
            }
          : item
      ),
      ndrCases: current.ndrCases.map((item) =>
        item.id === ndr?.id
          ? {
              ...item,
              state: detected.intent === "cancel_order" ? "cancel_requested" : detected.intent === "update_address" ? "address_update_needed" : "customer_responded",
              customerResponseStatus: detected.intent,
              recommendedAction: next.action,
              timeline: [
                { id: nowId("tl"), type: "customer_response_recorded", label: `Customer response: ${detected.intent}`, createdAt: new Date().toISOString() },
                ...item.timeline
              ],
              updatedAt: new Date().toISOString()
            }
          : item
      )
    }));
    setToast(`Response recorded as ${detected.intent}.`);
    addAudit({ action: "customer_response_recorded", entityType: "customer_response", entityId: response.id, metadata: { intent: detected.intent, orderId: order.orderId } });
  }

  function completeAction(order: Order, actionType: RecommendedAction, note = "Completed from control room") {
    const ndr = ndrCases.find((item) => item.orderId === order.id);
    const action: ActionItem = {
      id: nowId("action"),
      brandId: brand.id,
      orderId: order.id,
      ndrCaseId: ndr?.id,
      actionType,
      status: "completed",
      notes: note,
      createdBy: role,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
    publishEvent({ type: "action.created", sourceFeature: "actions", entityType: "action", entityId: action.id, payload: { orderId: order.id, actionType } });
    setState((current) => ({
      ...current,
      actions: [action, ...current.actions],
      orders: current.orders.map((item) => (item.id === order.id ? { ...item, actionStatus: "done", updatedAt: new Date().toISOString() } : item)),
      ndrCases: current.ndrCases.map((item) =>
        item.id === ndr?.id
          ? {
              ...item,
              actionStatus: "customer_responded",
              state: actionType === "request_reattempt" ? "reattempt_requested" : actionType === "request_address_update" ? "address_update_needed" : item.state,
              timeline: [{ id: nowId("tl"), type: "action_completed", label: `${recommendedActionLabel(actionType)} completed`, createdAt: new Date().toISOString() }, ...item.timeline],
              updatedAt: new Date().toISOString()
            }
          : item
      )
    }));
    setToast(`${recommendedActionLabel(actionType)} marked done.`);
    addAudit({ action: "action_completed", entityType: "action", entityId: action.id, metadata: { orderId: order.orderId, actionType } });
  }

  function updateNdrOutcome(order: Order, outcome: "delivered_after_ndr" | "rto" | "cancel_requested" | "reattempt_requested" | "address_update_needed" | "call_needed" | "called", note?: string) {
    const ndr = ndrCases.find((item) => item.orderId === order.id);
    const finalStatus = outcome === "delivered_after_ndr" ? "Delivered after NDR" : outcome === "rto" ? "RTO" : order.finalStatus;
    const saving =
      outcome === "delivered_after_ndr"
        ? {
            id: nowId("saving"),
            brandId: brand.id,
            orderId: order.id,
            eventType: "ndr_rescued_delivered" as const,
            estimatedSaving: ndrRescuedDeliveredSaving(brand),
            calculation: { formula: "forward_shipping_cost + return_shipping_cost + packaging_cost + estimated_cac + cod_fee + support_ops_cost" },
            createdAt: new Date().toISOString()
          }
        : outcome === "rto"
          ? {
              id: nowId("saving"),
              brandId: brand.id,
              orderId: order.id,
              eventType: "rto_loss_recorded" as const,
              estimatedSaving: -estimatedRtoLossPerOrder(brand),
              calculation: { formula: "RTO loss recorded for leakage reporting" },
              createdAt: new Date().toISOString()
            }
          : undefined;
    if (saving) {
      publishEvent({
        type: "savings.event.created",
        sourceFeature: "ndr",
        entityType: "savings_event",
        entityId: saving.id,
        payload: { eventType: saving.eventType, estimatedSaving: saving.estimatedSaving, orderId: saving.orderId }
      });
    }

    setState((current) => ({
      ...current,
      savingsEvents: saving ? [saving, ...current.savingsEvents] : current.savingsEvents,
      orders: current.orders.map((item) => (item.id === order.id ? { ...item, finalStatus, updatedAt: new Date().toISOString() } : item)),
      ndrCases: current.ndrCases.map((item) =>
        item.id === ndr?.id
          ? {
              ...item,
              state: outcome,
              finalOutcome: finalStatus,
              notes: note ? [note, ...(item.notes || [])] : item.notes,
              timeline: [{ id: nowId("tl"), type: "final_outcome", label: outcome.replaceAll("_", " "), createdAt: new Date().toISOString() }, ...item.timeline],
              updatedAt: new Date().toISOString()
            }
          : item
      )
    }));
    setToast(`NDR case updated: ${outcome.replaceAll("_", " ")}.`);
    completeAction(order, outcome === "rto" ? "mark_rto" : outcome === "delivered_after_ndr" ? "request_reattempt" : order.recommendedAction, note || outcome);
  }

  function resetDemoData() {
    const fresh = initialState();
    setState(fresh);
    setSelectedOrderId(fresh.orders[0]?.id || "");
    setToast("Demo workspace reset.");
    saveWorkspaceState(fresh);
  }

  function downloadText(filename: string, content: string, mimeType = "text/plain") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function loadGeneratedDemoData(profileId = demoProfile, count = demoOrderCount) {
    const generated = generateDemoWorkspace({ profileId, orderCount: count, seed: 5000 + count });
    const stores = [createMainStore(generated.brand.id, `${generated.profile.category} Main Store`)];
    const nextState: AppState = {
      ...initialState(),
      currentPlan: "pro",
      brand: generated.brand,
      orders: generated.orders.map((order) => ({ ...order, storeId: stores[0].id })),
      ndrCases: generated.ndrCases,
      messages: [],
      responses: [],
      savingsEvents: generated.savingsEvents,
      actions: [],
      imports: generated.imports,
      stores,
      policyRecommendations: [],
      weeklyReports: [],
      monthlyStrategyReports: [],
      policySimulations: [],
      exports: [],
      audits: [
        {
          id: nowId("audit"),
          brandId: generated.brand.id,
          action: "csv_imported",
          entityType: "import",
          entityId: generated.imports[0].id,
          metadata: { source: "generated demo data", profile: generated.profile.label, rows: generated.orders.length },
          createdAt: new Date().toISOString()
        }
      ],
      overLimit: generated.orders.length > currentProPlan.limits.monthly_order_limit,
      storageVersion
    };
    setState(nextState);
    setSelectedOrderId(nextState.orders[0]?.id || "");
    setToast(`${generated.profile.label} demo loaded with ${generated.orders.length.toLocaleString("en-IN")} fictional orders.`);
    saveWorkspaceState(nextState);
  }

  function exportDemoWorkspace() {
    downloadText("supportwaala-demo-workspace.json", exportWorkspaceBackup(state), "application/json");
    addAudit({ action: "export_created", entityType: "export", metadata: { orders: orders.length, source: "demo workspace export" } });
  }

  function exportCurrentOrdersCsv() {
    downloadText("supportwaala-demo-orders.csv", ordersToCsv(orders), "text/csv");
    addAudit({ action: "export_created", entityType: "export", metadata: { orders: orders.length, source: "orders csv export" } });
  }

  function deleteImportedData() {
    const deletionAudit: AuditLog = {
      id: nowId("audit"),
      brandId: brand.id,
      action: "data_deleted",
      entityType: "data",
      metadata: { orders: orders.length, messages: messages.length },
      createdAt: new Date().toISOString()
    };
    setState({ ...initialState(), brand, orders: [], ndrCases: [], messages: [], responses: [], savingsEvents: [], actions: [], imports: [], audits: [deletionAudit, ...audits] });
    publishEvent({ type: "data.deleted", sourceFeature: "privacy", entityType: "data", entityId: brand.id, payload: deletionAudit.metadata || {} });
    setSelectedOrderId("");
    setToast("Imported/demo operational data deleted locally.");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brandmark">
          <span className="brandmark__icon">SW</span>
          <span>SupportWaala</span>
        </div>
        <div className="tagline">RTOShield by SupportWaala helps Indian D2C brands find COD/RTO leakage, work the highest-value actions, and prove estimated savings.</div>
        <div className="nav">
          {roleNavGroups(role).map((group) => (
            <div className="nav-section" key={group.title}>
              <div className="nav-section-title">{group.title}</div>
              {group.links.map((item) =>
                item.href ? (
                  <Link className="nav-link" href={item.href} key={item.href}>{item.label}</Link>
                ) : (
                  <button className={view === item.id ? "active" : ""} key={item.id} onClick={() => item.id && setView(item.id)}>
                    <span>{item.label}</span>
                    {item.badge ? <span className="badge neutral">{item.badge}</span> : null}
                  </button>
                )
              )}
            </div>
          ))}
        </div>
        <button className="button secondary full dev-reset" onClick={resetDemoData}>Reset demo data</button>
      </aside>
      <main className="main">
        <div className="topbar">
          <div>
            <h1>{viewLabels[view] || "SupportWaala"}</h1>
            <div className="muted">{brand.name} · {currentProPlan.name} plan · {orders.length.toLocaleString("en-IN")} orders · {dateRange === "30d" ? "Last 30 days" : dateRange}</div>
          </div>
          <div className="toolbar tight">
            <DataQualityBadge score={dataQualityScore} />
            <select className="select" value={dateRange} onChange={(event) => setDateRange(event.target.value)} aria-label="Date range">
              <option value="7d">Last 7 days</option>
              <option value="14d">Last 14 days</option>
              <option value="30d">Last 30 days</option>
              <option value="month">This month</option>
            </select>
            <select className="select" value={role} onChange={(event) => setRole(event.target.value as Role)} aria-label="Role">
              <option value="admin">Admin</option>
              <option value="ops">Ops</option>
              <option value="analyst">Analyst</option>
              <option value="viewer">Viewer</option>
            </select>
            <button className="button secondary" onClick={() => setView("upload")}>Upload CSV</button>
            <button className="button" onClick={() => setView("demo")}>Run demo</button>
          </div>
        </div>
        {toast && <div className="toast">{toast}</div>}
        {lastImport?.filename.startsWith("generated-") && <DemoModeBanner>{lastImport.filename} is active in this browser workspace.</DemoModeBanner>}
        {proLimitWarning && <div className="notice">{proLimitWarning}</div>}
        <WorkspaceSummary orders={orders} roi={roi} lastImport={lastImport} />

        {view === "briefing" && (
          <MorningBriefing
            orders={orders}
            ndrCases={ndrCases}
            actionGroups={actionGroups}
            brand={brand}
            savingsEvents={savingsEvents}
            setView={setView}
            queueMessage={queueMessage}
            completeAction={completeAction}
          />
        )}

        {view === "dashboard" && (
          <Dashboard roi={roi} actionGroups={actionGroups} brand={brand} savingsEvents={savingsEvents} orders={orders} setView={setView} />
        )}

        {view === "demo" && (
          <DemoView
            profileId={demoProfile}
            setProfileId={setDemoProfile}
            orderCount={demoOrderCount}
            setOrderCount={setDemoOrderCount}
            orders={orders}
            ndrCases={ndrCases}
            messages={messages}
            responses={responses}
            savingsEvents={savingsEvents}
            actions={actions}
            loadGeneratedDemoData={loadGeneratedDemoData}
            resetDemoData={resetDemoData}
            exportDemoWorkspace={exportDemoWorkspace}
            exportCurrentOrdersCsv={exportCurrentOrdersCsv}
            setView={setView}
            queueMessage={queueMessage}
            recordResponse={recordResponse}
            completeAction={completeAction}
            updateNdrOutcome={updateNdrOutcome}
          />
        )}

        {view === "brand" && (
          <BrandView brand={brand} updateBrand={updateBrand} />
        )}

        {view === "upload" && (
          <UploadView upload={upload} handleCsvSelected={handleCsvSelected} runImport={runImport} imports={imports} orders={orders} setView={setView} />
        )}

        {view === "stores" && <ProView view={view} brand={brand} orders={orders} stores={stores} messages={messages} savingsEvents={savingsEvents} role={role} />}

        {view === "orders" && (
          <OrdersView
            orders={filteredOrders}
            allOrders={orders}
            role={role}
            brand={brand}
            filters={filters}
            setFilters={setFilters}
            selectedOrder={selectedOrder}
            setSelectedOrderId={setSelectedOrderId}
            queueMessage={queueMessage}
            recordResponse={recordResponse}
            completeAction={completeAction}
            messages={messages}
            responses={responses}
          />
        )}

        {view === "rules" && <ProView view={view} brand={brand} orders={orders} stores={stores} messages={messages} savingsEvents={savingsEvents} role={role} />}

        {view === "ndr" && (
          <NdrView
            orders={orders}
            role={role}
            brand={brand}
            ndrCases={ndrCases}
            queueMessage={queueMessage}
            recordResponse={recordResponse}
            updateNdrOutcome={updateNdrOutcome}
          />
        )}

        {view === "ndrPlaybooks" && <ProView view={view} brand={brand} orders={orders} stores={stores} messages={messages} savingsEvents={savingsEvents} role={role} />}

        {view === "actions" && (
          <ActionsView groups={actionGroups} role={role} brand={brand} orders={orders} queueMessage={queueMessage} completeAction={completeAction} />
        )}

        {view === "prepaid" && (
          <PrepaidView orders={orders} brand={brand} queueMessage={queueMessage} completeAction={completeAction} setSelectedOrderId={setSelectedOrderId} setView={setView} />
        )}

        {view === "savings" && (
          <SavingsView
            orders={orders}
            brand={brand}
            stores={stores}
            messages={messages}
            savingsEvents={savingsEvents}
            setSavingsEvents={(next) => setState((current) => ({ ...current, savingsEvents: next }))}
          />
        )}

        {view === "simulator" && (
          <PolicySimulatorView orders={orders} brand={brand} />
        )}

        {["onboarding", "pincode", "courier", "sku", "campaigns", "weekly", "monthly", "integrations", "sops"].includes(view) && (
          <ProView view={view} brand={brand} orders={orders} stores={stores} messages={messages} savingsEvents={savingsEvents} role={role} />
        )}

        {view === "templates" && selectedOrder && (
          <TemplatesView
            orders={orders}
            ndrCases={ndrCases}
            brand={brand}
            selectedOrder={selectedOrder}
            setSelectedOrderId={setSelectedOrderId}
            templateType={templateType}
            setTemplateType={setTemplateType}
            queueMessage={queueMessage}
            messages={messages}
            updateMessageStatus={updateMessageStatus}
            recordResponse={recordResponse}
          />
        )}

        {view === "reports" && (
          <ReportsView report={report} />
        )}

        {view === "privacy" && (
          <PrivacyView role={role} orders={orders} messages={messages} responses={responses} imports={imports} audits={audits} deleteImportedData={deleteImportedData} />
        )}

        {view === "billing" && (
          <BillingView currentPlan={currentPlan} orderCount={orders.length} />
        )}
      </main>
    </div>
  );
}

function WorkspaceSummary({ orders, roi, lastImport }: { orders: Order[]; roi: ReturnType<typeof calculateRoi>; lastImport?: ImportRecord }) {
  return (
    <div className="workspace-strip">
      <strong>Current workspace:</strong> {orders.length} orders · {roi.codOrders} COD · {roi.totalRto} RTO · {roi.ndrCases} NDR cases
      <span className="divider">|</span>
      <strong>Last import:</strong>{" "}
      {lastImport
        ? `${lastImport.successCount} rows imported, ${lastImport.created} created, ${lastImport.updated} updated, ${lastImport.errorCount} invalid`
        : "No CSV import in this workspace yet"}
    </div>
  );
}

function Dashboard({ roi, actionGroups, brand, savingsEvents, orders, setView }: {
  roi: ReturnType<typeof calculateRoi>;
  actionGroups: Record<string, Order[]>;
  brand: BrandSettings;
  savingsEvents: SavingsEvent[];
  orders: Order[];
  setView: (view: View) => void;
}) {
  const recoverableLeakage = estimatedRecoverableLeakage(orders, brand);
  const openActions = Object.values(actionGroups).flat();
  const topActions = openActions
    .sort((a, b) => estimatedLeakageForOrder(b, brand) - estimatedLeakageForOrder(a, brand))
    .slice(0, 5);
  const statusRows = [
    { label: "Delivered", value: orders.filter((order) => /delivered/i.test(order.finalStatus || "")).length, tone: "success" },
    { label: "RTO", value: roi.totalRto, tone: "danger" },
    { label: "NDR", value: roi.ndrCases, tone: "warning" },
    { label: "In transit", value: orders.filter((order) => /transit|picked|ofd/i.test(`${order.finalStatus} ${order.shipmentStatus}`)).length, tone: "neutral" }
  ];
  const pincodePolicies = analyzePincodePolicies(orders, brand);
  const courierPolicies = analyzeCourierPolicies(orders, brand).recommendations;
  const skuLeakage = analyzeSkuLeakage(orders, brand);
  const campaignLeakage = analyzeCampaignLeakage(orders, brand);
  const leakageDrivers = [
    { label: "Pincode", value: pincodePolicies[0]?.estimatedLeakage || 0 },
    { label: "Courier", value: courierPolicies[0]?.estimatedLeakage || 0 },
    { label: "SKU", value: skuLeakage[0]?.estimatedLoss || 0 },
    { label: "NDR reason", value: orders.filter(isNdrOrder).length * estimatedRtoLossPerOrder(brand) * 0.3 },
    { label: "Campaign", value: campaignLeakage[0]?.estimatedLoss || 0 }
  ].sort((a, b) => b.value - a.value);
  const nextBestPincode = pincodePolicies[0];
  const nextBestMove = nextBestPincode
    ? `${nextBestPincode.recommendation} Estimated leakage affected: ${money(nextBestPincode.estimatedLeakage)}.`
    : "Load demo data or upload a seller CSV to unlock policy recommendations.";

  return (
    <div className="grid">
      <section className="hero-insight">
        <div>
          <h2>RTOShield by SupportWaala</h2>
          <div className="hero-insight__value">{money(recoverableLeakage)}</div>
          <p>Estimated preventable leakage this month. Start with the business problem, then the daily recovery workflow: COD failures, weak addresses, courier lanes, and delayed NDR action.</p>
          <div className="toolbar tight">
            <button className="button" onClick={() => setView("actions")}>Open today&apos;s action queue</button>
            <button className="button secondary" onClick={() => setView("reports")}>Review leakage report</button>
          </div>
        </div>
        <div>
          <h3>Next best move</h3>
          <p>{nextBestMove}</p>
          <span className="impact-pill">Estimated, not guaranteed</span>
        </div>
      </section>
      <ClientStory />
      <ServiceProductMap setView={setView} />
      {roi.lowSampleSize && <div className="notice">Low sample size: use at least 50 orders for credible leakage estimates. Upload the large sample or seller CSV before making claims.</div>}
      <div className="grid metrics">
        <MetricCard title="Total orders" value={roi.totalOrders.toLocaleString("en-IN")} description="Imported or generated workspace" onClick={() => setView("orders")} />
        <MetricCard title="COD orders" value={`${roi.codOrders} (${percent(roi.totalOrders ? roi.codOrders / roi.totalOrders : 0)})`} tone="warning" description="COD exposure drives most RTO risk" onClick={() => setView("orders")} />
        <MetricCard title="RTO orders" value={`${roi.totalRto} (${percent(roi.rtoRate)})`} tone="danger" description="Confirmed leakage" onClick={() => setView("reports")} />
        <MetricCard title="COD RTO %" value={percent(roi.codRtoRate)} tone="danger" description="Click to inspect COD risk" onClick={() => setView("orders")} />
        <MetricCard title="NDR cases" value={roi.ndrCases} tone="warning" description="Warning stage before RTO" onClick={() => setView("ndr")} />
        <MetricCard title="Estimated RTO loss" value={money(roi.estimatedRtoLoss)} tone="danger" description="Based on brand cost assumptions" onClick={() => setView("reports")} />
        <MetricCard title="Estimated savings" value={money(roi.estimatedSavings)} tone="success" description="Recorded events only" onClick={() => setView("savings")} />
        <MetricCard title="Open actions" value={openActions.length} tone="info" description="Actionable queue, delivered orders excluded" onClick={() => setView("actions")} />
      </div>
      <div className="chart-grid">
        <div className="panel">
          <h2>COD vs Prepaid</h2>
          <DonutChart label="COD" value={roi.codOrders} total={Math.max(roi.totalOrders, 1)} />
        </div>
        <div className="panel">
          <h2>Delivery Outcome Mix</h2>
          <BarList rows={statusRows} />
        </div>
      </div>
      <div className="grid two-col">
        <div className="panel">
          <h2>Top 5 Actions Today</h2>
          <div className="action-group">
            {topActions.length ? topActions.map((order) => (
              <div className="action-row" key={order.id}>
                <div className="split">
                  <strong>{recommendedProfitAction(order)}</strong>
                  <span className={`badge ${riskClass(order.riskBucket)}`}>{order.riskBucket}</span>
                </div>
                <div className="muted">{order.orderId} · {order.pincode} · {order.courier}</div>
                <div>{money(estimatedLeakageForOrder(order, brand))} estimated impact</div>
                <div className="muted">{order.recommendedActionReason}</div>
                <button className="button secondary" onClick={() => setView("actions")}>Open action</button>
              </div>
            )) : <EmptyState title="No open actions" description="Delivered/no-action orders are intentionally kept out of the daily queue." />}
          </div>
        </div>
        <div className="panel">
          <h2>Leakage By Driver</h2>
          <BarList rows={leakageDrivers.map((item, index) => ({ ...item, tone: index === 0 ? "danger" : index === 1 ? "warning" : "neutral", valueLabel: money(item.value) }))} />
          <div className="recommendation-strip">
            <strong>What changed</strong>
            <span>{roi.totalRto} RTO orders, {roi.ndrCases} NDR cases, {openActions.length} open actions, and {money(roi.estimatedSavings)} estimated savings events are visible in this workspace.</span>
          </div>
        </div>
      </div>
      <InsightCard
        title="Founder Summary"
        insight={`Current estimated RTO loss is ${money(roi.estimatedRtoLoss)}. The highest priority is to work the open action queue before NDR cases cross SLA.`}
        recommendation={nextBestMove}
        confidence={orders.length >= 500 ? "High" : orders.length >= 100 ? "Medium" : "Low"}
        impact={`${money(roi.netBenefit)} net estimated benefit recorded`}
        actionLabel="Open weekly report"
        onAction={() => setView("weekly")}
      />
      {savingsEvents.length ? (
        <div className="panel">
          <h2>Recent Savings Events</h2>
          <div className="grid report-grid">
            {savingsEvents.slice(0, 6).map((event) => (
              <div className="action-row" key={event.id}>
                <strong>{event.eventType.replaceAll("_", " ")}</strong>
                <div className="muted">{orders.find((order) => order.id === event.orderId)?.orderId || event.orderId} · {money(event.estimatedSaving)} estimated · {formulaNote(event)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MorningBriefing({ orders, ndrCases, actionGroups, brand, savingsEvents, setView, queueMessage, completeAction }: {
  orders: Order[];
  ndrCases: NdrCase[];
  actionGroups: Record<string, Order[]>;
  brand: BrandSettings;
  savingsEvents: SavingsEvent[];
  setView: (view: View) => void;
  queueMessage: (order: Order, template: TemplateType) => void;
  completeAction: (order: Order, actionType: RecommendedAction, note?: string) => void;
}) {
  const allActions = Object.values(actionGroups).flat();
  const criticalActions = allActions.filter((order) => order.riskBucket === "Critical");
  const highActions = allActions.filter((order) => order.riskBucket === "High");
  const criticalValue = criticalActions.reduce((sum, order) => sum + estimatedLeakageForOrder(order, brand), 0);
  const highValue = highActions.reduce((sum, order) => sum + estimatedLeakageForOrder(order, brand), 0);
  const urgentNdrs = ndrCases.filter((ndr) => (ndr.hoursSinceNdr || 0) >= 8 && !["delivered_after_ndr", "rto"].includes(ndr.state));
  const ndrBreachingSoon = urgentNdrs.filter((ndr) => (ndr.hoursSinceNdr || 0) >= 10).length;
  const completedToday = orders.filter((order) => order.actionStatus === "done").length;
  const todaySavings = savingsEvents.filter((event) => {
    const created = new Date(event.createdAt);
    const now = new Date();
    return created.toDateString() === now.toDateString();
  }).reduce((sum, event) => sum + event.estimatedSaving, 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const nextAction = criticalActions[0] || highActions[0] || allActions[0];

  return (
    <div className="grid">
      <section className="hero-insight">
        <div>
          <h2>{greeting}. Here is what needs your attention today.</h2>
          <div className="hero-insight__value">{money(criticalValue + highValue)}</div>
          <p>You have <strong>{criticalActions.length} critical</strong> and <strong>{highActions.length} high</strong> actions worth {money(criticalValue + highValue)} in recoverable leakage. {ndrBreachingSoon > 0 ? `${ndrBreachingSoon} NDR${ndrBreachingSoon > 1 ? "s" : ""} will breach SLA within 2 hours.` : "NDR queue is within SLA."}</p>
          <div className="toolbar tight">
            <button className="button" onClick={() => setView("actions")}>Start with critical actions</button>
            <button className="button secondary" onClick={() => setView("ndr")}>Review NDR rescue</button>
          </div>
        </div>
        <div>
          <h3>Next action</h3>
          {nextAction ? (
            <>
              <p><strong>{recommendedProfitAction(nextAction)}</strong> · {nextAction.orderId}</p>
              <p className="muted">{nextAction.recommendedActionReason}</p>
              <p>{money(estimatedLeakageForOrder(nextAction, brand))} estimated impact</p>
              <div className="toolbar tight">
                <button className="button" onClick={() => queueMessage(nextAction, defaultTemplateForOrder(nextAction))}>Queue WhatsApp</button>
                <button className="button secondary" onClick={() => completeAction(nextAction, nextAction.recommendedAction, "Done from morning briefing")}>Mark done</button>
              </div>
            </>
          ) : (
            <p className="muted">All critical and high actions are complete. Great work.</p>
          )}
        </div>
      </section>

      <div className="grid metrics">
        <MetricCard title="Critical actions" value={criticalActions.length} tone="danger" onClick={() => setView("actions")} />
        <MetricCard title="High actions" value={highActions.length} tone="warning" onClick={() => setView("actions")} />
        <MetricCard title="NDRs near SLA breach" value={ndrBreachingSoon} tone="danger" onClick={() => setView("ndr")} />
        <MetricCard title="Completed today" value={completedToday} tone="success" />
      </div>

      {criticalActions.length === 0 && highActions.length === 0 && (
        <div className="success" style={{ borderRadius: 8, padding: 16 }}>
          <strong>All critical actions done for today.</strong> You protected an estimated {money(todaySavings)} in recoverable leakage. {todaySavings > 0 ? "This is the daily proof that the workflow is working." : ""}
        </div>
      )}

      <div className="grid two-col">
        <div className="panel">
          <h2>Quick Actions</h2>
          <div className="action-group">
            {allActions.slice(0, 5).map((order) => (
              <div className="action-row" key={order.id}>
                <div className="split">
                  <strong>{recommendedProfitAction(order)}</strong>
                  <span className={`badge ${riskClass(order.riskBucket)}`}>{order.riskBucket}</span>
                </div>
                <div className="muted">{order.orderId} · {order.pincode} · {order.courier}</div>
                <div>{money(estimatedLeakageForOrder(order, brand))} estimated impact</div>
                <div className="toolbar tight">
                  <button className="button secondary" onClick={() => queueMessage(order, defaultTemplateForOrder(order))}>Queue message</button>
                  <button className="button secondary" onClick={() => completeAction(order, order.recommendedAction, "Done from briefing")}>Mark done</button>
                </div>
              </div>
            ))}
            {allActions.length === 0 && <EmptyState title="No open actions" description="All actionable work is complete." />}
          </div>
        </div>
        <div className="panel">
          <h2>NDR Urgency</h2>
          <div className="action-group">
            {urgentNdrs.slice(0, 5).map((ndr) => {
              const order = orders.find((o) => o.id === ndr.orderId);
              if (!order) return null;
              const hoursLeft = Math.max(0, 12 - Math.round(ndr.hoursSinceNdr || 0));
              return (
                <div className="action-row" key={ndr.id}>
                  <div className="split">
                    <strong>{order.orderId}</strong>
                    <span className="badge priority-critical">{hoursLeft}h left</span>
                  </div>
                  <div className="muted">{ndr.ndrReasonRaw} · {order.pincode} · {ndr.courier}</div>
                  <div>{money(estimatedLeakageForOrder(order, brand))} at risk</div>
                  <div className="toolbar tight">
                    <button className="button secondary" onClick={() => setView("ndr")}>Open NDR</button>
                  </div>
                </div>
              );
            })}
            {urgentNdrs.length === 0 && <EmptyState title="No urgent NDRs" description="All NDR cases are within SLA." />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientStory() {
  return (
    <section className="story-strip">
      {clientStoryStages.map((stage) => (
        <div className="story-step" key={stage.label}>
          <span>{stage.label}</span>
          <strong>{stage.title}</strong>
          <p>{stage.description}</p>
        </div>
      ))}
    </section>
  );
}

function ServiceProductMap({ setView }: { setView: (view: View) => void }) {
  return (
    <section className="panel">
      <PageHeader
        title="Service Products For Different Client Personas"
        subtitle="The same RTOShield workflow is packaged by what the client is trying to improve: trust, diagnosis, pilot execution, daily operations, or founder decisions."
      />
      <div className="service-grid">
        {serviceProducts.map((product) => (
          <div className="service-card" key={product.title}>
            <div>
              <span className="service-card__persona">{product.persona}</span>
              <h3>{product.title}</h3>
              <p>{product.promise}</p>
              <div className="muted">{product.uses}</div>
            </div>
            {product.href ? (
              <Link className="button secondary" href={product.href}>{product.actionLabel}</Link>
            ) : (
              <button className="button secondary" onClick={() => product.view && setView(product.view)}>{product.actionLabel}</button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function DonutChart({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? value / total : 0;
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ "--slice": `${Math.round(pct * 100)}%` } as CSSProperties & Record<string, string>}>
        <strong>{percent(pct)}</strong>
      </div>
      <div>
        <strong>{label}</strong>
        <p className="muted">{value.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")} orders. Prepaid orders usually show lower preventable RTO exposure.</p>
      </div>
    </div>
  );
}

function BarList({ rows }: { rows: Array<{ label: string; value: number; valueLabel?: string; tone?: string }> }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="bar-list">
      {rows.map((row) => (
        <div className="bar-row" key={row.label}>
          <div className="bar-row__meta"><strong>{row.label}</strong><span>{row.valueLabel || row.value.toLocaleString("en-IN")}</span></div>
          <div className="bar-track"><span className={`bar-fill ${row.tone || ""}`} style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function DemoView({
  profileId,
  setProfileId,
  orderCount,
  setOrderCount,
  orders,
  ndrCases,
  messages,
  responses,
  savingsEvents,
  actions,
  loadGeneratedDemoData,
  resetDemoData,
  exportDemoWorkspace,
  exportCurrentOrdersCsv,
  setView,
  queueMessage,
  recordResponse,
  completeAction,
  updateNdrOutcome
}: {
  profileId: DemoProfileId;
  setProfileId: (profile: DemoProfileId) => void;
  orderCount: number;
  setOrderCount: (count: number) => void;
  orders: Order[];
  ndrCases: NdrCase[];
  messages: Message[];
  responses: CustomerResponse[];
  savingsEvents: SavingsEvent[];
  actions: ActionItem[];
  loadGeneratedDemoData: (profileId?: DemoProfileId, count?: number) => void;
  resetDemoData: () => void;
  exportDemoWorkspace: () => void;
  exportCurrentOrdersCsv: () => void;
  setView: (view: View) => void;
  queueMessage: (order: Order, template: TemplateType) => void;
  recordResponse: (order: Order, raw: string, messageId?: string) => void;
  completeAction: (order: Order, actionType: RecommendedAction, note?: string) => void;
  updateNdrOutcome: (order: Order, outcome: "delivered_after_ndr" | "rto" | "cancel_requested" | "reattempt_requested" | "address_update_needed" | "call_needed" | "called", note?: string) => void;
}) {
  const [selectedStep, setSelectedStep] = useState("load");
  const selectedProfile = demoProfiles[profileId];
  const actionableOrder = orders.find((order) => order.actionStatus !== "done" && !isDeliveredNoAction(order) && order.recommendedAction !== "no_action");
  const firstNdr = ndrCases.find((ndr) => !["delivered_after_ndr", "rto"].includes(ndr.state));
  const firstNdrOrder = firstNdr ? orders.find((order) => order.id === firstNdr.orderId) : undefined;
  const messageOrder = messages[0]?.orderId ? orders.find((order) => order.id === messages[0].orderId) : actionableOrder;
  const hasGeneratedData = orders.length >= 500;

  function queueOneMessage() {
    if (!actionableOrder) return;
    queueMessage(actionableOrder, defaultTemplateForOrder(actionableOrder));
    setSelectedStep("message");
  }

  function rescueOneNdr() {
    if (!firstNdrOrder) return;
    updateNdrOutcome(firstNdrOrder, "delivered_after_ndr", "Demo rescue: customer confirmed reattempt and order delivered.");
    setSelectedStep("ndr");
  }

  function recordOneDemoResponse() {
    if (!messageOrder) return;
    recordResponse(messageOrder, "Please reattempt tomorrow, address is correct", messages[0]?.id);
    setSelectedStep("response");
  }

  function completeOneDemoAction() {
    if (!actionableOrder) return;
    completeAction(actionableOrder, actionableOrder.recommendedAction, "Completed during guided client demo.");
    setSelectedStep("complete");
  }

  const steps = [
    { id: "load", title: "Choose client persona", description: `${selectedProfile.label}: ${selectedProfile.codPercent}% COD, ${selectedProfile.rtoPercent}% RTO target, ${selectedProfile.monthlyOrders.toLocaleString("en-IN")} monthly orders.`, done: Boolean(profileId), action: "Review profile", onClick: () => setSelectedStep("load") },
    { id: "generate", title: "Load fictional seller data", description: "Create Indian D2C orders with COD, prepaid, NDR, RTO, pincode, courier, SKU, and campaign fields.", done: hasGeneratedData, action: "Load Pro demo dataset", onClick: () => loadGeneratedDemoData(profileId, orderCount) },
    { id: "cockpit", title: "Show the business problem", description: "Start with estimated leakage, not the feature list. Explain where money is leaking first.", done: hasGeneratedData, action: "Open cockpit", onClick: () => setView("dashboard") },
    { id: "upload", title: "Optional anonymized audit data", description: "Use anonymized seller data when you want to test RTO Profit Audit as a real client.", done: false, action: "Open CSV upload", onClick: () => setView("upload") },
    { id: "insights", title: "Present RTO Profit Audit", description: "Review pincode, courier, SKU, campaign, and NDR leakage recommendations.", done: hasGeneratedData, action: "Open leakage report", onClick: () => setView("reports") },
    { id: "queue", title: "Open Daily Ops Control Room", description: "Work the prioritized actions that can reduce preventable leakage.", done: hasGeneratedData, action: "Open queue", onClick: () => setView("actions") },
    { id: "ndr", title: "Run a rescue-pilot action", description: "Simulate one delivered-after-NDR outcome and create a savings event.", done: savingsEvents.some((event) => event.eventType === "ndr_rescued_delivered"), action: "Rescue one NDR", onClick: rescueOneNdr },
    { id: "message", title: "Queue one WhatsApp message", description: "Create a mock/manual outbox item without sending a real external message.", done: messages.length > 0, action: "Queue message", onClick: queueOneMessage },
    { id: "response", title: "Record customer response", description: "Capture a manual response and update order/NDR state.", done: responses.length > 0, action: "Record response", onClick: recordOneDemoResponse },
    { id: "complete", title: "Mark one action complete", description: "Close the loop and keep the action queue operationally clean.", done: actions.some((action) => action.status === "completed"), action: "Complete action", onClick: completeOneDemoAction },
    { id: "savings", title: "Prove estimated savings", description: "Review estimated, verified, rejected, cost, and net-benefit numbers.", done: savingsEvents.length > 0, action: "Open ledger", onClick: () => setView("savings") },
    { id: "weekly", title: "Show Founder Profit Intelligence", description: "Founder-ready narrative: biggest leakage, actions completed, and next week focus.", done: hasGeneratedData, action: "Open weekly report", onClick: () => setView("weekly") },
    { id: "simulator", title: "Run policy simulator", description: "Test simple COD, pincode, courier, address, and hold policies before applying them.", done: hasGeneratedData, action: "Open simulator", onClick: () => setView("simulator") },
    { id: "export", title: "Export report/workspace", description: "Download a local JSON backup or CSV for demo handoff.", done: false, action: "Export workspace", onClick: exportDemoWorkspace }
  ];

  return (
    <div className="grid">
      <PageHeader
        title="Demo / Client Test Mode"
        subtitle="A guided SupportWaala client story: Leakage Check -> RTO Profit Audit -> 14-Day Rescue Pilot -> Daily Ops Control Room -> Founder Profit Intelligence."
        actions={
          <>
            <button className="button" onClick={() => loadGeneratedDemoData(profileId, orderCount)}>Load selected demo</button>
            <button className="button secondary" onClick={() => loadGeneratedDemoData("fashion", 1400)}>Load Pro demo dataset</button>
            <button className="button secondary" onClick={resetDemoData}>Reset demo</button>
          </>
        }
      />
      <DemoModeBanner>Choose a profile, generate a workspace, then show the client how SupportWaala moves from leakage diagnosis to daily action and estimated savings proof.</DemoModeBanner>
      <div className="grid two-col">
        <div className="panel">
          <h2>Business Profile</h2>
          <div className="form-grid">
            <label>
              <span className="muted">Profile</span>
              <select className="select" value={profileId} onChange={(event) => setProfileId(event.target.value as DemoProfileId)}>
                {Object.values(demoProfiles).map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
              </select>
            </label>
            <label>
              <span className="muted">Order count</span>
              <input className="input" type="number" min={500} max={5000} value={orderCount} onChange={(event) => setOrderCount(Number(event.target.value))} />
            </label>
            <label>
              <span className="muted">Category</span>
              <input className="input" readOnly value={selectedProfile.category} />
            </label>
          </div>
          <div className="grid metrics">
            <MetricCard title="Monthly orders" value={selectedProfile.monthlyOrders.toLocaleString("en-IN")} />
            <MetricCard title="COD share" value={`${selectedProfile.codPercent}%`} tone="warning" />
            <MetricCard title="RTO target" value={`${selectedProfile.rtoPercent}%`} tone="danger" />
            <MetricCard title="AOV" value={money(selectedProfile.averageOrderValue)} />
          </div>
          <div className="chips">
            {selectedProfile.topRiskyPincodes.map((pin) => <span className="chip" key={pin}>Risk pincode {pin}</span>)}
          </div>
        </div>
        <div className="panel">
          <h2>Current Demo Workspace</h2>
          <div className="grid metrics">
            <MetricCard title="Orders" value={orders.length.toLocaleString("en-IN")} />
            <MetricCard title="NDR cases" value={ndrCases.length} tone="warning" />
            <MetricCard title="Messages" value={messages.length} />
            <MetricCard title="Savings events" value={savingsEvents.length} tone="success" />
          </div>
          <div className="toolbar">
            <button className="button secondary" onClick={exportCurrentOrdersCsv} disabled={!orders.length}>Export orders CSV</button>
            <button className="button secondary" onClick={exportDemoWorkspace} disabled={!orders.length}>Export demo workspace</button>
          </div>
        </div>
      </div>
      <div className="panel">
        <h2>Guided Client Demo Story</h2>
        <div className="step-list">
          {steps.map((step, index) => (
            <div className={`step-item ${step.done ? "done" : ""} ${selectedStep === step.id ? "active" : ""}`} key={step.id}>
              <span className="step-index">{step.done ? "✓" : index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <div className="muted">{step.description}</div>
              </div>
              <button className="button secondary" onClick={step.onClick}>{step.action}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandView({ brand, updateBrand }: { brand: BrandSettings; updateBrand: (field: keyof BrandSettings, value: string | number | string[]) => void }) {
  return (
    <div className="panel">
      <h2>Brand Settings</h2>
      <div className="notice">{starterMultiBrandMessage()}</div>
      <div className="form-grid">
        <Field label="Brand name" value={brand.name} onChange={(value) => updateBrand("name", value)} />
        <Field label="Category" value={brand.category || "Fashion"} onChange={(value) => updateBrand("category", value)} />
        <Field label="Monthly order limit" type="number" value={brand.monthlyOrderLimit || 500} onChange={(value) => updateBrand("monthlyOrderLimit", Number(value))} />
        <Field label="Forward shipping" type="number" value={brand.forwardShippingCost} onChange={(value) => updateBrand("forwardShippingCost", Number(value))} />
        <Field label="Return shipping" type="number" value={brand.returnShippingCost} onChange={(value) => updateBrand("returnShippingCost", Number(value))} />
        <Field label="Packaging cost" type="number" value={brand.packagingCost} onChange={(value) => updateBrand("packagingCost", Number(value))} />
        <Field label="Estimated CAC" type="number" value={brand.estimatedCac} onChange={(value) => updateBrand("estimatedCac", Number(value))} />
        <Field label="COD fee" type="number" value={brand.codFee} onChange={(value) => updateBrand("codFee", Number(value))} />
        <Field label="Support ops cost" type="number" value={brand.supportOpsCost || 20} onChange={(value) => updateBrand("supportOpsCost", Number(value))} />
        <Field label="Gross margin %" type="number" value={brand.grossMarginPercent || 45} onChange={(value) => updateBrand("grossMarginPercent", Number(value))} />
        <Field label="Medium risk threshold" type="number" value={brand.riskThresholdMedium} onChange={(value) => updateBrand("riskThresholdMedium", Number(value))} />
        <Field label="High risk threshold" type="number" value={brand.riskThresholdHigh} onChange={(value) => updateBrand("riskThresholdHigh", Number(value))} />
        <Field label="Critical risk threshold" type="number" value={brand.riskThresholdCritical} onChange={(value) => updateBrand("riskThresholdCritical", Number(value))} />
        <Field label="Default language" value={brand.defaultLanguage} onChange={(value) => updateBrand("defaultLanguage", value)} />
        <Field label="Courier platforms" value={brand.courierPlatforms.join(", ")} onChange={(value) => updateBrand("courierPlatforms", value.split(",").map((item) => item.trim()).filter(Boolean))} />
        <Field label="Software cost" type="number" value={brand.softwareCost} onChange={(value) => updateBrand("softwareCost", Number(value))} />
        <Field label="WhatsApp sender" value={brand.whatsappSender || ""} onChange={(value) => updateBrand("whatsappSender", value)} />
      </div>
    </div>
  );
}

function UploadView({ upload, handleCsvSelected, runImport, imports, orders, setView }: {
  upload: { filename: string; csv: string; analysis?: ReturnType<typeof analyzeCsvImport> };
  handleCsvSelected: (file?: File) => void;
  runImport: () => void;
  imports: ImportRecord[];
  orders: Order[];
  setView: (view: View) => void;
}) {
  const analysis = upload.analysis;
  const lastImport = imports[0];
  return (
    <div className="grid">
      <div className="panel">
        <PageHeader
          title="CSV Upload"
          subtitle="Upload order, shipment, or NDR CSV safely. Valid rows import; duplicate orders update by order_id + AWB."
          actions={<button className="button secondary" onClick={() => setView("demo")}>Use demo data instead</button>}
        />
        <div className="upload-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleCsvSelected(event.dataTransfer.files?.[0]); }}>
          <strong>Drag and drop a CSV here</strong>
          <p className="muted">Accepted format: `.csv`. For the first audit, customer names, phones, emails, and full addresses are optional. You can use anonymized CSV.</p>
          <label className="button">
            Select CSV
            <input hidden type="file" accept=".csv" onChange={(event) => handleCsvSelected(event.target.files?.[0])} />
          </label>
        </div>
        <div className="notice">
          <strong>Current workspace totals:</strong> {orders.length} orders.{" "}
          <strong>Last import:</strong>{" "}
          {lastImport ? `${lastImport.successCount} rows imported, ${lastImport.created} created, ${lastImport.updated} updated, ${lastImport.errorCount} invalid.` : "No CSV imported yet."}
        </div>
        <div className="toolbar"><button className="button" disabled={!analysis} onClick={runImport}>Import valid rows</button></div>
        {analysis && (
          <div className="grid two-col">
            <div>
              <h3>{upload.filename}</h3>
              <p>{analysis.rows.length} rows parsed · {analysis.invalidRows.length} invalid rows</p>
              <DataQualityBadge score={analysis.dataQualityScore} />
              {analysis.rows.length > currentProPlan.limits.max_import_rows_per_file && (
                <div className="notice">Pro supports up to 10,000 rows per import. Larger imports are available in Scale.</div>
              )}
              {analysis.missingFields.length ? <div className="notice">Missing mapped fields: {analysis.missingFields.join(", ")}</div> : <div className="success">Required fields are mapped.</div>}
              {analysis.dataQualityWarnings?.length ? <div className="notice">Warnings: {analysis.dataQualityWarnings.join(", ")}</div> : null}
            </div>
            <div>
              <h3>Auto Mapping</h3>
              <div className="chips">
                {Object.entries(analysis.columnMapping).map(([field, original]) => <span className="chip" key={field}>{field} &larr; {original}</span>)}
              </div>
              <div className="recommendation-strip">
                <strong>Better fields unlock better insights</strong>
                <span>Campaign fields unlock campaign leakage. SKU fields unlock product leakage. NDR reason unlocks playbooks. Courier unlocks courier intelligence.</span>
              </div>
            </div>
          </div>
        )}
        {lastImport && (
          <div className="toolbar">
            <button className="button secondary" onClick={() => setView("dashboard")}>View Profit Cockpit</button>
            <button className="button secondary" onClick={() => setView("orders")}>View Order Risk</button>
            <button className="button secondary" onClick={() => setView("reports")}>View Leakage Report</button>
          </div>
        )}
      </div>
      {analysis && <PreviewTable summary={analysis} />}
      <div className="panel">
        <h2>Import History</h2>
        {imports.length ? imports.map((item) => (
          <div className="action-row" key={item.id}>
            <strong>{item.filename}</strong>
            <div className="muted">{item.successCount}/{item.rowCount} imported · {item.created} created · {item.updated} updated · {item.errorCount} invalid</div>
          </div>
        )) : <Empty text="No CSV imports yet." />}
      </div>
    </div>
  );
}

function PreviewTable({ summary }: { summary: ReturnType<typeof analyzeCsvImport> }) {
  const columns = Object.keys(summary.previewRows[0] || {}).slice(0, 12);
  return (
    <div className="panel">
      <h2>Preview First 10 Rows</h2>
      <div className="table-wrap">
        <table>
          <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {summary.previewRows.map((row, index) => (
              <tr key={index}>{columns.map((column) => <td key={column}>{row[column]}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {summary.invalidRows.length ? (
        <>
          <h3>Invalid Rows</h3>
          {summary.invalidRows.slice(0, 8).map((row) => <div className="action-row" key={row.row}>Row {row.row}: {row.issues.join(", ")}</div>)}
        </>
      ) : null}
    </div>
  );
}

function OrdersView(props: {
  orders: Order[];
  allOrders: Order[];
  role: Role;
  brand: BrandSettings;
  filters: OrderFilters;
  setFilters: (filters: OrderFilters) => void;
  selectedOrder?: Order;
  setSelectedOrderId: (id: string) => void;
  queueMessage: (order: Order, template: TemplateType) => void;
  recordResponse: (order: Order, raw: string) => void;
  completeAction: (order: Order, actionType: RecommendedAction, note?: string) => void;
  messages: Message[];
  responses: CustomerResponse[];
}) {
  const couriers = [...new Set(props.allOrders.map((order) => order.courier).filter(Boolean))].sort();
  const quickFilters = [
    ["all", "All"],
    ["needsAction", "Needs action"],
    ["highRiskCod", "High risk COD"],
    ["weakAddress", "Weak address"],
    ["ndr", "NDR"],
    ["prepaid", "Prepaid opportunity"],
    ["delivered", "Delivered"],
    ["rto", "RTO"]
  ];
  return (
    <div className="grid two-col">
      <div className="panel">
        <PageHeader title="Order Risk" subtitle="An operational ledger for risk, address quality, NDR state, recommended action, and profit exposure." />
        <FilterBar>
          <SearchInput placeholder="Search order, AWB, phone, pincode" value={props.filters.query} onChange={(value) => props.setFilters({ ...props.filters, query: value })} />
          <select className="select" value={props.filters.payment} onChange={(event) => props.setFilters({ ...props.filters, payment: event.target.value })}>
            <option value="all">All payment</option><option value="COD">COD</option><option value="Prepaid">Prepaid</option>
          </select>
          <select className="select" value={props.filters.risk} onChange={(event) => props.setFilters({ ...props.filters, risk: event.target.value })}>
            <option value="all">All risk</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
          </select>
          <select className="select" value={props.filters.courier} onChange={(event) => props.setFilters({ ...props.filters, courier: event.target.value })}>
            <option value="all">All courier</option>
            {couriers.map((courier) => <option key={courier} value={courier}>{courier}</option>)}
          </select>
        </FilterBar>
        <div className="toolbar tight">
          {quickFilters.map(([id, label]) => (
            <button className={`quick-filter ${props.filters.quick === id ? "active" : ""}`} key={id} onClick={() => props.setFilters({ ...props.filters, quick: id })}>
              {label}
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Phone</th><th>Location</th><th>Product</th><th>Value</th><th>Pay</th><th>Courier</th><th>Risk</th><th>Action</th><th>Status</th></tr>
            </thead>
            <tbody>
              {props.orders.map((order) => (
                <tr key={order.id} onClick={() => props.setSelectedOrderId(order.id)}>
                  <td><strong>{order.orderId}</strong><div className="muted">{order.awb}</div></td>
                  <td>{order.customerName}</td>
                  <td>{maskPhone(order.phone, props.role)}</td>
                  <td>{order.pincode}<div className="muted">{order.city}</div></td>
                  <td>{order.productName}<div className="muted">{order.sku}</div></td>
                  <td>{money(order.orderValue)}</td>
                  <td>{order.paymentMode}</td>
                  <td>{order.courier}</td>
                  <td><RiskBadge value={order.riskBucket} /><div className="muted">{order.riskScore}/100</div></td>
                  <td>{recommendedActionLabel(order.recommendedAction)}</td>
                  <td>{order.finalStatus || order.shipmentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {props.selectedOrder ? <OrderDetail {...props} order={props.selectedOrder} /> : <Empty text="Select an order." />}
    </div>
  );
}

function OrderDetail({ order, brand, queueMessage, recordResponse, completeAction, messages, responses }: {
  order: Order;
  brand: BrandSettings;
  queueMessage: (order: Order, template: TemplateType) => void;
  recordResponse: (order: Order, raw: string) => void;
  completeAction: (order: Order, actionType: RecommendedAction, note?: string) => void;
  messages: Message[];
  responses: CustomerResponse[];
}) {
  const [responseText, setResponseText] = useState("Reattempt tomorrow");
  const deliveredNoAction = isDeliveredNoAction(order);
  const estimatedLoss = estimatedRtoLossPerOrder(brand);
  const possibleSaving = estimatedLeakageForOrder(order, brand);
  const timelineItems = [
    ...responses.filter((item) => item.orderId === order.id).map((item) => ({ id: item.id, label: `${item.intent}: ${item.rawResponse}`, createdAt: item.createdAt })),
    ...messages.filter((item) => item.orderId === order.id).map((item) => ({ id: item.id, label: `${item.templateType}: ${item.status}`, createdAt: item.createdAt }))
  ].slice(0, 8);
  return (
    <DrawerDetailLayout title="Order Detail" meta={<RiskBadge value={order.riskBucket} />}>
      <h3>{order.orderId}</h3>
      <p className="muted">{order.customerName} · {order.city} {order.pincode} · {order.courier}</p>
      <p><span className={`badge ${riskClass(order.riskBucket)}`}>{order.riskScore} · {order.riskBucket}</span> <span className="badge neutral">{order.paymentMode}</span></p>
      <p><strong>Profit risk explanation:</strong> {order.riskReasons.join(", ")}</p>
      <p><strong>Recommended action:</strong> {recommendedProfitAction(order)}</p>
      <p className="muted">{order.recommendedActionReason}</p>
      <p><strong>Address score:</strong> {order.addressQualityScore}/100</p>
      <p><strong>Address issues:</strong> {order.addressIssues.length ? order.addressIssues.join(", ") : "None"}</p>
      <p><strong>NDR status:</strong> {order.ndrReason || /ndr/i.test(order.finalStatus || "") ? order.ndrReason || order.finalStatus : "Not in NDR"}</p>
      <p><strong>Estimated loss if RTO:</strong> {money(estimatedLoss)}</p>
      <p><strong>Possible saving if action succeeds:</strong> {money(possibleSaving)}</p>
      {deliveredNoAction ? (
        <div className="success">No action needed. This order is already delivered.</div>
      ) : (
        <>
          <div className="toolbar">
            <button className="button secondary" onClick={() => queueMessage(order, defaultTemplateForOrder(order))}>Queue WhatsApp</button>
            <button className="button secondary" onClick={() => completeAction(order, order.recommendedAction)}>Mark done</button>
          </div>
          <textarea className="textarea" value={responseText} onChange={(event) => setResponseText(event.target.value)} />
          <button className="button" onClick={() => recordResponse(order, responseText)}>Record customer response</button>
        </>
      )}
      <h3>Timeline</h3>
      <Timeline items={timelineItems} />
    </DrawerDetailLayout>
  );
}

function NdrView({ orders, role, brand, ndrCases, queueMessage, recordResponse, updateNdrOutcome }: {
  orders: Order[];
  role: Role;
  brand: BrandSettings;
  ndrCases: NdrCase[];
  queueMessage: (order: Order, template: TemplateType) => void;
  recordResponse: (order: Order, raw: string) => void;
  updateNdrOutcome: (order: Order, outcome: "delivered_after_ndr" | "rto" | "cancel_requested" | "reattempt_requested" | "address_update_needed" | "call_needed" | "called", note?: string) => void;
}) {
  const [tab, setTab] = useState("urgent");
  const [selectedNdrId, setSelectedNdrId] = useState(ndrCases[0]?.id || "");
  const activeNdrs = ndrCases.filter((ndr) => !["delivered_after_ndr", "rto"].includes(ndr.state));
  const urgentNdrs = ndrCases.filter((ndr) => ndr.urgency === "Critical" || ndr.urgency === "High");
  const breached = ndrCases.filter((ndr) => (ndr.hoursSinceNdr || 0) >= 12);
  const deliveredAfterNdr = ndrCases.filter((ndr) => ndr.state === "delivered_after_ndr").length;
  const filteredNdrs = ndrCases.filter((ndr) => {
    if (tab === "urgent") return ndr.urgency === "Critical" || ndr.urgency === "High";
    if (tab === "new") return ndr.state === "new";
    if (tab === "waiting") return ndr.actionStatus === "waiting_customer" || ndr.state === "message_queued";
    if (tab === "reattempt") return ndr.state === "reattempt_requested";
    if (tab === "address") return ndr.state === "address_update_needed";
    if (tab === "call") return ndr.state === "call_needed" || ndr.state === "called";
    if (tab === "delivered") return ndr.state === "delivered_after_ndr";
    if (tab === "rto") return ndr.state === "rto";
    if (tab === "unresolved") return ndr.state === "unresolved";
    return true;
  });
  const selectedNdr = ndrCases.find((ndr) => ndr.id === selectedNdrId) || filteredNdrs[0] || ndrCases[0];
  const selectedOrder = selectedNdr ? orders.find((order) => order.id === selectedNdr.orderId) : undefined;
  const tabs = [
    ["urgent", "Urgent"],
    ["new", "New"],
    ["waiting", "Waiting for customer"],
    ["reattempt", "Reattempt requested"],
    ["address", "Address update needed"],
    ["call", "Call needed"],
    ["delivered", "Delivered after NDR"],
    ["rto", "RTO"],
    ["unresolved", "Unresolved"]
  ];
  const recoverable = activeNdrs.reduce((sum, ndr) => {
    const order = orders.find((item) => item.id === ndr.orderId);
    return sum + (order ? estimatedLeakageForOrder(order, brand) : 0);
  }, 0);

  return (
    <div className="grid">
      <PageHeader title="NDR Rescue War Room" subtitle="Act before the courier window closes. NDR is the warning stage; RTO is the loss stage." />
      <div className="grid metrics">
        <MetricCard title="Active NDRs" value={activeNdrs.length} />
        <MetricCard title="Urgent NDRs" value={urgentNdrs.length} tone="danger" />
        <MetricCard title="SLA breached" value={breached.length} tone="danger" />
        <MetricCard title="Delivered after NDR" value={deliveredAfterNdr} tone="success" />
        <MetricCard title="Estimated recoverable leakage" value={money(recoverable)} tone="warning" />
      </div>
      <div className="toolbar tight">
        {tabs.map(([id, label]) => (
          <button className={`quick-filter ${tab === id ? "active" : ""}`} key={id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="grid two-col">
        <div className="panel">
          <h2>NDR Cases</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order</th><th>Courier</th><th>Reason</th><th>SLA</th><th>Value</th><th>State</th><th>Next Action</th></tr>
              </thead>
              <tbody>
                {filteredNdrs.map((ndr) => {
              const order = orders.find((item) => item.id === ndr.orderId);
              if (!order) return null;
              const slaClass = ndr.urgency === "Critical" ? "sla-urgent" : ndr.urgency === "High" ? "sla-warning" : "sla-fresh";
              return (
              <tr key={ndr.id} onClick={() => setSelectedNdrId(ndr.id)}>
                  <td><strong>{order.orderId}</strong><div className="muted">{order.awb}</div></td>
                  <td>{ndr.courier}<div className="muted">{order.pincode}</div></td>
                  <td>{ndr.ndrReasonRaw}<div className="muted">{ndr.ndrReasonNormalized}</div></td>
                  <td>
                    <span className={`badge ${slaClass}`}>{ndr.urgency || "Low"} · {Math.round(ndr.hoursSinceNdr || 0)}h</span>
                    <div className="muted">{ndr.attemptCount} attempts</div>
                    <div className="urgency-track" style={{ marginTop: 6 }}>
                      <span className="urgency-fill" style={{ width: `${Math.min(100, Math.round((ndr.hoursSinceNdr || 0) / 12 * 100))}%`, background: ndr.urgency === "Critical" ? "var(--red)" : ndr.urgency === "High" ? "var(--amber)" : "var(--green)" }} />
                    </div>
                  </td>
                  <td>{money(order.orderValue)}</td>
                  <td><span className="badge neutral">{ndrStateLabel(ndr.state)}</span></td>
                  <td>{recommendedActionLabel(ndr.recommendedAction)}</td>
                </tr>
              );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {selectedNdr && selectedOrder ? (
          <DrawerDetailLayout title={`NDR ${selectedOrder.orderId}`} meta={<span className="badge neutral">{selectedNdr.urgency} urgency</span>}>
            <p className="muted">{maskPhone(selectedOrder.phone, role)} · {selectedOrder.pincode} · {selectedNdr.courier}</p>
            <p><strong>Raw reason:</strong> {selectedNdr.ndrReasonRaw}</p>
            <p><strong>Normalized reason:</strong> {selectedNdr.ndrReasonNormalized}</p>
            <p><strong>Recommended playbook:</strong> {recommendedActionLabel(selectedNdr.recommendedAction)}</p>
            <p><strong>Recoverable value:</strong> {money(estimatedLeakageForOrder(selectedOrder, brand))}</p>
            <div className="toolbar tight">
              <button className="button secondary" onClick={() => queueMessage(selectedOrder, normalizeNdrReason(selectedNdr.ndrReasonRaw).recommendedTemplate as TemplateType)}>Queue WhatsApp</button>
              <button className="button secondary" onClick={() => updateNdrOutcome(selectedOrder, "called", "Marked called")}>Mark called</button>
              <button className="button secondary" onClick={() => updateNdrOutcome(selectedOrder, "reattempt_requested")}>Request reattempt</button>
              <button className="button secondary" onClick={() => updateNdrOutcome(selectedOrder, "address_update_needed")}>Address needed</button>
              <button className="button secondary" onClick={() => recordResponse(selectedOrder, "Customer confirmed reattempt tomorrow")}>Customer responded</button>
              <button className="button secondary" onClick={() => updateNdrOutcome(selectedOrder, "delivered_after_ndr")}>Mark delivered after NDR</button>
              <button className="button secondary" onClick={() => updateNdrOutcome(selectedOrder, "rto")}>Mark RTO</button>
            </div>
            <h3>Timeline</h3>
            <Timeline items={selectedNdr.timeline} />
          </DrawerDetailLayout>
        ) : <EmptyState title="No NDR selected" description="Load demo data or upload an NDR CSV to start the rescue workflow." />}
      </div>
    </div>
  );
}

function ActionsView({ groups, role, brand, orders, queueMessage, completeAction }: {
  groups: Record<string, Order[]>;
  role: Role;
  brand: BrandSettings;
  orders: Order[];
  queueMessage: (order: Order, template: TemplateType) => void;
  completeAction: (order: Order, actionType: RecommendedAction, note?: string) => void;
}) {
  const prepaidOpportunities = findPrepaidConversionOpportunities(orders, brand, 8);
  const [focusMode, setFocusMode] = useState(false);
  const allActions = Object.values(groups).flat();
  const visibleGroups = Object.fromEntries(
    Object.entries(groups).map(([label, items]) => [label, focusMode ? items.filter((order) => ["High", "Critical"].includes(order.riskBucket)) : items])
  ) as Record<string, Order[]>;
  const criticalActions = allActions.filter((order) => order.riskBucket === "Critical");
  const highActions = allActions.filter((order) => order.riskBucket === "High");
  const completedToday = orders.filter((order) => order.actionStatus === "done").length;
  const slaRiskNdrs = allActions.filter((order) => isNdrOrder(order) && ["High", "Critical"].includes(order.riskBucket)).length;
  const totalCriticalHigh = criticalActions.length + highActions.length;
  const doneCriticalHigh = orders.filter((order) => order.actionStatus === "done" && ["High", "Critical"].includes(order.riskBucket)).length;
  const progressPercent = totalCriticalHigh ? Math.round((doneCriticalHigh / totalCriticalHigh) * 100) : 100;
  const todayProtected = orders.filter((order) => order.actionStatus === "done").reduce((sum, order) => sum + estimatedLeakageForOrder(order, brand), 0);

  return (
    <div className="grid">
      <PageHeader
        title="Daily Profit Action Queue"
        subtitle="Prioritized actions to reduce preventable COD, NDR, courier, address, and SKU leakage."
        actions={<button className="button secondary" onClick={() => setFocusMode(!focusMode)}>{focusMode ? "Show all actions" : "Focus mode"}</button>}
      />

      {criticalActions.length === 0 && highActions.length === 0 && (
        <div className="success" style={{ borderRadius: 8, padding: 16 }}>
          <strong>All critical actions done for today.</strong> You protected an estimated {money(todayProtected)} in recoverable leakage.
        </div>
      )}

      <div className="panel">
        <div className="split" style={{ marginBottom: 8 }}>
          <span className="muted">Action progress</span>
          <span className="muted">{doneCriticalHigh} of {totalCriticalHigh} critical/high done</span>
        </div>
        <div className="bar-track">
          <span className="bar-fill success" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="grid metrics">
        <MetricCard title="Open actions" value={allActions.length} />
        <MetricCard title="Critical actions" value={criticalActions.length} tone="danger" />
        <MetricCard title="Estimated recoverable leakage" value={money(estimatedRecoverableLeakage(orders, brand))} tone="warning" />
        <MetricCard title="Completed today" value={completedToday} tone="success" />
        <MetricCard title="SLA-risk NDRs" value={slaRiskNdrs} tone="danger" />
      </div>
      <div className="panel">
        <h2>Push Prepaid Offers</h2>
        <div className="action-group">
          {prepaidOpportunities.length ? prepaidOpportunities.map(({ order, expectedLeakage, recommendedAction, messageExample, reason, placeholderPaymentLink }) => (
            <div className="action-row" key={order.id}>
              <div className="split"><strong>{order.orderId}</strong><span className={`badge ${riskClass(order.riskBucket)}`}>{order.riskBucket}</span></div>
              <div className="muted">{maskPhone(order.phone, role)} · {order.pincode} · {order.courier}</div>
              <div>{money(order.orderValue)} order value · {money(expectedLeakage)} expected leakage</div>
              <div><strong>{recommendedAction}</strong></div>
              <div className="muted">{reason}</div>
              <div className="muted">Message: {messageExample}</div>
              <div className="muted">Placeholder link: {placeholderPaymentLink}</div>
              <div className="toolbar tight">
                <button className="button secondary" onClick={() => queueMessage(order, "cod_to_prepaid")}>Queue offer</button>
                <button className="button secondary" onClick={() => completeAction(order, "convert_to_prepaid", "Offered prepaid incentive")}>Mark offered</button>
              </div>
            </div>
          )) : <Empty text="No prepaid offer actions right now." />}
        </div>
      </div>
      <div className="grid report-grid">
      {actionableGroupLabels.map((label) => {
        const items = visibleGroups[label] || [];
        return (
        <div className="panel" key={label}>
          <h2>{label}</h2>
          <div className="action-group">
            {items.length ? items.slice(0, 12).map((order) => (
              <ActionCard
                key={order.id}
                title={recommendedProfitAction(order)}
                orderId={order.orderId}
                priority={order.riskBucket}
                reason={order.recommendedActionReason}
                estimatedSaving={money(estimatedLeakageForOrder(order, brand))}
                primaryAction={primaryActionLabel(order)}
                secondaryAction="Mark done"
                status="Open"
                onPrimary={() => queueMessage(order, defaultTemplateForOrder(order))}
                onSecondary={() => completeAction(order, order.recommendedAction, `Done from ${label}`)}
              >
                <div className="muted">{maskPhone(order.phone, role)} · {order.pincode} · {order.courier}</div>
                <div>{money(order.orderValue)} order value</div>
                <div className="muted">Reason: {order.riskReasons.join(", ")}</div>
                <details><summary>Why this matters</summary><p className="muted">This order is prioritized because the expected leakage is actionably higher than low-risk delivered orders.</p></details>
              </ActionCard>
            )) : <EmptyState title="No actions in this group" description="Delivered/no-action orders are intentionally not shown here." />}
          </div>
        </div>
      );
      })}
      </div>
    </div>
  );
}

function PrepaidView({ orders, brand, queueMessage, completeAction, setSelectedOrderId, setView }: {
  orders: Order[];
  brand: BrandSettings;
  queueMessage: (order: Order, template: TemplateType) => void;
  completeAction: (order: Order, actionType: RecommendedAction, note?: string) => void;
  setSelectedOrderId: (id: string) => void;
  setView: (view: View) => void;
}) {
  const opportunities = findAdvancedPrepaidOpportunities(orders, brand);
  const highValue = opportunities.filter((item) => (orders.find((order) => order.id === item.orderId)?.orderValue || 0) >= (brand.prepaidOpportunityHighValueThreshold || 1499));
  const exposure = opportunities.reduce((sum, item) => {
    const order = orders.find((candidate) => candidate.id === item.orderId);
    return sum + (order ? estimatedLeakageForOrder(order, brand) : 0);
  }, 0);
  const accepted = opportunities.filter((item) => item.status === "accepted").length;
  return (
    <div className="grid">
      <PageHeader title="COD-to-Prepaid Opportunities" subtitle="Rule-based, margin-aware opportunities to reduce high-risk COD exposure without destroying contribution margin." />
      <div className="notice">Margin guardrail: do not offer incentives that destroy margin. This is rule-based for now; future versions can use uplift modeling.</div>
      <div className="grid metrics">
        <MetricCard title="Open opportunities" value={opportunities.length} />
        <MetricCard title="High-value COD at risk" value={highValue.length} tone="danger" />
        <MetricCard title="Recommended incentive" value={`₹${brand.prepaidIncentiveFlatAmount || 50}`} />
        <MetricCard title="Exposure protected" value={money(exposure)} tone="warning" />
        <MetricCard title="Accepted conversions" value={accepted} tone="success" />
      </div>
      <div className="grid report-grid">
        {opportunities.length ? opportunities.slice(0, 24).map((item) => {
          const order = orders.find((candidate) => candidate.id === item.orderId);
          if (!order) return null;
          return (
            <ActionCard
              key={item.opportunityId}
              title="Offer prepaid incentive"
              orderId={order.orderId}
              priority={order.riskBucket}
              reason={item.reason}
              estimatedSaving={money(estimatedLeakageForOrder(order, brand))}
              primaryAction="Queue prepaid message"
              secondaryAction="Mark accepted"
              status="Open"
              onPrimary={() => queueMessage(order, "cod_to_prepaid")}
              onSecondary={() => completeAction(order, "convert_to_prepaid", "Customer accepted prepaid offer")}
            >
              <div className="muted">{order.pincode} · {order.courier} · {money(order.orderValue)} order value</div>
              <div>{item.recommendedIncentive} recommended · {item.estimatedRiskReductionNote}</div>
              <div className="toolbar tight">
                <button className="button secondary" onClick={() => { setSelectedOrderId(order.id); setView("orders"); }}>Open order</button>
                <button className="button secondary" onClick={() => completeAction(order, "convert_to_prepaid", "Prepaid offer declined or dismissed")}>Dismiss</button>
              </div>
            </ActionCard>
          );
        }) : <EmptyState title="No prepaid opportunities" description="Upload active high-risk COD orders above the configured value threshold to unlock prepaid offers." />}
      </div>
    </div>
  );
}

function SavingsView({ orders, brand, stores, messages, savingsEvents, setSavingsEvents }: {
  orders: Order[];
  brand: BrandSettings;
  stores?: NonNullable<StarterWorkspaceState["stores"]>;
  messages: Message[];
  savingsEvents: SavingsEvent[];
  setSavingsEvents: (events: SavingsEvent[]) => void;
}) {
  const ledger = calculateSavingsLedger(savingsEvents, messages, brand, orders, stores);
  const [adjustment, setAdjustment] = useState<Record<string, string>>({});
  function update(id: string, patch: Parameters<typeof updateSavingEvent>[2]) {
    setSavingsEvents(updateSavingEvent(savingsEvents, id, patch));
  }
  return (
    <div className="grid">
      <PageHeader title="Savings Ledger" subtitle="Credible, transparent savings proof. Estimates stay labelled until verified or rejected." actions={<button className="button secondary" onClick={() => window.print()}>Print ledger</button>} />
      <div className="grid metrics">
        <MetricCard title="Estimated savings" value={money(ledger.estimatedSavings)} tone="success" />
        <MetricCard title="Verified savings" value={money(ledger.verifiedSavings)} tone="success" />
        <MetricCard title="Rejected savings" value={money(ledger.rejectedSavings)} tone="danger" />
        <MetricCard title="Software cost" value={money(ledger.softwareCost)} />
        <MetricCard title="Messaging cost" value={money(ledger.messagingCost)} />
        <MetricCard title="Net benefit" value={money(ledger.netEstimatedBenefit)} tone={ledger.netEstimatedBenefit >= 0 ? "success" : "warning"} />
      </div>
      <div className="panel">
        <h2>Events</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Event</th><th>Order/action</th><th>Estimate</th><th>Confidence</th><th>Formula note</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {savingsEvents.map((event) => {
                const order = orders.find((item) => item.id === event.orderId);
                return (
                  <tr key={event.id}>
                    <td>{event.eventType.replaceAll("_", " ")}</td>
                    <td>{order?.orderId || event.orderId}</td>
                    <td>
                      <strong>{money(event.estimatedSaving)}</strong>
                      <input className="input compact-input" value={adjustment[event.id] || ""} placeholder="Adjust" onChange={(e) => setAdjustment({ ...adjustment, [event.id]: e.target.value })} />
                    </td>
                    <td>{String(event.confidence || "medium")}</td>
                    <td>{event.formulaNote || formulaNote(event)}</td>
                    <td><span className="badge neutral">{event.status || "estimated"}</span></td>
                    <td className="ops-buttons">
                      <button className="button secondary" onClick={() => update(event.id, { status: "verified", actualSaving: Number(adjustment[event.id] || event.estimatedSaving) })}>Verify</button>
                      <button className="button secondary" onClick={() => update(event.id, { status: "rejected" })}>Reject</button>
                      <button className="button secondary" onClick={() => update(event.id, { estimatedSaving: Number(adjustment[event.id] || event.estimatedSaving), status: "adjusted" })}>Adjust</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!savingsEvents.length && <EmptyState title="No savings events yet" description="Complete an action, rescue an NDR, or record a prepaid conversion to create estimated savings." />}
      </div>
    </div>
  );
}

function PolicySimulatorView({ orders, brand }: { orders: Order[]; brand: BrandSettings }) {
  const [policyType, setPolicyType] = useState<SimulatedPolicyType>("cod_verification_high_risk");
  const [riskBucket, setRiskBucket] = useState("High");
  const [reduction, setReduction] = useState(20);
  const [conversionLoss, setConversionLoss] = useState(5);
  const [cost, setCost] = useState(6);
  const simulation = useMemo(() => simulatePolicy(orders, brand, {
    policyType,
    filters: { riskBucket: riskBucket === "all" ? undefined : riskBucket },
    assumedReductionPercent: reduction,
    assumedConversionLossPercent: conversionLoss,
    assumedInterventionCost: cost,
    pilotDurationDays: 14
  }), [orders, brand, policyType, riskBucket, reduction, conversionLoss, cost]);
  const policyLabels: Record<SimulatedPolicyType, string> = {
    cod_verification_high_risk: "COD verification for high-risk orders",
    prepaid_only_first_time_pincodes: "Prepaid-only for first-time buyers",
    prepaid_incentive_high_risk_cod: "Prepaid incentive for high-risk COD",
    courier_switch_selected_lane: "Courier switch test",
    address_correction_weak_address: "Address correction for weak addresses",
    hold_critical_cod: "Hold critical COD orders"
  };
  return (
    <div className="grid">
      <PageHeader title="Policy Simulator" subtitle="Test simple operational policies before applying them. This is a simple simulation, not a guarantee." />
      <div className="grid two-col">
        <div className="panel">
          <h2>Policy Assumptions</h2>
          <div className="form-grid one">
            <label><span className="muted">Policy type</span><select className="select" value={policyType} onChange={(event) => setPolicyType(event.target.value as SimulatedPolicyType)}>{Object.entries(policyLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            <label><span className="muted">Target segment</span><select className="select" value={riskBucket} onChange={(event) => setRiskBucket(event.target.value)}><option value="all">All risk buckets</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
            <label><span className="muted">Assumed reduction %: {reduction}%</span><input className="input" type="range" min="0" max="60" value={reduction} onChange={(event) => setReduction(Number(event.target.value))} /></label>
            <label><span className="muted">Conversion loss %: {conversionLoss}%</span><input className="input" type="range" min="0" max="30" value={conversionLoss} onChange={(event) => setConversionLoss(Number(event.target.value))} /></label>
            <label><span className="muted">Intervention cost per order</span><input className="input" type="number" value={cost} onChange={(event) => setCost(Number(event.target.value))} /></label>
          </div>
        </div>
        <div className="panel">
          <h2>Estimated Result</h2>
          <div className="grid metrics">
            <MetricCard title="Affected orders" value={simulation.affectedOrders} />
            <MetricCard title="Saved leakage" value={money(simulation.assumedSavedLeakage)} tone="success" />
            <MetricCard title="Lost contribution" value={money(simulation.lostContributionEstimate)} tone="warning" />
            <MetricCard title="Net benefit" value={money(simulation.netEstimatedBenefit)} tone={simulation.netEstimatedBenefit >= 0 ? "success" : "danger"} />
          </div>
          <BarList rows={[
            { label: "Baseline leakage", value: simulation.baselineEstimatedLeakage, valueLabel: money(simulation.baselineEstimatedLeakage), tone: "danger" },
            { label: "Saved leakage", value: simulation.assumedSavedLeakage, valueLabel: money(simulation.assumedSavedLeakage), tone: "success" },
            { label: "Intervention cost", value: simulation.interventionCost, valueLabel: money(simulation.interventionCost), tone: "warning" },
            { label: "Lost contribution", value: simulation.lostContributionEstimate, valueLabel: money(simulation.lostContributionEstimate), tone: "warning" }
          ]} />
          <div className="notice">{simulation.riskNotes.join(" ")}</div>
        </div>
      </div>
    </div>
  );
}

function TemplatesView({ orders, ndrCases, brand, selectedOrder, setSelectedOrderId, templateType, setTemplateType, queueMessage, messages, updateMessageStatus, recordResponse }: {
  orders: Order[];
  ndrCases: NdrCase[];
  brand: BrandSettings;
  selectedOrder: Order;
  setSelectedOrderId: (id: string) => void;
  templateType: TemplateType;
  setTemplateType: (template: TemplateType) => void;
  queueMessage: (order: Order, template: TemplateType) => void;
  messages: Message[];
  updateMessageStatus: (message: Message, status: Message["status"]) => void;
  recordResponse: (order: Order, raw: string, messageId?: string) => void;
}) {
  const [responseText, setResponseText] = useState("Confirm delivery");
  const deliveredNoAction = isDeliveredNoAction(selectedOrder);

  useEffect(() => {
    setTemplateType(defaultTemplateForOrder(selectedOrder));
  }, [selectedOrder.id, setTemplateType]);

  function exportOutbox() {
    const blob = new Blob([exportMessagesCsv(messages)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "supportwaala-mock-outbox.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const preview = renderTemplate(templateType, selectedOrder, brand);
  return (
    <div className="grid two-col">
      <div className="panel">
        <PageHeader title="Messaging Outbox" subtitle="Provider-ready mock/manual WhatsApp workflow. No real external message is sent from this MVP." />
        <div className="form-grid one">
          <label><span className="muted">Order or NDR case</span><select className="select" value={selectedOrder.id} onChange={(event) => setSelectedOrderId(event.target.value)}>{orders.map((order) => <option value={order.id} key={order.id}>{order.orderId} {isNdrOrder(order) ? "(NDR)" : ""}</option>)}</select></label>
          <label><span className="muted">Template</span><select className="select" value={templateType} disabled={deliveredNoAction} onChange={(event) => setTemplateType(event.target.value as TemplateType)}>{templateTypes.map((item) => <option value={item} key={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
        </div>
        {deliveredNoAction && <div className="notice">This order is delivered. Operational WhatsApp actions are disabled.</div>}
        <div className="preview">
          <strong>Rendered preview</strong>
          <p>{preview}</p>
          <div className="chips">{templateButtons[templateType].map((button) => <span className="chip" key={button}>{button}</span>)}</div>
        </div>
        <button className="button" disabled={deliveredNoAction} onClick={() => queueMessage(selectedOrder, templateType)}>Queue mock WhatsApp</button>
        <p className="muted">Real WhatsApp integration is available later. This MVP supports mock/manual export with estimated utility/service costs.</p>
        <p className="muted">NDR case: {ndrCases.find((item) => item.orderId === selectedOrder.id)?.state || "not NDR"}</p>
      </div>
      <div className="panel">
        <div className="split"><h2>Queued And Manual Messages</h2><button className="button secondary" onClick={exportOutbox} disabled={!messages.length}>Export messages CSV</button></div>
        {messages.length ? messages.slice(0, 14).map((message) => {
          const order = orders.find((item) => item.id === message.orderId);
          return (
            <div className="action-row" key={message.id}>
              <div className="split"><strong>{message.templateType.replaceAll("_", " ")}</strong><span className="badge neutral">{message.status}</span></div>
              <div className="muted">{message.recipientPhoneMasked} · {order?.orderId}</div>
              <div>{message.messageBody}</div>
              <div className="toolbar tight">
                <button className="button secondary" onClick={() => updateMessageStatus(message, "manually_sent")}>Mark sent</button>
                <button className="button secondary" onClick={() => updateMessageStatus(message, "failed")}>Failed</button>
              </div>
              {order && (
                <>
                  <textarea className="textarea compact" value={responseText} onChange={(event) => setResponseText(event.target.value)} />
                  <button className="button secondary" onClick={() => recordResponse(order, responseText, message.id)}>Record response</button>
                </>
              )}
            </div>
          );
        }) : <Empty text="No messages queued yet." />}
      </div>
    </div>
  );
}

function ReportsView({ report }: { report: ReturnType<typeof generateAuditReport> }) {
  function reportText() {
    return `SupportWaala RTOShield Profit Leakage Report\nOrders: ${report.orderVolume}\nCOD: ${percent(report.codPercentage)}\nRTO: ${percent(report.rtoRate)}\nEstimated monthly RTO loss: ${money(report.estimatedMonthlyLoss)}\nRecommended action plan:\n${report.recommendedPilotPlan.join("\n")}`;
  }
  function download(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="printable grid report-grid">
      <ReportPanel title="Profit Leakage Report">
        <p className="muted">SupportWaala starts with RTOShield: measurable leakage, daily actions, NDR rescue, and a savings ledger.</p>
        <div className="toolbar">
          <button className="button secondary" onClick={() => navigator.clipboard?.writeText(reportText())}>Copy report</button>
          <PrintButton label="Print report" />
          <button className="button secondary" onClick={() => download("leakage-report.json", JSON.stringify(report, null, 2), "application/json")}>Export JSON</button>
          <button className="button secondary" onClick={() => download("leakage-drivers.csv", exportRowsCsv([...report.pincodeRecommendations, ...report.courierRecommendations] as Array<Record<string, unknown>>), "text/csv")}>Export CSV</button>
          <button className="button secondary" onClick={() => alert("Report marked as shared in this local demo.")}>Mark as shared</button>
        </div>
      </ReportPanel>
      {report.lowSampleSize && <div className="notice">Low sample size. Treat insights as directional until the seller uploads at least 50 orders.</div>}
      <ReportPanel title="Executive Summary">
        <p>Order volume: <strong>{report.orderVolume}</strong></p>
        <p>COD percentage: <strong>{percent(report.codPercentage)}</strong></p>
        <p>RTO rate: <strong>{percent(report.rtoRate)}</strong></p>
        <p>COD RTO rate: <strong>{percent(report.codRtoRate)}</strong></p>
        <p>Estimated monthly RTO loss: <strong>{money(report.estimatedMonthlyLoss)}</strong></p>
        <p>Savings at 10/20/30% reduction: <strong>{money(report.savingsAt10)} / {money(report.savingsAt20)} / {money(report.savingsAt30)}</strong></p>
      </ReportPanel>
      <ReportPanel title="COD Leakage"><p>COD share: <strong>{percent(report.codPercentage)}</strong></p><p>COD RTO rate: <strong>{percent(report.codRtoRate)}</strong></p></ReportPanel>
      <ReportPanel title="RTO Leakage"><p>RTO rate: <strong>{percent(report.rtoRate)}</strong></p><p>Estimated monthly RTO loss: <strong>{money(report.estimatedMonthlyLoss)}</strong></p></ReportPanel>
      <ReportRecommendationList title="Pincode Leakage" items={report.pincodeRecommendations} />
      <ReportRecommendationList title="Courier Leakage" items={report.courierRecommendations} />
      <ReportList title="SKU/Product Leakage" items={report.topRtoSkus} recommendation="Check product page, size chart, offer promise, and ad source." />
      <ReportList title="NDR Reason Leakage" items={report.topNdrReasons} recommendation="Use WhatsApp/call rescue flow within 12 hours." />
      <ReportIssueList title="Address Quality Issues" items={report.addressQualityIssues} />
      <ReportPrepaidList title="Push Prepaid Offers" items={report.prepaidConversionOpportunities} />
      <ReportBulletList title="Recommended 14-Day Action Plan" items={report.recommendedPilotPlan} />
      <ReportBulletList title="Daily Action Queue" items={report.dailyActionPlan} />
    </div>
  );
}

function ProView({ view, brand, orders, stores, messages, savingsEvents, role }: {
  view: View;
  brand: BrandSettings;
  orders: Order[];
  stores: NonNullable<StarterWorkspaceState["stores"]>;
  messages: Message[];
  savingsEvents: SavingsEvent[];
  role: Role;
}) {
  const policies = [...generateHighRiskCodHoldPolicies(orders, brand), ...analyzePincodePolicies(orders, brand)];
  const courier = analyzeCourierPolicies(orders, brand);
  const prepaid = findAdvancedPrepaidOpportunities(orders, brand);
  const sku = analyzeSkuLeakage(orders, brand);
  const campaigns = analyzeCampaignLeakage(orders, brand);
  const advancedActions = buildAdvancedActionQueue(orders, brand, policies);
  const ledger = calculateSavingsLedger(savingsEvents, messages, brand, orders, stores);
  const weekly = generateWeeklyFounderReport({ brand, orders, savingsEvents, policies });
  const monthly = generateMonthlyStrategyReport({ brand, orders, savingsEvents, policies });
  const simulation = simulatePolicy(orders, brand, {
    policyType: "cod_verification_high_risk",
    assumedReductionPercent: 20,
    assumedConversionLossPercent: 5,
    assumedInterventionCost: 6,
    pilotDurationDays: 14
  });
  const progress = onboardingProgress(defaultOnboardingChecklist.map((item, index) => ({ ...item, completed: index < Math.min(orders.length ? 4 : 1, defaultOnboardingChecklist.length) })));

  if (view === "onboarding") {
    return (
      <div className="grid two-col">
        <ReportPanel title="Priority Onboarding">
          <Metric label="Progress" value={`${progress.percentage}%`} />
          <p className="muted">Next step: {progress.nextRecommendedStep}</p>
        </ReportPanel>
        <ReportPanel title="Checklist">{defaultOnboardingChecklist.map((item) => <div className="action-row" key={item.id}>{item.label}</div>)}</ReportPanel>
      </div>
    );
  }
  if (view === "stores") {
    return (
      <ReportPanel title="Stores">
        <p className="notice">{proStoreLimitMessage}</p>
        {stores.map((store) => <div className="action-row" key={store.id}><strong>{store.storeName}</strong><div className="muted">{store.platform} · {store.active ? "Active" : "Inactive"}</div></div>)}
      </ReportPanel>
    );
  }
  if (view === "rules") {
    const sample = orders.find((order) => order.paymentMode === "COD") || orders[0];
    const result = sample ? evaluateCustomRules(sample, defaultProRules) : undefined;
    return (
      <div className="grid two-col">
        <ReportPanel title="Custom Rules">{defaultProRules.map((rule) => <div className="action-row" key={rule.id}><strong>{rule.name}</strong><div className="muted">{rule.description} · priority {rule.priority}</div></div>)}</ReportPanel>
        <ReportPanel title="Test Rule On Sample Order"><p>{sample?.orderId}</p><p><strong>{result?.recommendedAction}</strong></p><p className="muted">{result?.reason}</p></ReportPanel>
      </div>
    );
  }
  if (view === "ndrPlaybooks") {
    return <div className="grid report-grid">{defaultNdrPlaybooks.map((playbook) => <ReportPanel title={playbook.reason.replaceAll("_", " ")} key={playbook.id}><p className="muted">SLA: {playbook.slaHours} hours · Template: {playbook.defaultTemplate}</p>{playbook.steps.map((step) => <div className="action-row" key={step}>{step}</div>)}</ReportPanel>)}</div>;
  }
  if (view === "prepaid") {
    return <ReportPanel title="Prepaid Opportunities">{prepaid.slice(0, 16).map((item) => <div className="action-row" key={item.opportunityId}><strong>{orders.find((order) => order.id === item.orderId)?.orderId}</strong><div>{item.recommendedIncentive} · score {item.score}</div><div className="muted">{item.reason}</div></div>)}</ReportPanel>;
  }
  if (view === "pincode") {
    const pincodePolicies = analyzePincodePolicies(orders, brand);
    const top = pincodePolicies[0];
    return (
      <div className="grid">
        <PageHeader title="Pincode Intelligence" subtitle="Find pincode clusters where COD, courier, address, and NDR leakage concentrate." />
        <div className="grid metrics">
          <MetricCard title="Pincodes analyzed" value={pincodePolicies.length} />
          <MetricCard title="Highest leakage segment" value={top?.id.replace("pin-", "") || "None"} tone="danger" />
          <MetricCard title="Estimated loss" value={money(top?.estimatedLeakage || 0)} tone="warning" />
          <MetricCard title="Expected saving" value={money(top?.expectedSaving || 0)} tone="success" />
        </div>
        <InsightCard title="Recommendation" insight={top?.title || "No pincode cluster is large enough yet."} recommendation={top?.recommendation || "Upload more orders before changing pincode policy."} confidence={orders.length >= 500 ? "High" : "Medium"} />
        <ReportPanel title="Top Pincode Clusters">
          <div className="table-wrap"><table><thead><tr><th>Pincode</th><th>Orders</th><th>Estimated loss</th><th>Risk</th><th>Recommendation</th></tr></thead><tbody>{pincodePolicies.slice(0, 20).map((policy) => <tr key={policy.id}><td><strong>{policy.id.replace("pin-", "")}</strong></td><td>{policy.affectedOrdersCount}</td><td>{money(policy.estimatedLeakage)}</td><td><span className={`badge priority-${policy.risk}`}>{policy.risk}</span></td><td>{policy.recommendation}</td></tr>)}</tbody></table></div>
        </ReportPanel>
      </div>
    );
  }
  if (view === "courier") {
    const top = courier.recommendations[0];
    return (
      <div className="grid">
        <PageHeader title="Courier Intelligence" subtitle="Compare courier performance and courier+pincode lanes before changing allocation rules." />
        <div className="notice">{courier.mixWarning}</div>
        <div className="grid metrics">
          <MetricCard title="Couriers analyzed" value={courier.league.length} />
          <MetricCard title="Risky lanes" value={courier.lanes.length} tone="danger" />
          <MetricCard title="Highest leakage" value={money(top?.estimatedLeakage || 0)} tone="warning" />
          <MetricCard title="Switch-test saving" value={money(top?.expectedSaving || 0)} tone="success" />
        </div>
        <ReportPanel title="Courier Performance">
          <div className="table-wrap"><table><thead><tr><th>Courier</th><th>Orders</th><th>RTO %</th><th>COD RTO %</th><th>Top failing pincode</th><th>Estimated loss</th></tr></thead><tbody>{courier.league.map((row) => <tr key={row.courier}><td><strong>{row.courier}</strong></td><td>{row.total}</td><td>{percent(row.rtoRate)}</td><td>{percent(row.codRtoRate)}</td><td>{row.topFailingPincode || "None"}</td><td>{money(row.estimatedLeakage)}</td></tr>)}</tbody></table></div>
        </ReportPanel>
        <ReportPanel title="Recommended Switch Tests">{courier.recommendations.slice(0, 8).map((policy) => <div className="action-row" key={policy.id}><strong>{policy.title}</strong><div>{money(policy.estimatedLeakage)} leakage · {policy.recommendation}</div></div>)}</ReportPanel>
      </div>
    );
  }
  if (view === "sku") {
    const top = sku[0];
    return (
      <div className="grid">
        <PageHeader title="SKU Intelligence" subtitle="Identify products where sizing, ad promise, pricing, or product-page mismatch may be driving returns." />
        <div className="grid metrics">
          <MetricCard title="SKUs analyzed" value={sku.length} />
          <MetricCard title="Highest leakage SKU" value={top?.sku || "None"} tone="danger" />
          <MetricCard title="Estimated loss" value={money(top?.estimatedLoss || 0)} tone="warning" />
          <MetricCard title="Top RTO %" value={percent(top?.rtoRate || 0)} tone="danger" />
        </div>
        <ReportPanel title="Product Leakage">{sku.slice(0, 20).map((item) => <div className="action-row" key={item.sku}><strong>{item.sku}</strong><div>{percent(item.rtoRate)} RTO · {money(item.estimatedLoss)} estimated loss</div><div className="muted">{item.recommendation}</div></div>)}</ReportPanel>
      </div>
    );
  }
  if (view === "campaigns") {
    if (!hasCampaignData(orders)) return <ReportPanel title="Campaign Intelligence"><EmptyState title="Campaign data missing" description={campaignMissingEmptyState()} /></ReportPanel>;
    const top = campaigns[0];
    return (
      <div className="grid">
        <PageHeader title="Campaign Intelligence" subtitle="Separate profitable demand from campaigns that create low-intent COD and RTO leakage." />
        <div className="grid metrics">
          <MetricCard title="Campaigns analyzed" value={campaigns.length} />
          <MetricCard title="Highest leakage campaign" value={top?.campaign || "None"} tone="danger" />
          <MetricCard title="RTO %" value={percent(top?.rtoPercent || 0)} tone="danger" />
          <MetricCard title="Estimated loss" value={money(top?.estimatedLoss || 0)} tone="warning" />
        </div>
        <ReportPanel title="Campaign Leakage">{campaigns.slice(0, 20).map((item) => <div className="action-row" key={item.campaign}><strong>{item.campaign}</strong><div>{percent(item.rtoPercent)} RTO · {money(item.estimatedLoss)} estimated loss</div><div className="muted">{item.recommendation}</div></div>)}</ReportPanel>
      </div>
    );
  }
  if (view === "savings") {
    return (
      <div className="grid metrics">
        <Metric label="Estimated savings" value={money(ledger.estimatedSavings)} />
        <Metric label="Verified savings" value={money(ledger.verifiedSavings)} />
        <Metric label="Rejected savings" value={money(ledger.rejectedSavings)} />
        <Metric label="Messaging cost" value={money(ledger.messagingCost)} />
        <Metric label="Net estimated benefit" value={money(ledger.netEstimatedBenefit)} />
      </div>
    );
  }
  if (view === "weekly") {
    return (
      <div className="grid">
        <PageHeader title="Weekly Founder Report" subtitle="Founder-ready weekly summary with clear action focus and estimated savings." actions={<PrintButton label="Print report" />} />
        <div className="grid metrics">
          <MetricCard title="Orders processed" value={weekly.metrics.ordersProcessed || 0} />
          <MetricCard title="COD exposure" value={weekly.metrics.codExposure || 0} tone="warning" />
          <MetricCard title="RTO orders" value={weekly.metrics.rtoOrders || 0} tone="danger" />
          <MetricCard title="Estimated savings" value={money(weekly.metrics.estimatedSavings || 0)} tone="success" />
        </div>
        <InsightCard title="This Week" insight={String(weekly.sections.executiveSummary)} recommendation={(weekly.sections.nextWeekFocus as string[])[0] || "Keep working the daily queue."} confidence={orders.length >= 500 ? "High" : "Medium"} />
        <ReportBulletList title="Next Week Focus" items={weekly.sections.nextWeekFocus as string[]} />
        <ReportBulletList title="Open Risks" items={weekly.sections.openRisks as string[]} />
      </div>
    );
  }
  if (view === "monthly") {
    return (
      <div className="grid">
        <PageHeader title="Monthly Strategy Report" subtitle="Decisions, experiments, operational risks, and next-month plan." actions={<PrintButton label="Print strategy" />} />
        <InsightCard title="Monthly Narrative" insight={String(monthly.sections.executiveSummary)} recommendation="Run controlled experiments before changing courier, COD, or pincode policy permanently." confidence={orders.length >= 500 ? "High" : "Medium"} />
        <div className="grid report-grid">
          <ReportPanel title="Top 3 Decisions">{["Verify COD in highest-loss pincodes", "Keep prepaid incentives within margin guardrails", "Prioritize NDR SLA for high-value COD"].map((item) => <div className="action-row" key={item}>{item}</div>)}</ReportPanel>
          <ReportPanel title="Top 3 Operational Risks">{["Low sample size can distort courier comparison", "Campaign source missing limits paid-leakage confidence", "Savings are estimates until verified"].map((item) => <div className="action-row" key={item}>{item}</div>)}</ReportPanel>
        </div>
        <ReportPanel title="Top Experiments">{monthly.experiments.slice(0, 5).map((experiment) => <div className="action-row" key={String(experiment.hypothesis)}><strong>{String(experiment.hypothesis)}</strong><div className="muted">{String(experiment.targetSegment)} · {String(experiment.duration)} · {String(experiment.measurementMetric)}</div></div>)}</ReportPanel>
      </div>
    );
  }
  if (view === "simulator") {
    return <ReportPanel title="Policy Simulator"><p className="notice">{simulation.riskNotes[0]}</p><div className="grid metrics"><Metric label="Affected orders" value={simulation.affectedOrders} /><Metric label="Baseline leakage" value={money(simulation.baselineEstimatedLeakage)} /><Metric label="Saved leakage" value={money(simulation.assumedSavedLeakage)} /><Metric label="Intervention cost" value={money(simulation.interventionCost)} /><Metric label="Net benefit" value={money(simulation.netEstimatedBenefit)} /></div></ReportPanel>;
  }
  if (view === "integrations") {
    return <div className="grid report-grid">{integrationReadinessCards.map((card) => <ReportPanel title={card.name} key={card.name}><span className="badge neutral">{card.status}</span><p className="muted">Data needed: {card.dataNeeded.join(", ")}</p><p>Unlocks: {card.unlocks.join(", ")}</p><p>Current workaround: {card.currentWorkaround}</p><p className="notice">{productionSecretsWarning}</p></ReportPanel>)}</div>;
  }
  if (view === "sops") {
    return <div className="grid report-grid">{sopTemplates.map((sop) => <ReportPanel title={sop.title} key={sop.id}><p>{sop.purpose}</p><p className="muted">Owner: {sop.owner} · Metric: {sop.successMetric}</p>{sop.steps.map((step) => <div className="action-row" key={step}>{step}</div>)}</ReportPanel>)}</div>;
  }
  return <ReportPanel title="Pro Action Queue"><p className="muted">Role access: queue message {canRole(role, "queue_message") ? "allowed" : "blocked"} · export reports {canRole(role, "export_reports") ? "allowed" : "blocked"}</p>{advancedActions.slice(0, 20).map((action) => <div className="action-row" key={action.id}><strong>{action.title}</strong><div>{money(action.estimatedLeakage || 0)} leakage · owner {action.owner}</div><div className="muted">{action.reason}</div></div>)}</ReportPanel>;
}

function PrivacyView({ role, orders, messages, responses, imports, audits, deleteImportedData }: {
  role: Role;
  orders: Order[];
  messages: Message[];
  responses: CustomerResponse[];
  imports: ImportRecord[];
  audits: AuditLog[];
  deleteImportedData: () => void;
}) {
  return (
    <div className="grid">
      <div className="panel">
        <h2>Privacy And Audit Controls</h2>
        <p><strong>This MVP stores data locally in this browser/device.</strong> Stored data includes brand settings, imported orders, import summaries, NDR cases, mock outbox, customer responses, actions, savings events, and audit logs.</p>
        <p>Phone masking: ops/viewer roles see masked phones like {maskPhone("9876543210", "ops")}; admin can see full phone for delivery/RTO operations.</p>
        <p>Customer data should only be used for delivery/RTO operations.</p>
        <p className="notice">Production must use tenant-isolated server storage, formal retention rules, opt-out handling, and DPDP-aware agreements before live customer use.</p>
        <div className="metrics grid">
          <Metric label="Orders" value={orders.length} />
          <Metric label="Messages" value={messages.length} />
          <Metric label="Responses" value={responses.length} />
          <Metric label="Imports" value={imports.length} />
          <Metric label="Role" value={role} />
        </div>
        <div className="toolbar">
          <button className="button secondary" onClick={deleteImportedData}>Delete imported data</button>
          <button className="button secondary" onClick={() => alert("Use browser localStorage backup from Plan pilots; production export will create a signed file and log export_created.")}>Export workspace JSON</button>
          <button className="button secondary" onClick={() => alert("Import workspace JSON placeholder. Starter demos can restore backups through localStorage in this MVP.")}>Import workspace JSON</button>
          <button className="button secondary" onClick={deleteImportedData}>Clear workspace data</button>
        </div>
      </div>
      <div className="panel">
        <h2>Audit Log</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>Metadata</th></tr></thead>
            <tbody>
              {audits.slice(0, 80).map((audit) => (
                <tr key={audit.id}><td>{new Date(audit.createdAt).toLocaleString()}</td><td>{audit.action}</td><td>{audit.entityType}</td><td>{JSON.stringify(audit.metadata || {})}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BillingView({ currentPlan, orderCount }: { currentPlan: PlanId; orderCount: number }) {
  const plan = currentProPlan;
  return (
    <div className="grid two-col">
      <div className="panel">
        <h2>Plan & Billing</h2>
        <div className="metrics grid">
          <Metric label="Current plan" value={plan.name} />
          <Metric label="Price" value={money(plan.priceMonthlyInr) + "/month"} />
          <Metric label="Order limit" value={`${orderCount}/${plan.limits.monthly_order_limit}`} />
          <Metric label="Billing status" value="Placeholder" />
        </div>
        {currentPlan !== "pro" && <div className="notice">This workspace is configured as {currentPlan}, while Pro behavior is the implemented operating tier in this build.</div>}
        {getProLimitWarning(orderCount, plan) && <div className="notice">{getProLimitWarning(orderCount, plan)}</div>}
        <div className="toolbar">
          <button className="button secondary" disabled>Scale automation placeholder</button>
          <button className="button secondary" disabled>Enterprise RBAC placeholder</button>
        </div>
        <p className="muted">{getScaleEnterprisePlaceholder("Pro plan gates")}</p>
      </div>
      <div className="panel">
        <h2>Included In Pro</h2>
        <div className="chips">
          {["5,000 orders/month", "10,000 rows/import", "Multi-store up to 3", "Custom rules", "Policy recommendations", "Founder reports", "Provider-ready messaging"].map((item) => (
            <span className="chip" key={item}>{item}</span>
          ))}
        </div>
        <h2>Scale/Enterprise Placeholders</h2>
        <div className="chips">
          {scaleEnterprisePlaceholders.map((item) => (
            <span className="chip" key={item}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="panel metric"><div className="label">{label}</div><div className="value">{value}</div></div>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return <label><span className="muted">{label}</span><input className="input" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Empty({ text }: { text: string }) {
  return <div className="muted empty">{text}</div>;
}

function ReportPanel({ title, children }: { title: string; children: ReactNode }) {
  return <div className="panel"><h2>{title}</h2>{children}</div>;
}

function ReportList({ title, items, recommendation }: { title: string; items: Array<{ label: string; total: number; rto: number; rate: number; lowSample?: boolean }>; recommendation: string }) {
  return (
    <ReportPanel title={title}>
      <p className="muted"><strong>Recommended action:</strong> {recommendation}</p>
      {items.length ? items.map((item) => (
        <div className="action-row" key={item.label}>
          <strong>{item.label}</strong>
          <div className="muted">{item.rto} RTO / {item.total} orders · {percent(item.rate)} {item.lowSample ? "· Low sample size" : ""}</div>
        </div>
      )) : <Empty text="No data available." />}
    </ReportPanel>
  );
}

function ReportRecommendationList({ title, items }: { title: string; items: Array<{ label: string; total: number; rto: number; rate: number; lowSample?: boolean; recommendation: string }> }) {
  return (
    <ReportPanel title={title}>
      {items.length ? items.map((item) => (
        <div className="action-row" key={item.label}>
          <strong>{item.label}</strong>
          <div className="muted">{item.rto} RTO / {item.total} orders · {percent(item.rate)} {item.lowSample ? "· Low sample size" : ""}</div>
          <div>{item.recommendation}</div>
        </div>
      )) : <Empty text="No leakage cluster detected." />}
    </ReportPanel>
  );
}

function ReportPrepaidList({ title, items }: { title: string; items: Array<{ orderId: string; pincode: string; courier: string; orderValue: number; riskBucket: string; expectedLeakage: number; recommendation: string; reason: string }> }) {
  return (
    <ReportPanel title={title}>
      {items.length ? items.map((item) => (
        <div className="action-row" key={item.orderId}>
          <div className="split"><strong>{item.orderId}</strong><span className={`badge ${riskClass(item.riskBucket)}`}>{item.riskBucket}</span></div>
          <div className="muted">{item.pincode} · {item.courier} · {money(item.orderValue)} order value</div>
          <div>{money(item.expectedLeakage)} expected leakage · {item.recommendation}</div>
          <div className="muted">{item.reason}</div>
        </div>
      )) : <Empty text="No prepaid conversion opportunities detected." />}
    </ReportPanel>
  );
}

function ReportIssueList({ title, items }: { title: string; items: Array<{ label: string; total: number }> }) {
  return (
    <ReportPanel title={title}>
      {items.length ? items.slice(0, 8).map((item) => <div className="action-row" key={item.label}><strong>{item.label}</strong><div className="muted">{item.total} orders</div></div>) : <Empty text="No address issues detected." />}
    </ReportPanel>
  );
}

function ReportBulletList({ title, items }: { title: string; items: string[] }) {
  return <ReportPanel title={title}>{items.map((item) => <div className="action-row" key={item}>{item}</div>)}</ReportPanel>;
}
