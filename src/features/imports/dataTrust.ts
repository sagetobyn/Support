import type { AnalysisReadinessItem, ImportRecord } from "@/types/domain";

export type DataTrustStatus = "empty" | "ready" | "limited" | "blocked";

export type DataTrust = {
  score: number;
  status: DataTrustStatus;
  headline: string;
  detail: string;
  readyCount: number;
  readiness: AnalysisReadinessItem[];
  limited: AnalysisReadinessItem[];
  blocked: AnalysisReadinessItem[];
  issues: AnalysisReadinessItem[];
};

export const analysisAreaLabels = {
  rtoNdr: "RTO/NDR leakage",
  pincodeCourier: "Pincode and courier analysis",
  sku: "SKU leakage",
  campaign: "Campaign leakage",
  margin: "Margin-aware profit"
} as const;

export type AnalysisAreaKey = keyof typeof analysisAreaLabels;

export function buildDataTrust(lastImport: ImportRecord | undefined, fallbackScore: number, orderCount: number): DataTrust {
  if (!orderCount) {
    return {
      score: 0,
      status: "empty",
      headline: "No operational data yet",
      detail: "Upload a CSV or load demo data before trusting cockpit insights.",
      readyCount: 0,
      readiness: [],
      limited: [],
      blocked: [],
      issues: []
    };
  }

  const readiness = lastImport?.analysisReadiness || [];
  const score = lastImport?.dataQualityScore ?? fallbackScore;
  const blocked = readiness.filter((item) => item.status === "blocked");
  const limited = readiness.filter((item) => item.status === "limited");
  const readyCount = readiness.filter((item) => item.status === "ready").length;
  const issues = [...blocked, ...limited];

  if (score < 60 || blocked.length >= 2) {
    return {
      score,
      status: "blocked",
      headline: "Data foundation needs work",
      detail: firstIssueDetail(issues, "Key fields are missing, so some cockpit insights should be treated as blocked."),
      readyCount,
      readiness,
      limited,
      blocked,
      issues
    };
  }

  if (blocked.length || limited.length || score < 85) {
    return {
      score,
      status: "limited",
      headline: "Some insights are directional",
      detail: firstIssueDetail(issues, "Some fields are missing, so use the cockpit for prioritization but verify before making policy changes."),
      readyCount,
      readiness,
      limited,
      blocked,
      issues
    };
  }

  return {
    score,
    status: "ready",
    headline: "Data foundation ready",
    detail: "The latest import has enough structure for the cockpit, queue, leakage map, and reports.",
    readyCount,
    readiness,
    limited,
    blocked,
    issues
  };
}

export function getAnalysisTrust(dataTrust: DataTrust, area: AnalysisAreaKey): AnalysisReadinessItem {
  const label = analysisAreaLabels[area];
  const match = dataTrust.readiness.find((item) => item.area === label);
  if (match) return match;

  if (dataTrust.status === "empty") {
    return {
      area: label,
      status: "blocked",
      reason: "Upload seller data before trusting this recommendation."
    };
  }

  return {
    area: label,
    status: "ready",
    reason: "Required fields are present for this recommendation."
  };
}

export function trustBadgeLabel(item: AnalysisReadinessItem) {
  if (item.status === "ready") return "Reliable";
  if (item.status === "limited") return "Directional";
  return "Needs data";
}

function firstIssueDetail(issues: AnalysisReadinessItem[], fallback: string) {
  const first = issues[0];
  return first ? `${first.area}: ${first.reason}` : fallback;
}
