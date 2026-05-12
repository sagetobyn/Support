import type { AuditRecommendation, AuditSession } from "@/lib/audit";
import { formatCurrency, formatNumber, formatPercent, type GroupMetric } from "@/lib/reporting";
import {
  auditConfidenceReason,
  driverRankingNeedsCsvLimitation,
  estimatedSavingsLimitation,
  invalidRowsExcludedLimitation,
  lowSampleLimitation,
  missingAuditFieldLimitation,
  reportLowSampleLimitation,
  summaryOnlyLimitation
} from "./auditLimitations.service";

export type AuditConfidenceLabel = "High" | "Medium" | "Low";

export interface RankedAuditAction {
  rank: number;
  title: string;
  action: string;
  reason: string;
  priorityLabel: "First" | "Next" | "Watch";
}

export interface AuditTopLeakSummary {
  driverType: string;
  label: string;
  description: string;
  actionHint: string;
  estimatedLoss: number | null;
  affectedOrders: number;
  rtoOrders: number;
  rtoRatePercent: number;
}

export interface AuditExecutiveSummary {
  headline: string;
  topLeak: AuditTopLeakSummary;
  firstAction: RankedAuditAction;
  rankedActions: RankedAuditAction[];
  confidence: {
    label: AuditConfidenceLabel;
    reason: string;
  };
  limitations: string[];
}

interface DriverCandidate {
  driverType: string;
  metric: Pick<GroupMetric, "label" | "total" | "rto" | "rate"> & Partial<Pick<GroupMetric, "loss" | "ndr">>;
  actionHint: string;
  keyword: RegExp;
}

export interface OrderReportExecutiveInput {
  orderVolume: number;
  estimatedMonthlyLoss: number;
  lowSampleSize: boolean;
  topRiskyPincodes: Array<{ label: string; total: number; rto: number; rate: number; lowSample?: boolean }>;
  topRtoCouriers: Array<{ label: string; total: number; rto: number; rate: number; lowSample?: boolean }>;
  topRtoSkus: Array<{ label: string; total: number; rto: number; rate: number; lowSample?: boolean }>;
  topNdrReasons: Array<{ label: string; total: number; rto: number; rate: number; lowSample?: boolean }>;
  dailyActionPlan: string[];
}

const fallbackAction: RankedAuditAction = {
  rank: 1,
  title: "Validate with anonymized CSV",
  action: "Ask for an anonymized order/shipment/NDR CSV before making policy changes.",
  reason: "Summary numbers can size leakage but cannot prove the driver.",
  priorityLabel: "First"
};

export function buildAuditExecutiveSummary(session: AuditSession): AuditExecutiveSummary {
  const topLeak = pickSessionTopLeak(session);
  const rankedActions = rankAuditActions(session.recommendations, topLeak);
  const firstAction = rankedActions[0] || fallbackAction;
  const confidence = sessionConfidence(session);
  const limitations = sessionLimitations(session, topLeak);

  return {
    headline: `${topLeak.description} First action: ${firstAction.action}`,
    topLeak,
    firstAction,
    rankedActions: rankedActions.length ? rankedActions : [fallbackAction],
    confidence,
    limitations
  };
}

