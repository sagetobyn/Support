"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  calculateCalculatorOutputs,
  defaultCalculatorInputs,
  sellerCategories,
  shippingPlatforms,
  type CalculatorInputs,
  type SellerCategory,
  type ShippingPlatform
} from "@/lib/calculator";
import { exportLeadsCsv, listCalculatorLeads, saveCalculatorLead, deleteLead, type CalculatorLead } from "@/lib/leadStore";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/reporting";

const numericFields: Array<{ key: keyof CalculatorInputs; label: string; suffix?: string; optional?: boolean }> = [
  { key: "monthlyOrders", label: "Monthly orders" },
  { key: "codPercentage", label: "COD percentage", suffix: "%" },
  { key: "overallRtoPercentage", label: "Overall RTO percentage", suffix: "%" },
  { key: "codRtoPercentage", label: "Optional COD RTO percentage", suffix: "%", optional: true },
  { key: "averageOrderValue", label: "Average order value" },
  { key: "grossMarginPercentage", label: "Gross margin percentage", suffix: "%" },
  { key: "forwardShippingCost", label: "Forward shipping cost" },
  { key: "returnShippingCost", label: "Return shipping cost" },
  { key: "packagingCost", label: "Packaging cost" },
  { key: "estimatedCac", label: "Estimated CAC per order" },
  { key: "codFee", label: "COD fee" },
  { key: "supportOpsCost", label: "Support / ops handling cost per RTO" },
  { key: "pilotSoftwareCost", label: "Pilot / software cost" },
  { key: "targetRtoReductionPercentage", label: "Target RTO reduction percentage", suffix: "%" }
];

function blankLead(inputs: CalculatorInputs): Omit<CalculatorLead, "id" | "createdAt"> {
  return {
    brandName: "",
    contactName: "",
    category: inputs.category,
    monthlyOrders: inputs.monthlyOrders,
    codPercentage: inputs.codPercentage,
    rtoPercentage: inputs.overallRtoPercentage,
    averageOrderValue: inputs.averageOrderValue,
    shippingPlatform: inputs.shippingPlatform,
    contact: "",
    notes: "",
    consent: false
  };
}

function quickEstimate(monthlyOrders: number, codPercentage: number, overallRtoPercentage: number) {
  const defaults = defaultCalculatorInputs;
  const codOrders = Math.round(monthlyOrders * (codPercentage / 100));
  const totalRtoOrders = Math.round(monthlyOrders * (overallRtoPercentage / 100));
  const rtoLossPerOrder = (defaults.forwardShippingCost || 0) + (defaults.returnShippingCost || 0) + (defaults.packagingCost || 0) + (defaults.estimatedCac || 0) + (defaults.codFee || 0) + (defaults.supportOpsCost || 0);
  const monthlyLeakage = totalRtoOrders * rtoLossPerOrder;
  const dailyLeakage = monthlyLeakage / 30;
  const codDrivenRtoOrders = Math.round(totalRtoOrders * 0.85);
  const codDrivenLeakage = codDrivenRtoOrders * rtoLossPerOrder;
  return { codOrders, totalRtoOrders, rtoLossPerOrder, monthlyLeakage, dailyLeakage, codDrivenRtoOrders, codDrivenLeakage };
}

function benchmarkLabel(rtoPercentage: number) {
  if (rtoPercentage <= 12) return { label: "low-risk", tone: "low" as const, message: "Your RTO rate is below the industry benchmark." };
  if (rtoPercentage <= 18) return { label: "moderate", tone: "medium" as const, message: "Your RTO rate is around industry average." };
  return { label: "high-risk", tone: "critical" as const, message: "Your RTO rate is above the industry benchmark of 12-15%." };
}

