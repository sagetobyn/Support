import { describe, expect, it } from "vitest";
import { defaultBrand, seedOrders } from "@/data/seed";
import { currentProPlan, getScaleEnterprisePlaceholder, planConfigs } from "@/features/plans";
import { addStore, createMainStore, filterOrdersByStore } from "@/features/stores";
import { analyzeCsvImport, importOrdersFromCsv } from "@/lib/csvImport";
import { defaultProRules, evaluateCustomRules } from "@/features/rules";
import { calculateAdvancedRiskScore } from "@/features/risk";
import { generateHighRiskCodHoldPolicies } from "@/features/policy-recommendations";
import { acceptPrepaidOpportunity, calculateMarginSafeIncentive, createPrepaidOpportunity } from "@/features/prepaid";
import { analyzePincodePolicies } from "@/features/pincode";
import { analyzeCourierPolicies } from "@/features/courier";
import { analyzeSkuLeakage } from "@/features/sku";
import { analyzeCampaignLeakage, campaignMissingEmptyState } from "@/features/campaigns";
import { defaultNdrPlaybooks, getNdrPlaybook, shouldEscalatePlaybook } from "@/features/ndr-playbooks";
import { buildAdvancedActionQueue, bulkUpdateActions } from "@/features/actions";
import { exportMessagesCsv, queueProviderReadyMessage } from "@/features/messaging";
import { calculateSavingsLedger } from "@/features/savings-ledger";
import { generateWeeklyFounderReport } from "@/features/weekly-report";
import { generateMonthlyStrategyReport } from "@/features/monthly-strategy";
import { simulatePolicy } from "@/features/policy-simulator";
import { canRole } from "@/features/roles";
import { exportReportsPackage } from "@/features/reports";