export function buildOrderReportExecutiveSummary(input: OrderReportExecutiveInput): AuditExecutiveSummary {
  const candidates = [
    ...driverCandidates("Pincode", input.topRiskyPincodes, "Apply COD confirmation, partial-prepaid, or hold rules to this pincode before dispatch.", /pincode|cod|prepaid|hold/i),
    ...driverCandidates("Courier", input.topRtoCouriers, "Review this courier-lane before making any broad allocation change.", /courier|reattempt|allocation/i),
    ...driverCandidates("SKU", input.topRtoSkus, "Check product expectation, size/variant fit, and offer promise before scaling this SKU.", /sku|product|expectation|refusal/i),
    ...driverCandidates("NDR reason", input.topNdrReasons, "Work this NDR reason first in the daily rescue queue.", /ndr|reattempt|address|phone|call/i)
  ];
  const selected = pickCandidate(candidates);
  const topLeak = selected ? candidateToTopLeak(selected) : overallTopLeak(input.orderVolume, input.estimatedMonthlyLoss);
  const rankedActions = input.dailyActionPlan.slice(0, 5).map((action, index) => ({
    rank: index + 1,
    title: index === 0 ? "Start here" : `Action ${index + 1}`,
    action,
    reason: index === 0 ? topLeak.actionHint : "Keep the audit tied to daily COD/RTO/NDR execution.",
    priorityLabel: index === 0 ? "First" : index < 3 ? "Next" : "Watch"
  })) as RankedAuditAction[];
  const limitations = [
    ...(input.lowSampleSize ? [reportLowSampleLimitation(input.orderVolume)] : []),
    estimatedSavingsLimitation()
  ];

  return {
    headline: `${topLeak.description} First action: ${(rankedActions[0] || fallbackAction).action}`,
    topLeak,
    firstAction: rankedActions[0] || fallbackAction,
    rankedActions: rankedActions.length ? rankedActions : [fallbackAction],
    confidence: {
      label: input.lowSampleSize ? "Low" : input.orderVolume >= 100 ? "High" : "Medium",
      reason: input.lowSampleSize ? auditConfidenceReason("lowSample") : auditConfidenceReason(input.orderVolume >= 100 ? "usableOrderData" : "dataQualityGaps")
    },
    limitations
  };
}

function pickSessionTopLeak(session: AuditSession): AuditTopLeakSummary {
  const metrics = session.calculated_metrics;
  const candidates = [
    ...driverCandidates("Pincode", metrics.pincodeLeakage || [], "Verify or restrict risky COD orders in this pincode first.", /pincode|cod|prepaid|hold/i),
    ...driverCandidates("Courier", metrics.courierLeakage || [], "Review this courier and pincode pairing before changing broad allocation.", /courier|allocation|reattempt/i),
    ...driverCandidates("SKU", metrics.skuLeakage || [], "Check product promise, size/variant mismatch, and COD intent for this SKU.", /sku|product|expectation|refusal/i),
    ...driverCandidates("NDR reason", metrics.ndrReasonLeakage || [], "Work this NDR reason first before it becomes final RTO.", /ndr|reattempt|address|phone|call/i)
  ];
  const selected = pickCandidate(candidates);
  if (selected) return candidateToTopLeak(selected);

  const codLeakageDominates = metrics.codLeakage !== null && metrics.monthlyLeakage > 0 && metrics.codLeakage / metrics.monthlyLeakage >= 0.5;
  const driverType = codLeakageDominates ? "COD RTO" : "Overall RTO";
  return {
    driverType,
    label: "summary estimate",
    description: `${driverType} is the top leak to validate: ${formatCurrency(codLeakageDominates ? metrics.codLeakage || 0 : metrics.monthlyLeakage)} estimated monthly leakage.`,
    actionHint: "Use the summary estimate to decide whether an anonymized CSV audit is worth the seller's time.",
    estimatedLoss: codLeakageDominates ? metrics.codLeakage : metrics.monthlyLeakage,
    affectedOrders: metrics.monthlyOrders,
    rtoOrders: metrics.totalRtoOrders,
    rtoRatePercent: metrics.rtoPercentage
  };
}

function driverCandidates(driverType: string, rows: Array<DriverCandidate["metric"]>, actionHint: string, keyword: RegExp): DriverCandidate[] {
  return rows
    .filter((metric) => metric.total > 0 && (metric.rto > 0 || (metric.loss || 0) > 0 || (metric.ndr || 0) > 0))
    .map((metric) => ({ driverType, metric, actionHint, keyword }));
}

function pickCandidate(candidates: DriverCandidate[]) {
  return [...candidates].sort((a, b) => candidateImpact(b) - candidateImpact(a) || b.metric.rate - a.metric.rate || b.metric.total - a.metric.total)[0];
}

function candidateImpact(candidate: DriverCandidate) {
  return candidate.metric.loss ?? candidate.metric.rto;
}

function candidateToTopLeak(candidate: DriverCandidate): AuditTopLeakSummary {
  const loss = candidate.metric.loss ?? null;
  const lossText = loss !== null ? `${formatCurrency(loss)} estimated loss, ` : "";
  return {
    driverType: candidate.driverType,
    label: candidate.metric.label,
    description: `Top leak: ${candidate.driverType} ${candidate.metric.label} (${lossText}${candidate.metric.rto}/${candidate.metric.total} RTO, ${formatPercent(candidate.metric.rate * 100)} RTO rate).`,
    actionHint: candidate.actionHint,
    estimatedLoss: loss,
    affectedOrders: candidate.metric.total,
    rtoOrders: candidate.metric.rto,
    rtoRatePercent: candidate.metric.rate * 100
  };
}

