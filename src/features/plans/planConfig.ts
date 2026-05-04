import type { PlanConfig, PlanId } from "./types";

const disabledIntegrations = {
  real_whatsapp_api: false,
  integrations: false,
  managed_support: false
};

export const scaleEnterprisePlaceholders = [
  "Real automated courier action push",
  "Full API integrations",
  "ML risk model",
  "Multi-brand portfolio",
  "Managed ops team",
  "Returns intelligence",
  "Inventory optimization",
  "Cashflow reconciliation",
  "Advanced RBAC",
  "Autonomous agents",
  "Data warehouse export",
  "API access"
];

export const scaleEnterprisePlaceholderMessage =
  "This is available in Scale/Enterprise. Pro includes CSV-first workflows, provider-ready messaging, policy recommendations, and founder reports.";

function futurePlan(id: PlanId, name: string, bestFor: string): PlanConfig {
  return {
    id,
    name,
    priceMonthlyInr: 0,
    bestFor,
    limits: {
      monthly_order_limit: 0,
      csv_upload: true,
      max_import_rows_per_file: 25000,
      risk_scoring: "future",
      address_check: "future",
      ndr_dashboard: "future",
      daily_action_queue: "future",
      whatsapp_outbox: "future",
      manual_response_capture: "future",
      reports: "advanced",
      roi_dashboard: "advanced",
      api_access: "future",
      ...disabledIntegrations
    },
    gatedFeatures: scaleEnterprisePlaceholders
  };
}

export const planConfigs: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthlyInr: 0,
    bestFor: "RTO loss calculator and sample report",
    limits: { monthly_order_limit: 0, csv_upload: false, max_import_rows_per_file: 0, risk_scoring: "disabled", address_check: "disabled", ndr_dashboard: "disabled", daily_action_queue: "disabled", whatsapp_outbox: "disabled", manual_response_capture: "disabled", reports: "basic", roi_dashboard: "basic", ...disabledIntegrations }
  },
  audit: {
    id: "audit",
    name: "Audit",
    priceMonthlyInr: 999,
    bestFor: "Privacy-safe summary or anonymized CSV audit",
    limits: { monthly_order_limit: 0, csv_upload: true, max_import_rows_per_file: 1000, risk_scoring: "basic_rules", address_check: "basic", ndr_dashboard: "basic", daily_action_queue: "disabled", whatsapp_outbox: "disabled", manual_response_capture: "disabled", reports: "basic", roi_dashboard: "basic", ...disabledIntegrations }
  },
  pilot: {
    id: "pilot",
    name: "Pilot",
    priceMonthlyInr: 4999,
    bestFor: "14-day manual RTO/NDR rescue pilot",
    limits: { monthly_order_limit: 1000, csv_upload: true, max_import_rows_per_file: 1000, risk_scoring: "basic_rules", address_check: "basic", ndr_dashboard: "basic", daily_action_queue: "limited", whatsapp_outbox: "mock_only", manual_response_capture: "limited", reports: "basic", roi_dashboard: "basic", ...disabledIntegrations }
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthlyInr: 2999,
    bestFor: "Small Indian D2C sellers around 300-700 orders/month",
    limits: { monthly_order_limit: 500, csv_upload: true, max_import_rows_per_file: 1000, risk_scoring: "basic_rules", address_check: "basic", ndr_dashboard: "basic", daily_action_queue: "limited", whatsapp_outbox: "mock_only", manual_response_capture: "limited", reports: "basic", roi_dashboard: "basic", ...disabledIntegrations }
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceMonthlyInr: 7999,
    bestFor: "D2C sellers up to 2,000 orders/month who need a full daily recovery workflow",
    limits: { monthly_order_limit: 2000, csv_upload: true, multiple_imports: "enabled", max_import_rows_per_file: 5000, risk_scoring: "advanced_rules", address_check: "advanced_rules", ndr_dashboard: "advanced", daily_action_queue: "advanced", whatsapp_outbox: "mock_manual_provider_ready", manual_response_capture: "enabled", reports: "advanced", roi_dashboard: "advanced", prepaid_opportunities: "advanced", weekly_savings_report: "enabled", pincode_reports: "advanced", courier_reports: "advanced", sku_reports: "advanced", ...disabledIntegrations }
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthlyInr: 14999,
    bestFor: "Indian D2C sellers doing roughly 2,000-5,000 orders/month",
    limits: {
      monthly_order_limit: 5000,
      max_import_rows_per_file: 10000,
      csv_upload: true,
      multiple_imports: "enabled",
      multi_store: "enabled_limited",
      multi_brand: "disabled",
      risk_scoring: "advanced_rules_plus_custom_rules",
      address_check: "advanced_rules",
      ndr_dashboard: "advanced",
      daily_action_queue: "advanced",
      whatsapp_outbox: "mock_manual_provider_ready",
      real_whatsapp_api: false,
      manual_response_capture: "enabled",
      pincode_reports: "advanced",
      courier_reports: "advanced",
      sku_reports: "advanced",
      campaign_reports: "enabled_if_data_exists",
      ndr_reason_reports: "advanced",
      prepaid_opportunities: "advanced",
      weekly_savings_report: "enabled",
      monthly_strategy_report: "enabled",
      action_completion_tracking: "advanced",
      policy_simulator: "enabled",
      exportable_reports: "enabled",
      integration_readiness: "enabled",
      basic_team_workflow: "enabled",
      roles: "admin_ops_analyst_viewer",
      reports: "advanced",
      roi_dashboard: "advanced",
      managed_ops_support: "disabled",
      ml_model: "disabled",
      api_access: "placeholder_only",
      returns_module: "disabled",
      cashflow_module: "disabled",
      inventory_module: "disabled",
      integrations: false,
      managed_support: false
    },
    gatedFeatures: scaleEnterprisePlaceholders
  },
  managed_pro: futurePlan("managed_pro", "Managed Pro", "Future managed operations add-on"),
  scale: futurePlan("scale", "Scale", "Future automation and larger store portfolios"),
  enterprise: futurePlan("enterprise", "Enterprise", "Future enterprise permissions, API, and automation")
};

export const currentStarterPlan = planConfigs.starter;
export const currentProPlan = planConfigs.pro;

export function getPlanConfig(planId: PlanId = "starter") {
  return planConfigs[planId];
}

export function getStarterLimitWarning(orderCount: number, plan: PlanConfig = currentStarterPlan) {
  if (orderCount <= plan.limits.monthly_order_limit) return "";
  if (plan.id !== "starter") return `${plan.name} order limit warning: ${orderCount}/${plan.limits.monthly_order_limit} orders this month. Upgrade for larger volume.`;
  return `Starter order limit exceeded: ${orderCount}/${plan.limits.monthly_order_limit} orders this month. Upgrade for larger volume.`;
}

export function getUpgradePlaceholder() {
  return "This feature is available in Growth/Pro. Starter includes mock/manual workflow only.";
}

export function getProLimitWarning(orderCount: number, plan: PlanConfig = currentProPlan) {
  if (orderCount <= plan.limits.monthly_order_limit) return "";
  return `Pro order limit warning: ${orderCount}/${plan.limits.monthly_order_limit} orders this month. Larger volumes and multi-brand portfolios are available in Scale.`;
}

export function getScaleEnterprisePlaceholder(feature: string) {
  return `${feature}: ${scaleEnterprisePlaceholderMessage}`;
}
