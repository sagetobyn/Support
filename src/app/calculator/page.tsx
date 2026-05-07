"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import {
  calculateCalculatorOutputs,
  defaultCalculatorInputs,
  sellerCategories,
  shippingPlatforms,
  type CalculatorInputs,
  type SellerCategory,
  type ShippingPlatform
} from "@/lib/calculator";
import { saveCalculatorLead, type CalculatorLead } from "@/lib/leadStore";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/reporting";

const advancedFields: Array<{ key: keyof CalculatorInputs; label: string; suffix?: string; optional?: boolean }> = [
  { key: "averageOrderValue", label: "Average order value (₹)" },
  { key: "grossMarginPercentage", label: "Gross margin (%)", suffix: "%" },
  { key: "forwardShippingCost", label: "Forward shipping cost (₹)" },
  { key: "returnShippingCost", label: "Return shipping cost (₹)" },
  { key: "packagingCost", label: "Packaging cost (₹)" },
  { key: "estimatedCac", label: "Customer acquisition cost / order (₹)" },
  { key: "codFee", label: "Cash-on-delivery fee (₹)" },
  { key: "supportOpsCost", label: "Support cost per return (₹)" },
  { key: "pilotSoftwareCost", label: "Software / pilot cost (₹)" },
  { key: "targetRtoReductionPercentage", label: "Target return reduction (%)", suffix: "%" },
  { key: "codRtoPercentage", label: "Cash-order return rate (%)", suffix: "%", optional: true }
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
  const rtoLossPerOrder =
    (defaults.forwardShippingCost || 0) +
    (defaults.returnShippingCost || 0) +
    (defaults.packagingCost || 0) +
    (defaults.estimatedCac || 0) +
    (defaults.codFee || 0) +
    (defaults.supportOpsCost || 0);
  const monthlyLeakage = totalRtoOrders * rtoLossPerOrder;
  const dailyLeakage = monthlyLeakage / 30;
  const codDrivenRtoOrders = Math.round(totalRtoOrders * 0.85);
  const codDrivenLeakage = codDrivenRtoOrders * rtoLossPerOrder;
  return { codOrders, totalRtoOrders, rtoLossPerOrder, monthlyLeakage, dailyLeakage, codDrivenRtoOrders, codDrivenLeakage };
}

function benchmarkLabel(rtoPercentage: number) {
  if (rtoPercentage <= 12) return { label: "low-risk", tone: "low" as const, message: "Your return rate is below the typical Indian D2C benchmark. Solid." };
  if (rtoPercentage <= 18) return { label: "average", tone: "medium" as const, message: "Your return rate is around the industry average. Room to improve." };
  return { label: "high-risk", tone: "critical" as const, message: "Your return rate is above the 12–15% benchmark for Indian fashion D2C. Money is leaking." };
}