describe("Pro plan", () => {
  it("defines Pro limits and Scale/Enterprise gates", () => {
    expect(currentProPlan.priceMonthlyInr).toBe(14999);
    expect(currentProPlan.limits.monthly_order_limit).toBe(5000);
    expect(currentProPlan.limits.max_import_rows_per_file).toBe(10000);
    expect(currentProPlan.limits.risk_scoring).toBe("advanced_rules_plus_custom_rules");
    expect(planConfigs.scale.gatedFeatures?.length).toBeGreaterThan(0);
    expect(getScaleEnterprisePlaceholder("ML risk model")).toContain("Scale/Enterprise");
  });

  it("supports three stores and filters by store", () => {
    const main = createMainStore(defaultBrand.id);
    const second = addStore([main], { brandId: defaultBrand.id, storeName: "Instagram", platform: "Instagram / WhatsApp" }).stores;
    const third = addStore(second, { brandId: defaultBrand.id, storeName: "Woo", platform: "WooCommerce" }).stores;
    const fourth = addStore(third, { brandId: defaultBrand.id, storeName: "Blocked" });
    expect(fourth.warning).toContain("up to 3 stores");
    const orders = seedOrders.slice(0, 2).map((order, index) => ({ ...order, storeId: index ? main.id : third[0].id }));
    expect(filterOrdersByStore(orders, main.id)).toHaveLength(1);
  });

  it("parses Pro CSV fields and data quality hints", () => {
    const csv = "order_id,awb,payment_mode,order_value,pincode,courier,final_status,sku,campaign_name,store_id,gross_margin,discount_amount\nP1,A1,COD,1999,395007,Delhivery,In Transit,SKU1,Meta,store-1,45,200";
    const analysis = analyzeCsvImport(csv);
    expect(analysis.dataQualityScore).toBeGreaterThan(80);
    expect(analysis.fieldsPresent).toContain("campaign_name");
    const imported = importOrdersFromCsv({ csv, brandId: defaultBrand.id, settings: defaultBrand, existingOrders: [], storeId: "store-1" });
    expect(imported.orders[0].campaignName).toBe("Meta");
    expect(imported.orders[0].storeId).toBe("store-1");
  });

  it("evaluates custom rules and advanced risk", () => {
    const order = { ...seedOrders.find((item) => item.paymentMode === "COD" && !/delivered/i.test(item.finalStatus || ""))!, paymentMode: "COD" as const, orderValue: 3000, riskBucket: "High" as const, addressQualityScore: 40, finalStatus: "In Transit", recommendedAction: "send_cod_confirmation" as const };
    const result = evaluateCustomRules(order, defaultProRules);
    expect(result.recommendedAction).toBe("hold_order");
    const risk = calculateAdvancedRiskScore({ ...order, discountAmount: 1500, firstTimeCustomer: true }, { settings: defaultBrand, campaignRtoRate: 0.4, campaignSampleSize: 25 });
    expect(risk.customRuleMatches.length).toBeGreaterThan(0);
    expect(risk.confidenceLabel).toBeTruthy();
    expect(risk.expectedLeakageEstimate).toBeGreaterThan(0);
  });

  it("creates policy, prepaid, and leakage recommendations", () => {
    const policies = generateHighRiskCodHoldPolicies(seedOrders, defaultBrand);
    expect(policies.some((policy) => /hold/i.test(policy.title))).toBe(true);
    expect(analyzePincodePolicies(seedOrders, defaultBrand).length).toBeGreaterThan(0);
    expect(analyzeCourierPolicies(seedOrders, defaultBrand).mixWarning).toContain("mix");
    expect(analyzeSkuLeakage(seedOrders, defaultBrand)[0].recommendation).toBeTruthy();
    expect(analyzeCampaignLeakage(seedOrders, defaultBrand).length).toBeGreaterThan(0);
    expect(campaignMissingEmptyState()).toContain("campaign/source");
    const opportunity = createPrepaidOpportunity(seedOrders.find((order) => order.paymentMode === "COD" && order.riskBucket !== "Low")!, defaultBrand)!;
    expect(calculateMarginSafeIncentive(seedOrders[0], defaultBrand).maxSafeIncentive).toBeLessThanOrEqual(150);
    expect(acceptPrepaidOpportunity(opportunity, seedOrders.find((order) => order.id === opportunity.orderId)!, defaultBrand).saving.eventType).toBe("cod_converted_prepaid");
  });

  it("covers playbooks, actions, messaging, savings, reports, simulator, roles, and export", () => {
    const playbook = getNdrPlaybook("wrong_address", defaultNdrPlaybooks)!;
    expect(playbook.defaultTemplate).toBe("address_correction");
    expect(shouldEscalatePlaybook(playbook, 13)).toBe(true);
    const actions = buildAdvancedActionQueue(seedOrders, defaultBrand, generateHighRiskCodHoldPolicies(seedOrders, defaultBrand));
    expect(bulkUpdateActions(actions, [actions[0].id], "completed")[0].status).toBe("completed");
    const message = queueProviderReadyMessage({ brand: defaultBrand, order: seedOrders.find((order) => order.recommendedAction !== "no_action")! });
    expect(exportMessagesCsv([message])).toContain("template_type");
    const ledger = calculateSavingsLedger([], [message], defaultBrand, seedOrders);
    expect(ledger.netEstimatedBenefit).toBeLessThanOrEqual(0);
    expect(generateWeeklyFounderReport({ brand: defaultBrand, orders: seedOrders, savingsEvents: [] }).sections.executiveSummary).toBeTruthy();
    expect(generateMonthlyStrategyReport({ brand: defaultBrand, orders: seedOrders, savingsEvents: [] }).experiments).toHaveLength(5);
    expect(simulatePolicy(seedOrders, defaultBrand, { policyType: "cod_verification_high_risk", assumedReductionPercent: 20, assumedConversionLossPercent: 5, assumedInterventionCost: 5, pilotDurationDays: 14 }).riskNotes[0]).toContain("simulation");
    expect(canRole("viewer", "queue_message")).toBe(false);
    expect(canRole("admin", "delete_workspace")).toBe(true);
    expect(exportReportsPackage({ stores: [], imports: [], orders: seedOrders.slice(0, 1), actions: [], messages: [message], savingsEvents: [], policyRecommendations: [], weeklyReports: [], monthlyStrategyReports: [], audits: [] })).toContain("pro_v1");
  });
});
