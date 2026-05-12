"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import { defaultCalculatorInputs, sellerCategories, shippingPlatforms, type SellerCategory, type ShippingPlatform } from "@/lib/calculator";
import {
  exportAuditSessionsCsv,
  generateCsvAudit,
  generateSummaryAudit,
  parseAnonymizedAuditCsv,
  type AuditSession,
  type CsvAuditParseResult,
  type SummaryAuditInputs
} from "@/lib/audit";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/reporting";
import { CALCULATOR_FORMULA_REGISTRY, calculateRtoLossPerOrder } from "@/features/calculator";
import {
  ANONYMIZED_AUDIT_DISALLOWED_FIELDS,
  ANONYMIZED_AUDIT_OPTIONAL_FIELDS,
  ANONYMIZED_AUDIT_REQUIRED_FIELDS,
  ANONYMIZED_CSV_SCHEMA_ANCHOR,
  ANONYMIZED_CSV_SCHEMA_DOC_PATH,
  AUDIT_MODE_REGISTRY,
  PAID_AUDIT_DELIVERABLES,
  PAID_AUDIT_DOC_PATH,
  PAID_AUDIT_NOT_INCLUDED,
  PAID_AUDIT_OFFER,
  PAID_AUDIT_PROCESS,
  PAID_AUDIT_SAMPLE_OUTLINE,
  SAMPLE_CSV_FIELD_COVERAGE_ANCHOR,
  SAMPLE_CSV_FIELD_COVERAGE_DOC_PATH,
  SAVED_AUDIT_LOCAL_ONLY_LABEL,
  auditModeById,
  buildSavedAuditSessionCards,
  buildSavedAuditSessionExport,
  buildPaidAuditOfferCopy
} from "@/features/audit";
import { buildAuditToPilotHandoff, type AuditToPilotHandoff } from "@/features/pilot-handoff";
import { buildAuditExecutiveSummary } from "@/features/reports";
import { buildAuditPreSalesProofSnippet } from "@/features/leads";

const auditStorageKey = "wembro:audit-sessions";
const previousAuditStorageKey = "rtoshield:audit-sessions";
const auditPilotHandoffStorageKey = "wembro:audit-pilot-handoff";
const paidAuditOfferCopy = buildPaidAuditOfferCopy();

function initialSummary(): SummaryAuditInputs {
  return {
    brandName: "",
    contact: "",
    category: "Fashion",
    monthlyOrders: defaultCalculatorInputs.monthlyOrders,
    codPercentage: defaultCalculatorInputs.codPercentage,
    overallRtoPercentage: defaultCalculatorInputs.overallRtoPercentage,
    codRtoPercentage: defaultCalculatorInputs.codRtoPercentage,
    averageOrderValue: defaultCalculatorInputs.averageOrderValue,
    forwardShippingCost: defaultCalculatorInputs.forwardShippingCost,
    returnShippingCost: defaultCalculatorInputs.returnShippingCost,
    packagingCost: defaultCalculatorInputs.packagingCost,
    estimatedCac: defaultCalculatorInputs.estimatedCac,
    codFee: defaultCalculatorInputs.codFee,
    supportOpsCost: defaultCalculatorInputs.supportOpsCost,
    shippingPlatform: defaultCalculatorInputs.shippingPlatform,
    knownRtoReasons: [],
    problemPincodes: [],
    problemCouriers: [],
    pilotSoftwareCost: defaultCalculatorInputs.pilotSoftwareCost
  };
}

