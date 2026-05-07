"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import { defaultCalculatorInputs, sellerCategories, shippingPlatforms, type SellerCategory, type ShippingPlatform } from "@/lib/calculator";
import {
  exportAuditSessionsCsv,
  generateActionPreview,
  generateCsvAudit,
  generateSummaryAudit,
  parseAnonymizedAuditCsv,
  type AuditSession,
  type CsvAuditParseResult,
  type SummaryAuditInputs
} from "@/lib/audit";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/reporting";

const auditStorageKey = "rtoshield:audit-sessions";

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
      setSessions(JSON.parse(localStorage.getItem(auditStorageKey) || "[]") as AuditSession[]);
    } catch {
      setSessions([]);
    }
  }, []);

  function saveSession(session: AuditSession) {
    const next = [session, ...sessions];
    setSessions(next);
    setActiveSession(session);
    localStorage.setItem(auditStorageKey, JSON.stringify(next));
    setMessage("Audit estimate saved locally. No external API was called.");
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
    const parsed = parseAnonymizedAuditCsv(csv, summary.forwardShippingCost + summary.returnShippingCost + summary.packagingCost + summary.estimatedCac + summary.codFee + summary.supportOpsCost);
    setCsvFileName(file.name);
    setParseResult(parsed);
    setMessage(`${file.name} parsed: ${parsed.rows.length} valid rows, ${parsed.invalidRows.length} invalid rows.`);
  }

  function generateCsvSession() {
    if (!parseResult?.rows.length) {
      setMessage("Upload an anonymized CSV with valid rows first.");
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
      rtoLossPerOrder: summary.forwardShippingCost + summary.returnShippingCost + summary.packagingCost + summary.estimatedCac + summary.codFee + summary.supportOpsCost
    }));
  }

  const exportJson = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sessions, null, 2))}`;
  const exportCsv = `data:text/csv;charset=utf-8,${encodeURIComponent(exportAuditSessionsCsv(sessions))}`;
  const actionPreview = useMemo(() => activeSession ? generateActionPreview(activeSession.recommendations) : [], [activeSession]);

  return (
    <MarketingPage>
      <section className="report-hero">
        <p className="eyebrow">Profit Audit</p>
        <h1>Find exactly where money is leaking — before you commit to a pilot.</h1>
        <p className="hero-copy">Start with summary numbers. If the estimate is useful, upload an anonymized CSV — no customer names, phones, emails, or full addresses required.</p>
        <p className="muted">We use customer-level data only to operate the rescue, never for marketing.</p>
      </section>

      <section className="mode-tabs">
        <button className={mode === "summary" ? "button" : "button secondary"} onClick={() => setMode("summary")}>Summary audit</button>
        <button className={mode === "csv" ? "button" : "button secondary"} onClick={() => setMode("csv")}>Upload anonymized CSV</button>
        <button className={mode === "pilot" ? "button" : "button secondary"} onClick={() => setMode("pilot")}>Plan a 14-day pilot</button>
      </section>

      {message && <section className="calculator-layout single"><div className={message.includes("saved") || message.includes("parsed") ? "success" : "notice"}>{message}</div></section>}

      {mode === "summary" && (
        <section className="calculator-layout">
          <form className="panel" onSubmit={submitSummary}>
            <h2>Mode 1: Summary-Only Audit</h2>
            <p className="muted">No customer data. Use only operating numbers and known problem clusters.</p>
            <SummaryForm summary={summary} setSummary={setSummary} />
            <button className="button" type="submit">Generate audit estimate</button>
          </form>
          <AuditResult session={activeSession} actionPreview={actionPreview} />
        </section>
      )}

      {mode === "csv" && (
        <section className="calculator-layout">
          <div className="panel">
            <h2>Mode 2: Anonymized CSV Audit</h2>
            <p className="muted">Required fields: order_id, pincode, payment_mode, order_value, courier, shipment_status, ndr_reason, final_status.</p>
            <p className="notice">No customer name, phone, email, or full address is required for this audit.</p>
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
                </div>
                <h3>Preview</h3>
                <MiniTable rows={parseResult.previewRows.map((row) => [row.order_id, row.pincode, row.payment_mode, row.order_value, row.courier, row.final_status])} headers={["Order", "Pincode", "Payment", "Value", "Courier", "Final"]} />
                <h3>Invalid rows</h3>
                {parseResult.invalidRows.length ? <MiniTable rows={parseResult.invalidRows.slice(0, 8).map((row) => [row.row, row.issues.join("; ")])} headers={["Row", "Issues"]} /> : <p className="muted">No invalid rows detected.</p>}
                <button className="button" onClick={generateCsvSession}>Generate CSV audit report</button>
              </>
            )}
          </div>
          <AuditResult session={activeSession} actionPreview={actionPreview} />
        </section>
      )}

      {mode === "pilot" && (
        <section className="calculator-layout">
          <div className="panel">
            <h2>Mode 3: Full Pilot Preparation</h2>
            <p className="muted">No external APIs yet. This simply defines what the seller can provide and the workflow to start a 14-day pilot.</p>
            <Checklist items={[
              "Last 30 days order CSV",
              "Daily order CSV",
              "Daily NDR CSV",
              "Shipping platform access",
              "WhatsApp/manual contact process",
              "Brand cost assumptions",
              "Ops contact person"
            ]} />
          </div>
          <div className="panel">
            <h2>Pilot Readiness Checklist</h2>
            <Checklist items={[
              "Confirm brand cost assumptions",
              "Upload baseline order/shipment CSV",
              "Review audit report",
              "Define action rules",
              "Start 14-day pilot",
              "Track daily actions",
              "Produce weekly savings report"
            ]} />
            <Link className="button" href="/pilot">Create 14-day pilot plan</Link>
          </div>
        </section>
      )}

      <section className="lead-layout">
        <div className="panel">
          <h2>Your saved audits</h2>
          <p className="muted">Saved on this browser only. Nothing is sent to our servers until you choose to share it.</p>
          <div className="toolbar">
            <a className="button secondary" href={exportJson} download="audit-sessions.json">Download as JSON</a>
            <a className="button secondary" href={exportCsv} download="audit-sessions.csv">Download as CSV</a>
          </div>
          <div className="lead-list">
            {sessions.length ? sessions.map((session) => (
              <button className="action-row text-left" key={session.id} onClick={() => setActiveSession(session)}>
                <strong>{session.brand_name}</strong>
                <div className="muted">{session.mode} · {session.status} · {new Date(session.created_at).toLocaleString()}</div>
                <div>{formatCurrency(session.calculated_metrics.monthlyLeakage)} loss · {formatCurrency(session.calculated_metrics.savings20)} saved at 20%</div>
              </button>
            )) : <p className="empty">No saved audits yet — run one above.</p>}
          </div>
        </div>
        <div className="panel">
          <h2>What's next?</h2>
          <p>Use this audit to decide if a deeper review (anonymized CSV) or a 14-day pilot is worth your time.</p>
          <div className="hero-actions">
            <Link className="button secondary" href="/sample-report">View sample report</Link>
            <Link className="button" href="/pilot">Plan a 14-day pilot</Link>
          </div>
        </div>
      </section>
    </MarketingPage>
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

function topLeakageStory(session: AuditSession) {
  const metrics = session.calculated_metrics;
  const drivers = [
    { label: "Pincode", rows: metrics.pincodeLeakage },
    { label: "Courier", rows: metrics.courierLeakage },
    { label: "SKU", rows: metrics.skuLeakage },
    { label: "NDR reason", rows: metrics.ndrReasonLeakage }
  ].filter((d) => d.rows && d.rows.length > 0) as Array<{ label: string; rows: Array<{ label: string; total: number; rto: number; loss: number; rate: number }> }>;

  const topDriver = drivers.sort((a, b) => (b.rows[0]?.loss || 0) - (a.rows[0]?.loss || 0))[0];
  const topRow = topDriver?.rows[0];

  return {
    headline: topRow
      ? `Your biggest leakage driver is ${topDriver.label.toLowerCase()} ${topRow.label} — ${formatPercent(topRow.rate * 100)} RTO rate, ${formatCurrency(topRow.loss)} estimated loss.`
      : `Your estimated monthly RTO leakage is ${formatCurrency(metrics.monthlyLeakage)}. Upload an anonymized CSV to identify the top driver.`
    ,
    recommendation: topRow
      ? `Recommended: verify COD orders to this ${topDriver.label.toLowerCase()} or switch to a better-performing courier lane.`
      : "Upload anonymized order data to get precise pincode, courier, and SKU recommendations.",
    drivers: drivers.map((d) => ({
      label: d.label,
      top: d.rows[0],
      totalLoss: d.rows.reduce((sum, r) => sum + r.loss, 0)
    })),
    annualProjection: metrics.monthlyLeakage * 12
  };
}

function AuditResult({ session, actionPreview }: { session: AuditSession | null; actionPreview: ReturnType<typeof generateActionPreview> }) {
  if (!session) {
    return <div className="panel"><h2>Audit Output</h2><p className="muted">Generate an audit estimate to see leakage, drivers, savings, and recommendations.</p></div>;
  }
  const metrics = session.calculated_metrics;
  const story = topLeakageStory(session);

  return (
    <div className="panel output-panel">
      <h2>Your RTO Profit Audit</h2>

      <div className="recommendation-strip" style={{ marginBottom: 14 }}>
        <strong>{story.headline}</strong>
        <span>{story.recommendation}</span>
      </div>

      <div className="result-list">
        <Result label="Estimated monthly leakage" value={formatCurrency(metrics.monthlyLeakage)} strong />
        <Result label="If nothing changes this year" value={formatCurrency(story.annualProjection)} />
        <Result label="Estimated COD leakage" value={metrics.codLeakage === null ? "Not available" : formatCurrency(metrics.codLeakage)} />
        <Result label="Estimated RTO orders" value={formatNumber(metrics.totalRtoOrders)} />
        <Result label="Estimated loss per RTO" value={formatCurrency(metrics.rtoLossPerOrder)} />
        <Result label="Savings at 10 / 20 / 30%" value={`${formatCurrency(metrics.savings10)} / ${formatCurrency(metrics.savings20)} / ${formatCurrency(metrics.savings30)}`} />
      </div>

      <h3>Top Leakage Drivers</h3>
      {story.drivers.length ? story.drivers.map((driver, index) => (
        <div className="action-row" key={driver.label} style={{ borderLeft: index === 0 ? "4px solid var(--red)" : "4px solid var(--amber)" }}>
          <div className="split">
            <strong>#{index + 1} {driver.label}: {driver.top?.label}</strong>
            <span className="badge" style={{ background: index === 0 ? "#ffe4e0" : "#fff4d6", color: index === 0 ? "var(--red)" : "var(--amber)" }}>{formatCurrency(driver.totalLoss)} loss</span>
          </div>
          <div className="muted">{driver.top?.total} orders · {driver.top?.rto} RTO · {formatPercent((driver.top?.rate || 0) * 100)} RTO rate</div>
          <div className="muted">{driver.top?.total ? `This ${driver.label.toLowerCase()} alone accounts for ${formatCurrency(driver.top?.loss || 0)} in estimated leakage.` : ""}</div>
        </div>
      )) : <p className="muted">Upload an anonymized CSV to unlock pincode, courier, SKU, and NDR driver analysis.</p>}

      <h3>First Recommended Actions</h3>
      {session.recommendations.map((item) => <div className="action-row" key={item.title}><strong>{item.title}</strong><p>{item.action}</p><p className="muted">{item.body}</p></div>)}
      <h3>Action Queue Preview</h3>
      {actionPreview.map((item) => <div className="action-row" key={item.id}><strong>{item.group}</strong><p>{item.action}</p></div>)}

      <div className="report-cta" style={{ marginTop: 18, borderRadius: 8 }}>
        <div>
          <h3>Ready to fix this?</h3>
          <p>Based on this audit, here is your personalized 14-day pilot plan.</p>
        </div>
        <Link className="button" href="/pilot" style={{ textDecoration: "none" }}>Start 14-day pilot</Link>
      </div>
    </div>
  );
}

function Grouped({ title, rows }: { title: string; rows: Array<{ label: string; total: number; rto: number; loss: number; rate: number }> }) {
  return (
    <>
      <h3>{title}</h3>
      {rows.map((row) => <div className="action-row" key={row.label}><strong>{row.label}</strong><div className="muted">{row.total} orders · {row.rto} RTO · {formatPercent(row.rate * 100)} · {formatCurrency(row.loss)} loss</div></div>)}
    </>
  );
}

function Checklist({ items }: { items: string[] }) {
  return <div className="option-list">{items.map((item) => <label className="consent-row" key={item}><input type="checkbox" /> <span>{item}</span></label>)}</div>;
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