export default function CalculatorPage() {
  const [inputs, setInputs] = useState<CalculatorInputs>(defaultCalculatorInputs);
  const [lead, setLead] = useState<Omit<CalculatorLead, "id" | "createdAt">>(() => blankLead(defaultCalculatorInputs));
  const [message, setMessage] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const outputs = useMemo(() => calculateCalculatorOutputs(inputs), [inputs]);

  const quick = useMemo(
    () => quickEstimate(inputs.monthlyOrders || 0, inputs.codPercentage || 0, inputs.overallRtoPercentage || 0),
    [inputs.monthlyOrders, inputs.codPercentage, inputs.overallRtoPercentage]
  );
  const benchmark = benchmarkLabel(inputs.overallRtoPercentage || 0);
  const acquisitionsWasted = Math.round(quick.monthlyLeakage / (inputs.estimatedCac || 1));

  useEffect(() => {
    setLead((current) => ({
      ...current,
      monthlyOrders: inputs.monthlyOrders || 0,
      codPercentage: inputs.codPercentage || 0,
      rtoPercentage: inputs.overallRtoPercentage || 0,
      averageOrderValue: inputs.averageOrderValue || 0,
      category: inputs.category,
      shippingPlatform: inputs.shippingPlatform
    }));
  }, [inputs.monthlyOrders, inputs.codPercentage, inputs.overallRtoPercentage, inputs.averageOrderValue, inputs.category, inputs.shippingPlatform]);

  function updateNumber(key: keyof CalculatorInputs, value: string) {
    const parsed = value === "" ? null : Number(value);
    setInputs((current) => ({ ...current, [key]: parsed === null ? null : Number.isFinite(parsed) ? parsed : 0 }));
  }

  function updateCategory(value: SellerCategory) {
    setInputs((current) => ({ ...current, category: value }));
  }

  function updatePlatform(value: ShippingPlatform) {
    setInputs((current) => ({ ...current, shippingPlatform: value }));
  }

  function validateLead() {
    if (!lead.brandName.trim()) return "Brand name is required.";
    if (!lead.contact.trim() && !lead.contactName.trim()) return "Add a contact name or WhatsApp/email.";
    if (!lead.consent) return "Please confirm you're not uploading customer data.";
    if (lead.monthlyOrders <= 0) return "Monthly orders must be more than zero.";
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
    setMessage("Thanks. We've saved your summary. Next step: get the privacy-safe written audit.");
  }

  return (
    <MarketingPage tone="dark">
      <section className="calc-hero">
        <div className="calc-hero__content">
          <span className="eyebrow">Free · No customer data needed</span>
          <h1>How much money are returns and failed deliveries costing you?</h1>
          <p>Type in three numbers from your store. We'll show you the loss, the benchmark, and what a 20% reduction looks like.</p>
          <div className="saas-actions">
            <a className="button" href="#calculator">Calculate my loss</a>
            <Link className="button secondary" href="/sample-report">See a sample report</Link>
          </div>
        </div>
        <aside className="calc-hero__stat">
          <span>Estimated monthly loss</span>
          <strong>{formatCurrency(outputs.monthlyRtoLeakage)}</strong>
          <small>{formatCurrency(outputs.rtoLossPerOrder, { perOrder: true })} across {formatNumber(outputs.totalRtoOrders)} estimated returned orders</small>
        </aside>
      </section>

      <section className="calc-shell" id="calculator">
        <div className="calc-card calc-card--input">
          <header className="calc-card__head">
            <h2>Quick estimate</h2>
            <p>Three numbers. Two minutes. No login.</p>
          </header>

          <div className="calc-grid">
            <label className="calc-field">
              <span>Monthly orders</span>
              <input
                type="number"
                min="0"
                value={inputs.monthlyOrders ?? ""}
                onChange={(event) => updateNumber("monthlyOrders", event.target.value)}
              />
              <em>How many orders ship from your store each month.</em>
            </label>
            <label className="calc-field">
              <span>Cash-on-delivery share (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={inputs.codPercentage ?? ""}
                onChange={(event) => updateNumber("codPercentage", event.target.value)}
              />
              <em>Out of 100 orders, how many are paid on delivery.</em>
            </label>
            <label className="calc-field">
              <span>Return rate (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={inputs.overallRtoPercentage ?? ""}
                onChange={(event) => updateNumber("overallRtoPercentage", event.target.value)}
              />
              <em>Share of orders that ship out and come back undelivered.</em>
            </label>
          </div>

          <button className="calc-toggle" type="button" onClick={() => setShowAdvanced((value) => !value)}>
            {showAdvanced ? "Hide advanced inputs" : "Show advanced inputs"}
          </button>

          {showAdvanced && (
            <div className="calc-advanced">
              <div className="calc-grid">
                {advancedFields.map((field) => (
                  <label className="calc-field" key={field.key}>
                    <span>{field.label}</span>
                    <input
                      type="number"
                      min="0"
                      max={field.suffix === "%" ? 100 : undefined}
                      placeholder={field.optional ? "Optional" : undefined}
                      value={inputs[field.key] === null || inputs[field.key] === undefined ? "" : String(inputs[field.key])}
                      onChange={(event) => updateNumber(field.key, event.target.value)}
                    />
                  </label>
                ))}
                <label className="calc-field">
                  <span>Category</span>
                  <select value={inputs.category} onChange={(event) => updateCategory(event.target.value as SellerCategory)}>
                    {sellerCategories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="calc-field">
                  <span>Shipping platform</span>
                  <select value={inputs.shippingPlatform} onChange={(event) => updatePlatform(event.target.value as ShippingPlatform)}>
                    {shippingPlatforms.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="calc-card calc-card--output">
          <header className="calc-card__head">
            <h2>Your leakage estimate</h2>
            <p>Updates as you type.</p>
          </header>

          <div className="calc-headline">
            <span>Estimated monthly loss</span>
            <strong>{formatCurrency(quick.monthlyLeakage)}</strong>
            <small>{formatCurrency(quick.dailyLeakage)} every day · {quick.totalRtoOrders} returned orders / month</small>
          </div>

          <div className={`calc-benchmark calc-benchmark--${benchmark.tone}`}>
            <strong>{benchmark.message}</strong>
            <span>Benchmark for fashion D2C your size: 12–15% return rate. You are in the <b>{benchmark.label}</b> zone.</span>
          </div>

          <ul className="calc-results">
            <Result label="Cash orders / month" value={formatNumber(quick.codOrders)} />
            <Result label="Returned orders / month" value={formatNumber(quick.totalRtoOrders)} />
            <Result label="Loss per returned order" value={formatCurrency(quick.rtoLossPerOrder, { perOrder: true })} />
            <Result label="Daily loss" value={formatCurrency(quick.dailyLeakage)} />
          </ul>

          <div className="calc-insight">
            <strong>What this money could buy</strong>
            <span>That's roughly <b>{acquisitionsWasted}</b> wasted customer acquisitions every month — money you could redirect to growth.</span>
          </div>

          {showAdvanced && (
            <>
              <h3 className="calc-subhead">If you reduce returns by…</h3>
              <div className="calc-savings">
                <Savings label="10%" value={outputs.saving10} />
                <Savings label="20%" value={outputs.saving20} />
                <Savings label="30%" value={outputs.saving30} />
              </div>
              <ul className="calc-results">
                <Result label="Profit margin per delivered order" value={formatCurrency(outputs.contributionMargin)} />
                <Result label="Loss for every 100 orders" value={formatCurrency(outputs.lossPer100Orders)} />
                <Result label="Inferred prepaid return rate" value={formatPercent(outputs.prepaidRtoPercentage)} />
                <Result label="Net benefit after software cost" value={formatCurrency(outputs.netBenefit)} />
                <Result label="ROI multiple" value={outputs.roiMultiple === null ? "—" : `${outputs.roiMultiple.toFixed(1)}x`} />
                <Result label="Payback status" value={outputs.paybackStatus} />
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="calc-explainer">
        <ExplainerBlock title="Key insight" tone="green">
          <p>Based on what you typed, you're losing about <strong>{formatCurrency(outputs.monthlyRtoLeakage)}</strong> a month to failed deliveries.</p>
          <p>A 20% reduction would save you around <strong>{formatCurrency(outputs.saving20)}</strong> every month.</p>
        </ExplainerBlock>
        <ExplainerBlock title="What we count" tone="gold">
          <p>Most sellers count only the courier bill. Real loss includes forward shipping, return shipping, packaging, the cost of acquiring the customer, the cash-on-delivery fee, and your team's time.</p>
        </ExplainerBlock>
        <ExplainerBlock title="Why it matters" tone="copper">
          <p>Returns are not a logistics problem. They're profit leaving the building.</p>
          <p>Find the leak, plug the biggest holes, and reinvest the savings.</p>
        </ExplainerBlock>
        <ExplainerBlock title="What to do next" tone="violet">
          <ol>
            <li>Run this free check.</li>
            <li>Share only summary numbers — no customer data.</li>
            <li>Get a written audit.</li>
            <li>Optionally upload anonymized data.</li>
            <li>Run a 14-day pilot.</li>
          </ol>
        </ExplainerBlock>
      </section>

      <section className="calc-lead" id="lead">
        <form className="calc-lead__form" onSubmit={submitLead}>
          <header>
            <span className="eyebrow">Want a written audit?</span>
            <h2>Get a privacy-safe profit audit</h2>
            <p>You don't need to upload customer names, phones, or addresses. Summary numbers are enough.</p>
          </header>

          <div className="calc-grid">
            <LeadInput label="Brand name" value={lead.brandName} onChange={(value) => setLead((current) => ({ ...current, brandName: value }))} />
            <LeadInput label="Your name" value={lead.contactName} onChange={(value) => setLead((current) => ({ ...current, contactName: value }))} />
            <label className="calc-field">
              <span>Category</span>
              <select value={lead.category} onChange={(event) => setLead((current) => ({ ...current, category: event.target.value as SellerCategory }))}>
                {sellerCategories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="calc-field">
              <span>Shipping platform</span>
              <select value={lead.shippingPlatform} onChange={(event) => setLead((current) => ({ ...current, shippingPlatform: event.target.value as ShippingPlatform }))}>
                {shippingPlatforms.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <LeadInput label="WhatsApp or email" value={lead.contact} onChange={(value) => setLead((current) => ({ ...current, contact: value }))} />
          </div>

          <label className="calc-field calc-field--full">
            <span>Anything else we should know?</span>
            <textarea value={lead.notes} onChange={(event) => setLead((current) => ({ ...current, notes: event.target.value }))} rows={3} />
          </label>

          <label className="calc-consent">
            <input type="checkbox" checked={lead.consent} onChange={(event) => setLead((current) => ({ ...current, consent: event.target.checked }))} />
            <span>I understand this is an estimate and I'm not uploading any customer data.</span>
          </label>

          <button className="button" type="submit">Start my audit</button>
          {message && (
            <p className={message.startsWith("Thanks") ? "calc-success" : "calc-error"}>{message}</p>
          )}
          {message.startsWith("Thanks") && (
            <div className="saas-actions">
              <Link className="button secondary" href="/sample-report">View sample report</Link>
              <Link className="button" href="/audit">Open audit flow</Link>
            </div>
          )}
        </form>
      </section>
    </MarketingPage>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <li className="calc-result-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </li>
  );
}

function Savings({ label, value }: { label: string; value: number }) {
  return (
    <div className="calc-savings__cell">
      <span>{label} reduction</span>
      <strong>{formatCurrency(value)}</strong>
    </div>
  );
}

function ExplainerBlock({ title, tone, children }: { title: string; tone: "green" | "gold" | "copper" | "violet"; children: React.ReactNode }) {
  return (
    <article className={`calc-explainer__card calc-explainer__card--${tone}`}>
      <h3>{title}</h3>
      {children}
    </article>
  );
}

function LeadInput({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="calc-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
