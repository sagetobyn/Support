"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AuditSession } from "@/lib/audit";
import {
  calculatePilotProgress,
  createPilotFromAudit,
  generatePilotFinalReview,
  pilotActionRules,
  type PilotDayMetrics,
  type PilotPlan
} from "@/lib/pilot";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/reporting";

const pilotStorageKey = "rtoshield:pilot-plan";
const auditStorageKey = "rtoshield:audit-sessions";

function getCurrentPilotDay(plan: PilotPlan) {
  const completedDays = plan.days.filter((d) => d.ordersChecked > 0).length;
  return Math.min(14, Math.max(1, completedDays + 1));
}

export default function PilotPage() {
  const [audits, setAudits] = useState<AuditSession[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState("");
  const [plan, setPlan] = useState<PilotPlan>(() => createPilotFromAudit());
  const [message, setMessage] = useState("");
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem(pilotStorageKey);
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan) as PilotPlan;
        setPlan(parsed);
        setCurrentDay(getCurrentPilotDay(parsed));
      }
      const savedAudits = JSON.parse(localStorage.getItem(auditStorageKey) || "[]") as AuditSession[];
      setAudits(savedAudits);
      setSelectedAuditId(savedAudits[0]?.id || "");
    } catch {
      setAudits([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(pilotStorageKey, JSON.stringify(plan));
    setCurrentDay(getCurrentPilotDay(plan));
  }, [plan]);

  const progress = useMemo(() => calculatePilotProgress(plan), [plan]);
  const finalReview = plan.finalReview || generatePilotFinalReview(plan);
  const dayProgressPercent = Math.round((currentDay / 14) * 100);
  const todayMetrics = plan.days[currentDay - 1] || plan.days[0];
  const completedActions = plan.checklist.filter((c) => c.complete).length + plan.days.filter((d) => d.ordersChecked > 0).length;
  const totalActions = plan.checklist.length + 14;

  function createFromAudit() {
    const audit = audits.find((item) => item.id === selectedAuditId);
    const next = createPilotFromAudit(audit);
    setPlan(next);
    setMessage(audit ? `Pilot created from ${audit.brand_name} audit.` : "Demo pilot created.");
  }

  function updateDay(day: number, key: keyof PilotDayMetrics, value: string) {
    setPlan((current) => ({
      ...current,
      days: current.days.map((item) => (item.day === day ? { ...item, [key]: key === "notes" ? value : Number(value || 0) } : item))
    }));
  }

  function toggleChecklist(id: string) {
    setPlan((current) => ({ ...current, checklist: current.checklist.map((item) => item.id === id ? { ...item, complete: !item.complete } : item) }));
  }

  function toggleRule(rule: string) {
    setPlan((current) => ({
      ...current,
      selectedActionRules: current.selectedActionRules.includes(rule)
        ? current.selectedActionRules.filter((item) => item !== rule)
        : [...current.selectedActionRules, rule]
    }));
  }

  function generateReview() {
    setPlan((current) => ({ ...current, finalReview: generatePilotFinalReview(current) }));
    setMessage("Final pilot review generated locally.");
  }

  return (
    <main className="public-page">
      <header className="public-header">
        <Link className="brand-link" href="/">SupportWaala</Link>
        <nav className="public-nav">
          <Link href="/calculator">Free Leakage Check</Link>
          <Link href="/sample-report">Sample Report</Link>
          <Link href="/audit">Profit Audit</Link>
          <Link href="/pilot">Rescue Pilot</Link>
          <Link href="/">Control Room</Link>
        </nav>
      </header>

      <section className="report-hero">
        <p className="eyebrow">14-Day RTO Rescue Pilot</p>
        <h1>Turn the audit into daily COD/NDR recovery work</h1>
        <p className="hero-copy">A guided workflow for baseline setup, daily action execution, mid-pilot review, and final savings review. No WhatsApp, Shopify, or courier API integration is added yet.</p>
        <p className="muted">Phone/address may be needed only when running real WhatsApp and address-correction workflows.</p>
      </section>

      {message && <section className="calculator-layout single"><div className="success">{message}</div></section>}

      <section className="panel wide-section">
        <div className="split" style={{ marginBottom: 10 }}>
          <h2>Pilot Progress</h2>
          <span className="badge" style={{ background: "#fff4d6", color: "#7a4a00" }}>Day {currentDay} of 14</span>
        </div>
        <div className="bar-track" style={{ marginBottom: 10 }}>
          <span className="bar-fill warning" style={{ width: `${dayProgressPercent}%` }} />
        </div>
        <div className="split">
          <span className="muted">{dayProgressPercent}% of pilot complete · {completedActions} of {totalActions} actions done</span>
          <span className="muted">Estimated savings so far: <strong>{formatCurrency(progress.estimatedSavings)}</strong></span>
        </div>
      </section>

      <section className="panel wide-section">
        <h2>Today&apos;s Focus — Day {currentDay}</h2>
        <div className="public-section-grid" style={{ marginTop: 12 }}>
          <div className="panel" style={{ background: "#fff8ec" }}>
            <strong>Morning</strong>
            <p className="muted">Upload new orders, review risky COD queue, queue confirmations and address corrections.</p>
            <div className="toolbar tight">
              <Link className="button secondary" href="/">Open Control Room</Link>
            </div>
          </div>
          <div className="panel" style={{ background: "#fff8ec" }}>
            <strong>Afternoon</strong>
            <p className="muted">Check customer responses, mark confirmed / cancelled / updated, prepare dispatch.</p>
          </div>
          <div className="panel" style={{ background: "#ffe4e0" }}>
            <strong>Evening — NDR Rescue</strong>
            <p className="muted">Review NDR cases, queue rescue messages, mark reattempt / call / cancel / RTO.</p>
            <div className="toolbar tight">
              <Link className="button secondary" href="/">Open NDR War Room</Link>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>
            <span className="muted">Simulate pilot day</span>
            <input className="input" type="range" min="1" max="14" value={currentDay} onChange={(event) => setCurrentDay(Number(event.target.value))} />
          </label>
        </div>
      </section>

      <section className="calculator-layout">
        <div className="panel">
          <h2>Pilot Overview</h2>
          <div className="form-grid one">
            <label>
              <span>Start from audit session</span>
              <select className="select" value={selectedAuditId} onChange={(event) => setSelectedAuditId(event.target.value)}>
                <option value="">Demo baseline</option>
                {audits.map((audit) => <option key={audit.id} value={audit.id}>{audit.brand_name} · {formatCurrency(audit.calculated_metrics.monthlyLeakage)}</option>)}
              </select>
            </label>
            <button className="button" onClick={createFromAudit}>Create 14-day pilot plan</button>
          </div>
          <div className="metrics grid">
            <Metric label="Brand" value={plan.brandName} />
            <Metric label="Monthly orders" value={formatNumber(plan.baseline.monthlyOrders)} />
            <Metric label="COD baseline" value={formatPercent(plan.baseline.codPercentage)} />
            <Metric label="RTO baseline" value={formatPercent(plan.baseline.rtoPercentage)} />
            <Metric label="Monthly leakage" value={formatCurrency(plan.baseline.monthlyLeakage)} />
          </div>
        </div>
        <div className="panel output-panel">
          <h2>Current Pilot Progress</h2>
          <Result label="Checklist completion" value={formatPercent(progress.checklistCompletionRate * 100)} />
          <Result label="Action completion rate" value={formatPercent(progress.actionCompletionRate * 100)} />
          <Result label="NDR response/rescue rate" value={formatPercent(progress.ndrResponseRate * 100)} />
          <Result label="Delivered after NDR" value={formatNumber(progress.deliveredAfterNdrCount)} />
          <Result label="Cancelled before shipping" value={formatNumber(progress.cancellationsBeforeShipping)} />
          <Result label="Estimated savings" value={formatCurrency(progress.estimatedSavings)} strong />
          <Result label="Net benefit vs pilot fee" value={formatCurrency(progress.pilotNetBenefit)} />
          <Result label="Pilot ROI" value={progress.pilotRoi === null ? "Not applicable" : `${progress.pilotRoi.toFixed(1)}x`} />
        </div>
      </section>

      <section className="report-section-grid">
        <div className="panel">
          <h2>Stage 1: Baseline Setup</h2>
          <div className="option-list">
            {plan.checklist.map((item) => (
              <label className="consent-row" key={item.id}>
                <input type="checkbox" checked={item.complete} onChange={() => toggleChecklist(item.id)} />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>Selected Action Rules</h2>
          <div className="option-list">
            {pilotActionRules.map((rule) => (
              <label className="consent-row" key={rule}>
                <input type="checkbox" checked={plan.selectedActionRules.includes(rule)} onChange={() => toggleRule(rule)} />
                <span>{rule}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="panel wide-section">
        <h2>Stage 2: Daily Action Execution</h2>
        <div className="public-section-grid">
          <Workflow title="Morning" items={["Upload new orders / review imported orders", "Review risky COD queue", "Queue COD confirmation", "Queue address correction", "Queue prepaid offer"]} />
          <Workflow title="Afternoon" items={["Check customer responses", "Mark confirmed / cancelled / address updated", "Prepare dispatch decision"]} />
          <Workflow title="Evening" items={["Review NDR cases", "Queue NDR rescue message", "Mark reattempt / call / cancel / RTO", "Record savings events"]} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Day</th><th>Orders checked</th><th>Risky COD</th><th>Address fixed</th><th>COD queued</th><th>Prepaid opps</th><th>NDR cases</th><th>NDR contacted</th><th>NDR rescued</th><th>Cancelled pre-ship</th><th>Savings</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {plan.days.map((day) => (
                <tr key={day.day}>
                  <td>{day.day}</td>
                  {(["ordersChecked", "riskyCodFound", "addressesCorrected", "codConfirmationsQueued", "prepaidOpportunitiesFound", "ndrCasesFound", "ndrsContacted", "ndrsRescued", "ordersCancelledBeforeShipping", "estimatedSavings"] as Array<keyof PilotDayMetrics>).map((key) => (
                    <td key={key}><input className="input compact-input" type="number" value={String(day[key])} onChange={(event) => updateDay(day.day, key, event.target.value)} /></td>
                  ))}
                  <td><input className="input compact-input note-input" value={day.notes} onChange={(event) => updateDay(day.day, "notes", event.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-section-grid">
        <div className="panel">
          <h2>Stage 3: Mid-Pilot Review</h2>
          <Result label="Current results" value={formatCurrency(progress.estimatedSavings)} />
          <Result label="Action completion rate" value={formatPercent(progress.actionCompletionRate * 100)} />
          <Result label="NDR response rate" value={formatPercent(progress.ndrResponseRate * 100)} />
          <Result label="Delivered-after-NDR count" value={formatNumber(progress.deliveredAfterNdrCount)} />
          <Result label="Cancellations before shipping" value={formatNumber(progress.cancellationsBeforeShipping)} />
          <p className="muted">Recommendations: adjust risk threshold, change message template, focus on top pincode, focus on top courier, and increase call fallback for high-value orders.</p>
        </div>
        <div className="panel">
          <h2>Stage 4: Final Savings Review</h2>
          <button className="button" onClick={generateReview}>Generate final review</button>
          <Result label="Baseline RTO" value={formatPercent(finalReview.baselineRto)} />
          <Result label="Pilot-period RTO estimate" value={formatPercent(finalReview.pilotPeriodRto)} />
          <Result label="Total actions taken" value={formatNumber(finalReview.totalActionsTaken)} />
          <Result label="Total estimated savings" value={formatCurrency(finalReview.estimatedSavings)} strong />
          <Result label="Net benefit vs pilot fee" value={formatCurrency(finalReview.pilotNetBenefit)} />
          <Result label="Top successful action type" value={finalReview.topSuccessfulActionType} />
          <Result label="Top leakage still unresolved" value={finalReview.topLeakageStillUnresolved} />
          <Result label="Outcome status" value={finalReview.outcomeStatus.replaceAll("_", " ")} />
          <p><strong>Next plan recommendation:</strong> {finalReview.recommendation}</p>
        </div>
      </section>

      <section className="report-cta">
        <div>
          <h2>Privacy note</h2>
          <p>Customer-level communication should only be used for delivery/RTO operations, not unrelated marketing.</p>
        </div>
        <Link className="button" href="/audit">Back to audit flow</Link>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="panel metric"><div className="label">{label}</div><div className="value">{value}</div></div>;
}

function Result({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={strong ? "result-row strong" : "result-row"}><span>{label}</span><strong>{value}</strong></div>;
}

function Workflow({ title, items }: { title: string; items: string[] }) {
  return <div className="action-row"><h3>{title}</h3>{items.map((item) => <p className="muted" key={item}>{item}</p>)}</div>;
}
