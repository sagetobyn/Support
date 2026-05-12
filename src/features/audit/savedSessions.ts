import type { AuditSession } from "@/lib/audit";
import { formatCurrency, formatNumber } from "@/lib/reporting";

export const SAVED_AUDIT_LOCAL_ONLY_LABEL =
  "Saved in this browser only. Nothing is synced or sent unless you export it.";

export type SavedAuditSessionCard = {
  id: string;
  title: string;
  modeLabel: string;
  timestampLabel: string;
  qualificationLabel: string;
  nextAction: string;
  leakageLabel: string;
  sampleLabel: string;
  statusLabel: string;
};

function auditModeLabel(session: AuditSession) {
  if (session.mode === "csv") return "Anonymized CSV profit audit";
  if (session.mode === "pilot") return "Rescue pilot prep";
  return "Summary leakage check";
}

function statusLabel(session: AuditSession) {
  return session.status.replaceAll("_", " ");
}

function timestampLabel(createdAt: string, locale = "en-IN") {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return "Timestamp unavailable";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}

function qualificationFor(session: AuditSession) {
  const metrics = session.calculated_metrics;
  const hasCsvEvidence = session.mode === "csv" && (session.row_count || 0) > 0;
  const enoughLeakage = metrics.monthlyLeakage >= 75000;
  const materialLeakage = metrics.monthlyLeakage >= 30000;
  const enoughOrders = metrics.monthlyOrders >= 300;

  if (hasCsvEvidence && enoughLeakage && enoughOrders) {
    return {
      label: "Rescue pilot candidate",
      nextAction: "Open the rescue pilot planner with this audit selected."
    };
  }

  if (materialLeakage) {
    return {
      label: "Profit audit follow-up",
      nextAction: hasCsvEvidence
        ? "Review top leakage drivers and export the audit for founder review."
        : "Upload anonymized CSV if the seller wants driver ranking."
    };
  }

  return {
    label: "Leakage check only",
    nextAction: "Keep as a benchmark; avoid a hard rescue pilot pitch for now."
  };
}

export function buildSavedAuditSessionCard(session: AuditSession, locale = "en-IN"): SavedAuditSessionCard {
  const qualification = qualificationFor(session);
  return {
    id: session.id,
    title: session.brand_name || "Untitled seller",
    modeLabel: auditModeLabel(session),
    timestampLabel: timestampLabel(session.created_at, locale),
    qualificationLabel: qualification.label,
    nextAction: qualification.nextAction,
    leakageLabel: `${formatCurrency(session.calculated_metrics.monthlyLeakage)} estimated leakage`,
    sampleLabel: session.mode === "csv"
      ? `${formatNumber(session.row_count || 0)} anonymized rows`
      : `${formatNumber(session.calculated_metrics.monthlyOrders)} monthly orders`,
    statusLabel: statusLabel(session)
  };
}

export function buildSavedAuditSessionCards(sessions: AuditSession[], locale = "en-IN") {
  return sessions.map((session) => buildSavedAuditSessionCard(session, locale));
}

export function buildSavedAuditSessionExport(session: AuditSession) {
  return {
    fileName: `${session.brand_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "seller"}-profit-audit-session.json`,
    json: JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        localOnly: true,
        privacyNote: SAVED_AUDIT_LOCAL_ONLY_LABEL,
        session
      },
      null,
      2
    )
  };
}