export default function AuditPage() {
  const [mode, setMode] = useState<"summary" | "csv" | "pilot">("summary");
  const [summary, setSummary] = useState<SummaryAuditInputs>(() => initialSummary());
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [activeSession, setActiveSession] = useState<AuditSession | null>(null);
  const [parseResult, setParseResult] = useState<CsvAuditParseResult | null>(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      setSessions(JSON.parse(localStorage.getItem(auditStorageKey) || localStorage.getItem(previousAuditStorageKey) || "[]") as AuditSession[]);
    } catch {
      setSessions([]);
    }
  }, []);

  function saveSession(session: AuditSession) {
    const next = [session, ...sessions];
    persistSessions(next);
    setActiveSession(session);
    setMessage("Profit audit estimate saved locally. No external API was called.");
  }

  function persistSessions(next: AuditSession[]) {
    setSessions(next);
    localStorage.setItem(auditStorageKey, JSON.stringify(next));
  }

  function submitSummary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!summary.brandName.trim()) {
      setMessage("Brand name is required.");
      return;
    }
    if (summary.monthlyOrders <= 0 || summary.codPercentage < 0 || summary.codPercentage > 100 || summary.overallRtoPercentage < 0 || summary.overallRtoPercentage > 100) {
      setMessage("Monthly orders must be positive and percentages must be between 0 and 100.");
      return;
    }
    saveSession(generateSummaryAudit(summary));
  }

  async function handleCsv(file?: File) {
    if (!file) return;
    const csv = await file.text();
    const parsed = parseAnonymizedAuditCsv(csv, calculateRtoLossPerOrder(summary));
    setCsvFileName(file.name);
    setParseResult(parsed);
    const schemaWarning = parsed.schemaValidation.blockingIssues.length ? ` Fix before audit: ${parsed.schemaValidation.blockingIssues.join(" ")}` : "";
    setMessage(`${file.name} parsed: ${parsed.rows.length} valid rows, ${parsed.invalidRows.length} invalid rows.${schemaWarning}`);
  }

  function generateCsvSession() {
    if (!parseResult?.rows.length) {
      setMessage("Upload an anonymized CSV with valid rows first.");
      return;
    }
    if (!parseResult.schemaValidation.canGenerateAudit) {
      setMessage(`Fix the anonymized CSV schema before generating the audit: ${parseResult.schemaValidation.cleanupInstructions.join(" ")}`);
      return;
    }
    saveSession(generateCsvAudit({
      brandName: summary.brandName || "Anonymized Seller",
      contact: summary.contact,
      category: summary.category,
      csvFileName,
      rows: parseResult.rows,
      invalidRowCount: parseResult.invalidRows.length,
      missingFields: parseResult.missingFields,
      rtoLossPerOrder: calculateRtoLossPerOrder(summary)
    }));
  }

  function saveAuditPilotHandoff() {
    if (!activeSession) {
      setMessage("Generate or select a profit audit before saving a rescue pilot handoff.");
      return;
    }
    const handoff = buildAuditToPilotHandoff(activeSession);
    localStorage.setItem(auditPilotHandoffStorageKey, JSON.stringify(handoff));
    setMessage("Profit-audit-to-rescue-pilot handoff saved locally. Open the rescue pilot planner and create the plan when ready.");
  }

  function exportAuditPilotHandoff() {
    if (!activeSession) {
      setMessage("Generate or select a profit audit before exporting a rescue pilot handoff.");
      return;
    }
    const handoff = buildAuditToPilotHandoff(activeSession);
    const blob = new Blob([JSON.stringify(handoff, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = handoff.exportFileName;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Profit-audit-to-rescue-pilot handoff exported locally. No customer-level data was included.");
  }

  function deleteSavedSession(sessionId: string) {
    const next = sessions.filter((session) => session.id !== sessionId);
    persistSessions(next);
    if (activeSession?.id === sessionId) setActiveSession(null);
    setMessage("Saved profit audit deleted from this browser. No server data was changed.");
  }

  function exportSavedSession(session: AuditSession) {
    const auditExport = buildSavedAuditSessionExport(session);
    const blob = new Blob([auditExport.json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = auditExport.fileName;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Saved profit audit exported locally. No customer-level data was included.");
  }

  const exportJson = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sessions, null, 2))}`;
  const exportCsv = `data:text/csv;charset=utf-8,${encodeURIComponent(exportAuditSessionsCsv(sessions))}`;
  const savedAuditCards = buildSavedAuditSessionCards(sessions);
  const activeMode = auditModeById[mode];
  const piiLabels = ANONYMIZED_AUDIT_DISALLOWED_FIELDS.map((field) => field.label).join(", ");
  const messageIsSuccess = message.includes("saved") || (message.includes("parsed") && !message.includes("Fix before audit"));
  const activeHandoff = activeSession ? buildAuditToPilotHandoff(activeSession) : null;

  return (
    <MarketingPage>
      <section className="report-hero">
        <p className="eyebrow">Profit Audit</p>
        <h1>Find exactly where money is leaking — before you commit to a rescue pilot.</h1>
        <p className="hero-copy">Start with summary numbers. If the estimate is useful, move to an anonymized CSV. Customer names, phones, emails, and full addresses are not accepted in public audit modes.</p>
        <p className="muted">Full pilot prep is a readiness checklist only here. Customer contact data belongs only in a separately agreed rescue workflow.</p>
      </section>

      <section className="mode-tabs">
        {AUDIT_MODE_REGISTRY.map((item) => (
          <button className={mode === item.id ? "button" : "button secondary"} key={item.id} onClick={() => setMode(item.id)}>
            {item.label}
          </button>
        ))}
      </section>

      <section className="calculator-layout single">
        <div className="panel">
          <p className="eyebrow">Audit mode boundary</p>
          <h2>{activeMode.title}</h2>
          <div className="result-list">
            <Result label="Boundary" value={activeMode.boundary} />
            <Result label="Seller should share" value={activeMode.sellerAction} />
            <Result label="Next step" value={activeMode.nextStep} />
          </div>
        </div>
      </section>

      <section className="calculator-layout single" id="paid-audit-offer">
        <div className="panel">
          <p className="eyebrow">Profit audit artifact</p>
          <h2>{PAID_AUDIT_OFFER.priceLabel} {PAID_AUDIT_OFFER.title}</h2>
          <p className="muted">A written pre-rescue-pilot artifact for sellers who want the leakage estimate, driver diagnosis, and next-step recommendation packaged clearly before committing to a rescue pilot.</p>
          <div className="metrics grid">
            <Metric label="Price" value={PAID_AUDIT_OFFER.priceLabel} />
            <Metric label="Data" value="Summary or anonymized CSV" />
            <Metric label="Timeline" value={PAID_AUDIT_OFFER.timelineLabel} />
          </div>
          <h3>Deliverables</h3>
          <div className="result-list">
            {PAID_AUDIT_DELIVERABLES.map((item) => <Result key={item.label} label={item.label} value={item.detail} />)}
          </div>
          <h3>Timeline and process</h3>
          {PAID_AUDIT_PROCESS.map((item) => (
            <div className="action-row" key={item.step}>
              <strong>{item.step}. {item.title}</strong>
              <p className="muted">{item.detail}</p>
            </div>
          ))}
          <h3>Sample outline</h3>
          <TextList items={PAID_AUDIT_SAMPLE_OUTLINE} />
          <h3>Not included</h3>
          <TextList items={PAID_AUDIT_NOT_INCLUDED} />
          <label>
            <span>Copyable scope</span>
            <textarea aria-label="Copyable profit audit scope" className="input" readOnly rows={16} value={paidAuditOfferCopy} />
          </label>
          <p className="notice">Canonical repo guide: <code>{PAID_AUDIT_DOC_PATH}</code>. No checkout or payment integration is connected on this page.</p>
        </div>
      </section>

      {message && <section className="calculator-layout single"><div className={messageIsSuccess ? "success" : "notice"}>{message}</div></section>}

      {activeHandoff && (
        <AuditToPilotHandoffPanel
          handoff={activeHandoff}
          onExport={exportAuditPilotHandoff}
          onSave={saveAuditPilotHandoff}
        />
      )}

      {mode === "summary" && (
        <section className="calculator-layout">
          <form className="panel" onSubmit={submitSummary}>
            <h2>{auditModeById.summary.title}</h2>
            <p className="muted">{auditModeById.summary.boundary}</p>
            <p className="notice">Allowed: monthly orders, COD share, RTO rate, average order value, cost assumptions, top return reasons, problem pincodes, and problem couriers.</p>
            <SummaryForm summary={summary} setSummary={setSummary} />
            <button className="button" type="submit">Generate profit audit</button>
          </form>
          <AuditResult session={activeSession} />
        </section>
      )}

      {mode === "csv" && (
        <section className="calculator-layout">
          <div className="panel">
            <h2>{auditModeById.csv.title}</h2>
            <p className="muted">{auditModeById.csv.boundary}</p>
            <p className="notice">Disallowed PII: {piiLabels}. <a href={ANONYMIZED_CSV_SCHEMA_ANCHOR}>View the anonymized CSV schema</a>.</p>
            <p className="notice">Need to know why each field matters? <a href={SAMPLE_CSV_FIELD_COVERAGE_ANCHOR}>View CSV field coverage</a>. Full guide: <code>{SAMPLE_CSV_FIELD_COVERAGE_DOC_PATH}</code>.</p>
            <h3>Required fields</h3>
            <FieldPills fields={ANONYMIZED_AUDIT_REQUIRED_FIELDS} />
            <h3>Optional fields</h3>
            <FieldPills fields={ANONYMIZED_AUDIT_OPTIONAL_FIELDS} />
            <div className="form-grid one">
              <Field label="Brand name" value={summary.brandName} onChange={(value) => setSummary((current) => ({ ...current, brandName: value }))} />
              <label>
                <span className="muted">Anonymized CSV</span>
                <input className="input" type="file" accept=".csv,text/csv" onChange={(event) => handleCsv(event.target.files?.[0])} />
              </label>
            </div>
            {parseResult && (
              <>
                <div className="metrics grid">
                  <Metric label="Valid rows" value={parseResult.rows.length} />
                  <Metric label="Invalid rows" value={parseResult.invalidRows.length} />
                  <Metric label="Missing fields" value={parseResult.missingFields.length || "None"} />
                  <Metric label="PII columns" value={parseResult.disallowedFields.length || "None"} />
                </div>
                {!parseResult.schemaValidation.canGenerateAudit && (
                  <div className="notice">
                    <strong>Fix these schema issues before generating the audit:</strong>
                    <ul>
                      {parseResult.schemaValidation.cleanupInstructions.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {parseResult.schemaValidation.canGenerateAudit && (
                  <p className="success">Schema check passed. No name, phone, email, full address, or customer ID columns were detected.</p>
                )}
                <h3>Preview</h3>
                <MiniTable rows={parseResult.previewRows.map((row) => [row.order_id, row.pincode, row.payment_mode, row.order_value, row.courier, row.final_status])} headers={["Order", "Pincode", "Payment", "Value", "Courier", "Final"]} />
                <h3>Invalid rows</h3>
                {parseResult.invalidRows.length ? <MiniTable rows={parseResult.invalidRows.slice(0, 8).map((row) => [row.row, row.issues.join("; ")])} headers={["Row", "Issues"]} /> : <p className="muted">No invalid rows detected.</p>}
                <button className="button" onClick={generateCsvSession}>Generate CSV profit audit</button>
              </>
            )}
          </div>
          <AuditResult session={activeSession} />
        </section>
      )}

      {mode === "pilot" && (
        <section className="calculator-layout">
          <div className="panel">
            <h2>{auditModeById.pilot.title}</h2>
            <p className="muted">{auditModeById.pilot.boundary}</p>
            <p className="notice">Do not upload customer names, phone numbers, emails, or full addresses on this public audit page.</p>
            <Checklist items={[
              "Summary audit result",
              "Anonymized last-30-days order/shipment/NDR CSV",
              "Daily CSV export owner",
              "Manual WhatsApp/call process owner",
              "Brand cost assumptions",
              "Ops contact person",
              "Approval rules for hold, reattempt, address correction, cancellation"
            ]} />
          </div>
          <div className="panel">
            <h2>Rescue Pilot Readiness Checklist</h2>
            <Checklist items={[
              "Confirm brand cost assumptions",
              "Upload anonymized baseline order/shipment/NDR CSV",
              "Review profit audit",
              "Define action rules",
              "Start rescue pilot",
              "Track daily actions",
              "Produce weekly savings report"
            ]} />
            <Link className="button" href="/pilot">Create rescue pilot plan</Link>
          </div>
        </section>
      )}

      <section className="calculator-layout single" id="anonymized-csv-schema">
        <div className="panel">
          <p className="eyebrow">Schema doc</p>
          <h2>Anonymized CSV fields</h2>
          <p className="muted">Canonical repo guide: <code>{ANONYMIZED_CSV_SCHEMA_DOC_PATH}</code>. Use this schema for the public profit audit only; the rescue pilot has a separate data-sharing boundary.</p>
          <MiniTable
            headers={["Field", "Mode", "Purpose"]}
            rows={[
              ...ANONYMIZED_AUDIT_REQUIRED_FIELDS.map((field) => [field, "Required", fieldPurpose(field)]),
              ...ANONYMIZED_AUDIT_OPTIONAL_FIELDS.map((field) => [field, "Optional", fieldPurpose(field)])
            ]}
          />
          <p className="notice">Do not include: {piiLabels}. If the seller's export contains them, remove those columns before upload.</p>
        </div>
      </section>

      <section className="calculator-layout single" id="csv-field-coverage">
        <div className="panel">
          <p className="eyebrow">Field coverage</p>
          <h2>What each anonymized CSV field unlocks</h2>
          <p className="muted">Canonical repo guide: <code>{SAMPLE_CSV_FIELD_COVERAGE_DOC_PATH}</code>. Fictional fixture: <code>sample-data/anonymized-audit-field-coverage-sample.csv</code>.</p>
          <MiniTable
            headers={["Field", "Insight unlocked", "Seller decision"]}
            rows={[
              ["pincode", "Pincode leakage ranking", "Where to narrow delivery rescue first"],
              ["courier", "Courier and lane leakage ranking", "Which courier lanes need review before pilot action"],
              ["payment_mode", "COD vs prepaid leakage comparison", "Whether COD conversion or verification should be considered"],
              ["order_value", "Estimated INR impact", "Which leakage cluster is worth acting on first"],
              ["ndr_reason", "Failed-delivery reason ranking", "Which manual rescue playbook to use"],
              ["final_status", "Delivered vs RTO outcome baseline", "Whether the estimate is grounded enough for a pilot"],
              ["sku / product_name", "Product leakage grouping", "Whether the problem is product-specific"],
              ["attempt_count", "NDR urgency", "Whether to continue, narrow, or stop rescue attempts"]
            ]}
          />
          <p className="notice">No customer name, phone, email, full address, customer ID, or profile link is needed for this field coverage. Missing fields reduce confidence; they do not justify overclaiming savings.</p>
        </div>
      </section>

      <section className="lead-layout">
        <div className="panel">
          <h2>Your saved profit audits</h2>
          <p className="muted">{SAVED_AUDIT_LOCAL_ONLY_LABEL}</p>
          <div className="toolbar">
            <a className="button secondary" href={exportJson} download="audit-sessions.json">Export all JSON</a>
            <a className="button secondary" href={exportCsv} download="audit-sessions.csv">Export all CSV</a>
          </div>
          <div className="lead-list">
            {savedAuditCards.length ? savedAuditCards.map((card) => (
              <article className="action-row text-left" key={card.id}>
                <div className="split">
                  <div>
                    <strong>{card.title}</strong>
                    <div className="muted">{card.timestampLabel} · {card.modeLabel} · {card.statusLabel}</div>
                  </div>
                  <span className="badge neutral">{card.qualificationLabel}</span>
                </div>
                <div>{card.leakageLabel} · {card.sampleLabel}</div>
                <p className="muted">{card.nextAction}</p>
                <div className="toolbar tight">
                  <button className="button secondary" type="button" onClick={() => {
                    const session = sessions.find((item) => item.id === card.id);
                    if (session) setActiveSession(session);
                  }}>Open audit</button>
                  <button className="button secondary" type="button" onClick={() => {
                    const session = sessions.find((item) => item.id === card.id);
                    if (session) exportSavedSession(session);
                  }}>Export</button>
                  <button className="button secondary" type="button" onClick={() => deleteSavedSession(card.id)}>Delete local copy</button>
                </div>
              </article>
            )) : <p className="empty">No saved profit audits yet — run one above.</p>}
          </div>
        </div>
        <div className="panel">
          <h2>What's next?</h2>
          <p>Use this profit audit to decide if a deeper review (anonymized CSV) or a rescue pilot is worth your time.</p>
          <div className="hero-actions">
            <Link className="button secondary" href="/sample-report">View sample profit audit</Link>
            <Link className="button" href="/pilot">Plan rescue pilot</Link>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}

function AuditToPilotHandoffPanel({
  handoff,
  onExport,
  onSave
}: {
  handoff: AuditToPilotHandoff;
  onExport: () => void;
  onSave: () => void;
}) {
  return (
    <section className={`panel wide-section pilot-handoff audit-handoff audit-handoff--${handoff.status}`}>
      <div className="split">
        <div>
          <p className="eyebrow">Profit-audit-to-rescue-pilot handoff</p>
          <h2>{handoff.headline}</h2>
          <p className="muted">{handoff.nextMission}</p>
        </div>
        <span className="badge neutral">{handoff.status.replaceAll("_", " ")}</span>
      </div>
      <p className="notice">{handoff.privacyLabel}</p>
      <div className="result-list">
        {handoff.summaryFields.map((field) => <Result key={field.label} label={field.label} value={field.value} />)}
        <Result label="Source" value={handoff.modeLabel} />
      </div>
      <div className="pilot-handoff__risks">
        <div>
          <strong>Assumptions carried forward</strong>
          {handoff.assumptions.map((item) => <p key={item}>{item}</p>)}
        </div>
        <div>
          <strong>Proof needed before claiming results</strong>
          {handoff.proofRequests.map((item) => <p key={item}>{item}</p>)}
        </div>
      </div>
      <p className="notice">{handoff.localTransferNote}</p>
      <div className="toolbar tight">
        <button className="button secondary" type="button" onClick={onSave}>Save rescue pilot handoff</button>
        <button className="button secondary" type="button" onClick={onExport}>Export handoff JSON</button>
        <Link className="button" href="/pilot">Open rescue pilot planner</Link>
      </div>
    </section>
  );
}

function SummaryForm({ summary, setSummary }: { summary: SummaryAuditInputs; setSummary: React.Dispatch<React.SetStateAction<SummaryAuditInputs>> }) {
  const numeric: Array<[keyof SummaryAuditInputs, string]> = [
    ["monthlyOrders", "Monthly orders"],
    ["codPercentage", "Cash-on-delivery share (%)"],
    ["overallRtoPercentage", "Return rate (%)"],
    ["codRtoPercentage", "Cash-order return rate (%) — optional"],
    ["averageOrderValue", "Average order value (₹)"],
    ["forwardShippingCost", "Forward shipping cost (₹)"],
    ["returnShippingCost", "Return shipping cost (₹)"],
    ["packagingCost", "Packaging cost (₹)"],
    ["estimatedCac", "Customer acquisition cost / order (₹)"],
    ["codFee", "Cash-on-delivery fee (₹)"],
    ["supportOpsCost", "Support cost per return (₹)"],
    ["pilotSoftwareCost", "Software / pilot cost (₹)"]
  ];
  return (
    <div className="lead-grid">
      <Field label="Brand name" value={summary.brandName} onChange={(value) => setSummary((current) => ({ ...current, brandName: value }))} />
      <Field label="Contact" value={summary.contact || ""} onChange={(value) => setSummary((current) => ({ ...current, contact: value }))} />
      <label><span>Category</span><select className="select" value={summary.category} onChange={(event) => setSummary((current) => ({ ...current, category: event.target.value as SellerCategory }))}>{sellerCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Main courier/shipping platform</span><select className="select" value={summary.shippingPlatform} onChange={(event) => setSummary((current) => ({ ...current, shippingPlatform: event.target.value as ShippingPlatform }))}>{shippingPlatforms.map((item) => <option key={item}>{item}</option>)}</select></label>
      {numeric.map(([key, label]) => <Field key={key} label={label} type="number" value={String(summary[key] ?? "")} onChange={(value) => setSummary((current) => ({ ...current, [key]: value === "" ? null : Number(value) }))} />)}
      <Field label="Top 3 reasons for returns" value={summary.knownRtoReasons?.join(", ") || ""} onChange={(value) => setSummary((current) => ({ ...current, knownRtoReasons: value.split(",").map((item) => item.trim()).filter(Boolean) }))} />
      <Field label="Worst 3 pincodes" value={summary.problemPincodes?.join(", ") || ""} onChange={(value) => setSummary((current) => ({ ...current, problemPincodes: value.split(",").map((item) => item.trim()).filter(Boolean) }))} />
      <Field label="Worst 3 couriers" value={summary.problemCouriers?.join(", ") || ""} onChange={(value) => setSummary((current) => ({ ...current, problemCouriers: value.split(",").map((item) => item.trim()).filter(Boolean) }))} />
    </div>
  );
}

function AuditResult({ session }: { session: AuditSession | null }) {
  const [proofMessage, setProofMessage] = useState("");
  if (!session) {
    return <div className="panel"><h2>Profit Audit Output</h2><p className="muted">Generate a profit audit estimate to see the top leak, first action, confidence, and ranked next actions.</p></div>;
  }
  const metrics = session.calculated_metrics;
  const executive = buildAuditExecutiveSummary(session);
  const drivers = leakageDriverRows(metrics);
  const proofSnippet = buildAuditPreSalesProofSnippet({
    session,
    topLeak: `${executive.topLeak.driverType}: ${executive.topLeak.label}`,
    firstAction: executive.firstAction.action
  });

  async function copyProofSnippet() {
    await navigator.clipboard.writeText(proofSnippet);
    setProofMessage("Founder-safe snippet copied. It contains estimates and assumptions only.");
  }

  return (
    <div className="panel output-panel">
      <h2>Executive Summary</h2>

      <div className="recommendation-strip" style={{ marginBottom: 14 }}>
        <strong>{executive.topLeak.description}</strong>
        <span>First action: {executive.firstAction.action}</span>
      </div>

      <div className="result-list">
        <Result label="Top leak" value={`${executive.topLeak.driverType}: ${executive.topLeak.label}`} strong />
        <Result label="First action" value={executive.firstAction.action} />
        <Result label="Confidence" value={`${executive.confidence.label} - ${executive.confidence.reason}`} />
        <Result label="Primary caveat" value={executive.limitations[0]} />
      </div>

      <h3>Ranked Next Actions</h3>
      {executive.rankedActions.map((item) => (
        <div className="action-row" key={`${item.rank}-${item.title}`}>
          <div className="split">
            <strong>#{item.rank} {item.title}</strong>
            <span className="badge">{item.priorityLabel}</span>
          </div>
          <p>{item.action}</p>
          <p className="muted">{item.reason}</p>
        </div>
      ))}

      <h3>Confidence and Limitations</h3>
      {executive.limitations.map((item) => <div className="action-row" key={item}><p>{item}</p></div>)}

      <h3>Founder-safe proof snippet</h3>
      <div className="action-row">
        <p className="muted">Copy this for manual follow-up. It is estimate-labeled and excludes customer-level data.</p>
        <textarea aria-label="Founder-safe audit proof snippet" className="input" readOnly rows={9} value={proofSnippet} />
        <div className="toolbar tight">
          <button className="button secondary" type="button" onClick={copyProofSnippet}>Copy snippet</button>
        </div>
        {proofMessage ? <p className="success">{proofMessage}</p> : null}
      </div>

      <h3>Assumptions and Metrics</h3>
      <div className="result-list">
        <Result label="Estimated monthly leakage" value={formatCurrency(metrics.monthlyLeakage)} strong />
        <Result label="If nothing changes this year" value={formatCurrency(metrics.monthlyLeakage * 12)} />
        <Result label="Estimated COD leakage" value={metrics.codLeakage === null ? "Not available" : formatCurrency(metrics.codLeakage)} />
        <Result label="Estimated RTO orders" value={formatNumber(metrics.totalRtoOrders)} />
        <Result label="Estimated loss per RTO" value={formatCurrency(metrics.rtoLossPerOrder)} />
        <Result label="Formula basis" value={CALCULATOR_FORMULA_REGISTRY.rtoLossPerOrder.formula} />
        <Result label="Savings at 10 / 20 / 30%" value={`${formatCurrency(metrics.savings10)} / ${formatCurrency(metrics.savings20)} / ${formatCurrency(metrics.savings30)}`} />
      </div>

      <h3>Top Leakage Drivers</h3>
      {drivers.length ? drivers.map((driver, index) => (
        <div className="action-row" key={driver.label} style={{ borderLeft: index === 0 ? "4px solid var(--red)" : "4px solid var(--amber)" }}>
          <div className="split">
            <strong>#{index + 1} {driver.label}: {driver.top?.label}</strong>
            <span className="badge" style={{ background: index === 0 ? "#ffe4e0" : "#fff4d6", color: index === 0 ? "var(--red)" : "var(--amber)" }}>{formatCurrency(driver.totalLoss)} loss</span>
          </div>
          <div className="muted">{driver.top?.total} orders · {driver.top?.rto} RTO · {formatPercent((driver.top?.rate || 0) * 100)} RTO rate</div>
          <div className="muted">{driver.top?.total ? `This ${driver.label.toLowerCase()} alone accounts for ${formatCurrency(driver.top?.loss || 0)} in estimated leakage.` : ""}</div>
        </div>
      )) : <p className="muted">Upload an anonymized CSV to unlock pincode, courier, SKU, and NDR driver analysis.</p>}

      <div className="report-cta" style={{ marginTop: 18, borderRadius: 8 }}>
        <div>
          <h3>Ready to fix this?</h3>
          <p>Based on this profit audit, here is your personalized rescue pilot plan.</p>
        </div>
        <Link className="button" href="/pilot" style={{ textDecoration: "none" }}>Start rescue pilot</Link>
      </div>
    </div>
  );
}

function leakageDriverRows(metrics: AuditSession["calculated_metrics"]) {
  const drivers = [
    { label: "Pincode", rows: metrics.pincodeLeakage },
    { label: "Courier", rows: metrics.courierLeakage },
    { label: "SKU", rows: metrics.skuLeakage },
    { label: "NDR reason", rows: metrics.ndrReasonLeakage }
  ].filter((driver) => driver.rows && driver.rows.length > 0) as Array<{ label: string; rows: Array<{ label: string; total: number; rto: number; loss: number; rate: number }> }>;

  return drivers
    .map((driver) => ({
      label: driver.label,
      top: driver.rows[0],
      totalLoss: driver.rows.reduce((sum, row) => sum + row.loss, 0)
    }))
    .sort((a, b) => b.totalLoss - a.totalLoss || (b.top?.rate || 0) - (a.top?.rate || 0));
}

function Checklist({ items }: { items: readonly string[] }) {
  return <div className="option-list">{items.map((item) => <label className="consent-row" key={item}><input type="checkbox" /> <span>{item}</span></label>)}</div>;
}

function TextList({ items }: { items: readonly string[] }) {
  return <div className="option-list">{items.map((item) => <div className="consent-row" key={item}><span>{item}</span></div>)}</div>;
}

function fieldPurpose(field: string) {
  const purposes: Record<string, string> = {
    order_id: "Internal or hashed order reference for row tracing",
    pincode: "Delivery geography for leakage concentration",
    payment_mode: "COD vs prepaid leakage comparison",
    order_value: "INR impact and risk sizing",
    courier: "Courier concentration and lane diagnosis",
    shipment_status: "Current delivery/NDR/RTO state",
    ndr_reason: "Failed-delivery reason analysis",
    final_status: "Delivered, RTO, cancelled, or unresolved outcome",
    order_date: "Date-based sample window checks",
    sku: "SKU leakage concentration",
    product_name: "Product-level leakage grouping",
    city: "City-level summary only",
    state: "State-level summary only",
    source_platform: "Store/channel grouping",
    campaign_name: "Campaign leakage grouping",
    attempt_count: "NDR attempt severity"
  };
  return purposes[field] || "Operational audit context";
}

function FieldPills({ fields }: { fields: readonly string[] }) {
  return <div className="toolbar">{fields.map((field) => <span className="badge" key={field}>{field}</span>)}</div>;
}

function MiniTable({ headers, rows }: { headers: string[]; rows: unknown[][] }) {
  return <div className="table-wrap"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{String(cell)}</td>)}</tr>)}</tbody></table></div>;
}

function Result({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={strong ? "result-row strong" : "result-row"}><span>{label}</span><strong>{value}</strong></div>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label><span>{label}</span><input className="input" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="panel metric"><div className="label">{label}</div><div className="value">{value}</div></div>;
}