export default function CalculatorPage() {
  const [inputs, setInputs] = useState<CalculatorInputs>(defaultCalculatorInputs);
  const [lead, setLead] = useState<Omit<CalculatorLead, "id" | "createdAt">>(() => blankLead(defaultCalculatorInputs));
  const [leads, setLeads] = useState<CalculatorLead[]>([]);
  const [message, setMessage] = useState("");
  const [showFullCalculator, setShowFullCalculator] = useState(false);
  const outputs = useMemo(() => calculateCalculatorOutputs(inputs), [inputs]);

  const quick = useMemo(() => quickEstimate(inputs.monthlyOrders || 0, inputs.codPercentage || 0, inputs.overallRtoPercentage || 0), [inputs.monthlyOrders, inputs.codPercentage, inputs.overallRtoPercentage]);
  const benchmark = benchmarkLabel(inputs.overallRtoPercentage || 0);
  const aquisitionsWasted = Math.round(quick.monthlyLeakage / (inputs.estimatedCac || 1));

  useEffect(() => {
    setLeads(listCalculatorLeads(window.localStorage));
  }, []);

  function updateNumber(key: keyof CalculatorInputs, value: string) {
    const parsed = value === "" ? null : Number(value);
    setInputs((current) => ({ ...current, [key]: parsed === null ? null : Number.isFinite(parsed) ? parsed : 0 }));
    if (key === "monthlyOrders" || key === "codPercentage" || key === "overallRtoPercentage" || key === "averageOrderValue") {
      const leadKey = key === "overallRtoPercentage" ? "rtoPercentage" : key;
      setLead((current) => ({ ...current, [leadKey]: Number(value || 0) }));
    }
  }

  function updateCategory(value: SellerCategory) {
    setInputs((current) => ({ ...current, category: value }));
    setLead((current) => ({ ...current, category: value }));
  }

  function updatePlatform(value: ShippingPlatform) {
    setInputs((current) => ({ ...current, shippingPlatform: value }));
    setLead((current) => ({ ...current, shippingPlatform: value }));
  }

  function validateLead() {
    if (!lead.brandName.trim()) return "Brand name is required.";
    if (!lead.contact.trim() && !lead.contactName.trim()) return "Contact name or WhatsApp/email is required.";
    if (!lead.consent) return "Please confirm that no customer data is being uploaded.";
    if (lead.monthlyOrders <= 0) return "Monthly orders must be positive.";
    if (lead.codPercentage < 0 || lead.codPercentage > 100 || lead.rtoPercentage < 0 || lead.rtoPercentage > 100) return "COD and RTO percentages must be between 0 and 100.";
    return "";
  }

  function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateLead();
    if (error) {
      setMessage(error);
      return;
    }
    saveCalculatorLead(lead, window.localStorage);
    setLeads(listCalculatorLeads(window.localStorage));
    setMessage("Thanks. We have saved your summary. Next step: generate a privacy-safe audit estimate.");
  }

  function removeLead(id: string) {
    setLeads(deleteLead(id, window.localStorage));
  }

  const jsonDownload = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(leads, null, 2))}`;
  const csvDownload = `data:text/csv;charset=utf-8,${encodeURIComponent(exportLeadsCsv(leads))}`;

  return (
    <main className="public-page">
      <header className="public-header">
        <Link className="brand-link" href="/">SupportWaala</Link>
        <nav className="public-nav">
          <Link href="/calculator">Free Leakage Check</Link>
          <Link href="/sample-report">Sample Report</Link>
          <Link href="/audit">Profit Audit</Link>
          <Link href="/pilot">Rescue Pilot</Link>
          <Link href="/dashboard">Control Room</Link>
        </nav>
      </header>

      <section className="public-hero">
        <div>
          <p className="eyebrow">Free, privacy-safe, no CSV required</p>
          <h1>Free RTO Leakage Check for Indian D2C Brands</h1>
          <p className="hero-copy">Estimate how much money your brand is losing from COD failed deliveries and what you could save by reducing RTO.</p>
          <p className="hero-copy">Most sellers see RTO after the loss has already happened. RTOShield by SupportWaala starts with the core problem, then shows the audit and rescue workflow that can reduce preventable COD/NDR loss.</p>
          <div className="hero-actions">
            <a className="button" href="#calculator">Estimate my RTO leakage</a>
            <Link className="button secondary" href="/sample-report">View sample audit report</Link>
          </div>
        </div>
        <div className="hero-stat">
          <span>Estimated monthly RTO leakage</span>
          <strong>{formatCurrency(outputs.monthlyRtoLeakage)}</strong>
          <small>{formatCurrency(outputs.rtoLossPerOrder, { perOrder: true })} across {formatNumber(outputs.totalRtoOrders)} estimated RTO orders</small>
        </div>
      </section>

      <section className="calculator-layout" id="calculator">
        <div className="panel">
          <h2>Quick Estimate — 3 fields</h2>
          <p className="muted">Most sellers only need these 3 numbers to see if RTO is worth fixing. Advanced inputs are below.</p>
          <div className="calculator-input-grid">
            <label>
              <span>Monthly orders</span>
              <input className="input" type="number" min="0" value={inputs.monthlyOrders ?? ""} onChange={(event) => updateNumber("monthlyOrders", event.target.value)} />
            </label>
            <label>
              <span>COD percentage</span>
              <input className="input" type="number" min="0" max="100" value={inputs.codPercentage ?? ""} onChange={(event) => updateNumber("codPercentage", event.target.value)} />
              <small>%</small>
            </label>
            <label>
              <span>Overall RTO percentage</span>
              <input className="input" type="number" min="0" max="100" value={inputs.overallRtoPercentage ?? ""} onChange={(event) => updateNumber("overallRtoPercentage", event.target.value)} />
              <small>%</small>
            </label>
          </div>
          <button className="button secondary" onClick={() => setShowFullCalculator((v) => !v)}>{showFullCalculator ? "Hide advanced inputs" : "Show advanced inputs"}</button>

          {showFullCalculator && (
            <div style={{ marginTop: 18 }}>
              <h3>Advanced Inputs</h3>
              <div className="calculator-input-grid">
                {numericFields.filter((item) => !["monthlyOrders", "codPercentage", "overallRtoPercentage"].includes(item.key)).map((item) => (
                  <label key={item.key}>
                    <span>{item.label}</span>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max={item.suffix === "%" ? 100 : undefined}
                      value={inputs[item.key] === null || inputs[item.key] === undefined ? "" : String(inputs[item.key])}
                      placeholder={item.optional ? "Optional" : undefined}
                      onChange={(event) => updateNumber(item.key, event.target.value)}
                    />
                    {item.suffix && <small>{item.suffix}</small>}
                  </label>
                ))}
                <label>
                  <span>Category</span>
                  <select className="select" value={inputs.category} onChange={(event) => updateCategory(event.target.value as SellerCategory)}>
                    {sellerCategories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span>Main shipping platform</span>
                  <select className="select" value={inputs.shippingPlatform} onChange={(event) => updatePlatform(event.target.value as ShippingPlatform)}>
                    {shippingPlatforms.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="panel output-panel">
          <h2>Your Leakage Estimate</h2>
          <div className="hero-stat" style={{ marginBottom: 14 }}>
            <span>Estimated monthly RTO leakage</span>
            <strong>{formatCurrency(quick.monthlyLeakage)}</strong>
            <small>{formatCurrency(quick.dailyLeakage)} burning per day · {quick.totalRtoOrders} estimated RTO orders</small>
          </div>

          <div className={`notice ${benchmark.tone === "critical" ? "critical" : ""}`} style={{ marginBottom: 14 }}>
            <strong>{benchmark.message}</strong> For fashion D2C brands your size, the industry benchmark is 12-15% RTO. You are in the <strong>{benchmark.label}</strong> zone.
          </div>

          <div className="result-list">
            <Result label="COD orders per month" value={formatNumber(quick.codOrders)} />
            <Result label="Estimated total RTO orders" value={formatNumber(quick.totalRtoOrders)} />
            <Result label="RTO loss per order" value={formatCurrency(quick.rtoLossPerOrder, { perOrder: true })} />
            <Result label="Estimated monthly RTO leakage" value={formatCurrency(quick.monthlyLeakage)} strong />
            <Result label="Daily RTO leakage" value={formatCurrency(quick.dailyLeakage)} />
          </div>

          <div className="recommendation-strip" style={{ marginTop: 14 }}>
            <strong>What this money could buy</strong>
            <span>That is roughly <strong>{aquisitionsWasted}</strong> customer acquisitions wasted per month. Or <strong>{formatCurrency(quick.monthlyLeakage)}</strong> you could reinvest into growth instead of return shipping.</span>
          </div>

          {showFullCalculator && (
            <>
              <h3 style={{ marginTop: 18 }}>Detailed Results</h3>
              <div className="result-list">
                <Result label="Prepaid orders per month" value={formatNumber(outputs.prepaidOrders)} />
                <Result label="Estimated COD RTO orders" value={outputs.codRtoOrders === null ? "Not provided" : formatNumber(outputs.codRtoOrders)} />
                <Result label="Inferred prepaid RTO percentage" value={formatPercent(outputs.prepaidRtoPercentage)} />
                <Result label="Contribution margin per delivered order" value={formatCurrency(outputs.contributionMargin)} />
                <Result label="COD-driven RTO leakage" value={outputs.codDrivenRtoLeakage === null ? "Not provided" : formatCurrency(outputs.codDrivenRtoLeakage)} />
                <Result label="Loss per 100 orders" value={formatCurrency(outputs.lossPer100Orders)} />
              </div>
              <div className="savings-grid">
                <Savings label="10% reduction" value={outputs.saving10} />
                <Savings label="20% reduction" value={outputs.saving20} />
                <Savings label="30% reduction" value={outputs.saving30} />
              </div>
              <div className="roi-strip">
                <Result label="Target saving" value={formatCurrency(outputs.targetSaving)} />
                <Result label="Net benefit after pilot fee" value={formatCurrency(outputs.netBenefit)} />
                <Result label="ROI multiple" value={outputs.roiMultiple === null ? "Not applicable" : `${outputs.roiMultiple.toFixed(1)}x`} />
                <Result label="Payback status" value={outputs.paybackStatus} />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="public-section-grid">
        <InfoBlock title="Key Insight">
          <p>Based on your inputs, your brand may be losing approximately <strong>{formatCurrency(outputs.monthlyRtoLeakage)}</strong> per month from failed deliveries. A 20% reduction could save around <strong>{formatCurrency(outputs.saving20)}</strong> per month.</p>
          <p>The highest-leverage starting point is usually COD risk control, address correction, and NDR rescue.</p>
        </InfoBlock>
        <InfoBlock title="Savings Opportunity">
          <p>After a {formatCurrency(inputs.pilotSoftwareCost)} pilot/software cost, your target reduction shows <strong>{formatCurrency(outputs.netBenefit)}</strong> estimated net benefit. This is directional, not guaranteed.</p>
          <p className="muted">Expected profit can later be modeled as success probability times contribution margin minus RTO risk, intervention cost, and incentive cost. For this MVP, it remains a transparent heuristic.</p>
        </InfoBlock>
        <InfoBlock title="Why This Matters">
          <p>Sellers often count only shipping cost. Real RTO loss includes forward shipping, return freight, packaging, CAC, COD fee, support time, and blocked inventory.</p>
          <p>RTO is not only a logistics metric; it is profit leakage.</p>
        </InfoBlock>
        <InfoBlock title="What To Do Next">
          <ol>
            <li>Calculate rough leakage.</li>
            <li>Share only summary numbers.</li>
            <li>Get a privacy-safe audit.</li>
            <li>If useful, upload anonymized CSV.</li>
            <li>Run a 14-day pilot.</li>
          </ol>
        </InfoBlock>
      </section>

      <section className="lead-layout" id="lead">
        <form className="panel" onSubmit={submitLead}>
          <h2>Lead Capture</h2>
          <p className="muted">You do not need to upload customer names, phones, emails, or full addresses for the first audit. Summary numbers are enough to estimate leakage. Anonymized CSV can improve accuracy.</p>
          <div className="lead-grid">
            <LeadInput label="Brand name" value={lead.brandName} onChange={(value) => setLead((current) => ({ ...current, brandName: value }))} />
            <LeadInput label="Founder / contact name" value={lead.contactName} onChange={(value) => setLead((current) => ({ ...current, contactName: value }))} />
            <label>
              <span>Category</span>
              <select className="select" value={lead.category} onChange={(event) => setLead((current) => ({ ...current, category: event.target.value as SellerCategory }))}>{sellerCategories.map((item) => <option key={item}>{item}</option>)}</select>
            </label>
            <LeadInput label="Monthly orders" type="number" value={lead.monthlyOrders} onChange={(value) => setLead((current) => ({ ...current, monthlyOrders: Number(value || 0) }))} />
            <LeadInput label="COD percentage" type="number" value={lead.codPercentage} onChange={(value) => setLead((current) => ({ ...current, codPercentage: Number(value || 0) }))} />
            <LeadInput label="RTO percentage" type="number" value={lead.rtoPercentage} onChange={(value) => setLead((current) => ({ ...current, rtoPercentage: Number(value || 0) }))} />
            <LeadInput label="Average order value" type="number" value={lead.averageOrderValue} onChange={(value) => setLead((current) => ({ ...current, averageOrderValue: Number(value || 0) }))} />
            <label>
              <span>Main shipping platform</span>
              <select className="select" value={lead.shippingPlatform} onChange={(event) => setLead((current) => ({ ...current, shippingPlatform: event.target.value as ShippingPlatform }))}>{shippingPlatforms.map((item) => <option key={item}>{item}</option>)}</select>
            </label>
            <LeadInput label="WhatsApp number or email" value={lead.contact} onChange={(value) => setLead((current) => ({ ...current, contact: value }))} />
          </div>
          <label>
            <span className="muted">Notes</span>
            <textarea className="textarea" value={lead.notes} onChange={(event) => setLead((current) => ({ ...current, notes: event.target.value }))} />
          </label>
          <label className="consent-row">
            <input type="checkbox" checked={lead.consent} onChange={(event) => setLead((current) => ({ ...current, consent: event.target.checked }))} />
            <span>I understand this is an estimate and I am not uploading customer data.</span>
          </label>
          <button className="button" type="submit">Start privacy-safe audit</button>
          {message && <p className={message.startsWith("Thanks") ? "success" : "notice"}>{message}</p>}
          {message.startsWith("Thanks") && (
            <div className="hero-actions">
              <Link className="button secondary" href="/sample-report">View sample audit report</Link>
              <Link className="button" href="/audit">Start audit flow</Link>
            </div>
          )}
        </form>

        <div className="panel">
          <h2>Admin / Debug Leads</h2>
          <p className="muted">For MVP only: leads are stored in this browser localStorage. No external API is called.</p>
          <div className="toolbar">
            <a className="button secondary" href={jsonDownload} download="calculator-leads.json">Export JSON</a>
            <a className="button secondary" href={csvDownload} download="calculator-leads.csv">Export CSV</a>
          </div>
          <div className="lead-list">
            {leads.length ? leads.map((item) => (
              <div className="action-row" key={item.id}>
                <div className="split"><strong>{item.brandName}</strong><button className="button secondary" type="button" onClick={() => removeLead(item.id)}>Delete</button></div>
                <div className="muted">{item.contactName || item.contact} · {item.category} · {item.shippingPlatform}</div>
                <div>{formatNumber(item.monthlyOrders)} orders · COD {item.codPercentage}% · RTO {item.rtoPercentage}% · AOV {formatCurrency(item.averageOrderValue)}</div>
              </div>
            )) : <p className="empty">No local leads saved yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

function Result({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "result-row strong" : "result-row"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Savings({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{formatCurrency(value)}</strong>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="panel info-block"><h2>{title}</h2>{children}</div>;
}

function LeadInput({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <label>
      <span>{label}</span>
      <input className="input" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