function overallTopLeak(orderVolume: number, estimatedMonthlyLoss: number): AuditTopLeakSummary {
  return {
    driverType: "Overall RTO",
    label: "report estimate",
    description: `Top leak: overall RTO leakage (${formatCurrency(estimatedMonthlyLoss)} estimated monthly loss across ${formatNumber(orderVolume)} rows).`,
    actionHint: "Use the daily action queue to identify the first concrete COD/RTO/NDR action.",
    estimatedLoss: estimatedMonthlyLoss,
    affectedOrders: orderVolume,
    rtoOrders: 0,
    rtoRatePercent: 0
  };
}

function rankAuditActions(recommendations: AuditRecommendation[], topLeak: AuditTopLeakSummary): RankedAuditAction[] {
  return recommendations
    .map((recommendation, index) => ({
      recommendation,
      score: actionScore(recommendation, topLeak, index)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ recommendation }, index) => ({
      rank: index + 1,
      title: recommendation.title,
      action: recommendation.action,
      reason: recommendation.body,
      priorityLabel: index === 0 ? "First" : index < 3 ? "Next" : "Watch"
    }));
}

function actionScore(recommendation: AuditRecommendation, topLeak: AuditTopLeakSummary, index: number) {
  const text = `${recommendation.title} ${recommendation.action} ${recommendation.body}`;
  let score = 100 - index;
  if (new RegExp(topLeak.driverType.replace(/\s+/g, "|"), "i").test(text)) score += 40;
  if (/COD RTO|Overall RTO/i.test(topLeak.driverType) && /cod|rto|confirmation|prepaid/i.test(text)) score += 35;
  if (/NDR reason/i.test(topLeak.driverType) && /ndr|reattempt|call|address/i.test(text)) score += 35;
  if (/Pincode/i.test(topLeak.driverType) && /pincode|prepaid-only|partial-prepaid/i.test(text)) score += 35;
  if (/Courier/i.test(topLeak.driverType) && /courier|allocation|lane/i.test(text)) score += 35;
  return score;
}

function sessionConfidence(session: AuditSession): AuditExecutiveSummary["confidence"] {
  if (session.mode === "summary") {
    return {
      label: "Low",
      reason: auditConfidenceReason("summaryOnly")
    };
  }

  const quality = session.calculated_metrics.dataQuality;
  const validRows = quality?.validRows ?? session.row_count ?? 0;
  if (validRows < 50) {
    return {
      label: "Low",
      reason: auditConfidenceReason("lowSample")
    };
  }
  if ((quality?.invalidRows || 0) > 0 || (quality?.missingFields || []).length > 0 || validRows < 100) {
    return {
      label: "Medium",
      reason: auditConfidenceReason("dataQualityGaps")
    };
  }
  return {
    label: "High",
    reason: auditConfidenceReason("usableOrderData")
  };
}

function sessionLimitations(session: AuditSession, topLeak: AuditTopLeakSummary) {
  const quality = session.calculated_metrics.dataQuality;
  const validRows = quality?.validRows ?? session.row_count ?? 0;
  const limitations = new Set<string>();

  if (session.mode === "summary") {
    limitations.add(summaryOnlyLimitation());
  }
  if (session.mode === "csv" && validRows < 50) {
    limitations.add(lowSampleLimitation(validRows));
  }
  if ((quality?.invalidRows || 0) > 0) {
    limitations.add(invalidRowsExcludedLimitation(quality?.invalidRows || 0));
  }
  if ((quality?.missingFields || []).length > 0) {
    (quality?.missingFields || []).forEach((field) => limitations.add(missingAuditFieldLimitation(field)));
  }
  if (topLeak.label === "summary estimate" || topLeak.label === "report estimate") {
    limitations.add(driverRankingNeedsCsvLimitation());
  }
  limitations.add(estimatedSavingsLimitation());

  return [...limitations];
}
