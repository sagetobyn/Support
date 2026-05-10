"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import type { AuditSession } from "@/lib/audit";
import {
  calculatePilotProgress,
  createPilotFromAudit,
  generatePilotFinalReview,
  pilotActionRules,
  type PilotDayMetrics,
  type PilotPlan
} from "@/lib/pilot";
import { buildPilotHandoffFromPlan } from "@/features/pilot-handoff";
import { buildPilotExecutionTracker } from "@/features/pilot-execution";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/reporting";

const pilotStorageKey = "wembro:pilot-plan";
const previousPilotStorageKey = "rtoshield:pilot-plan";
const auditStorageKey = "wembro:audit-sessions";
const previousAuditStorageKey = "rtoshield:audit-sessions";

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
      const savedPlan = localStorage.getItem(pilotStorageKey) || localStorage.getItem(previousPilotStorageKey);
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan) as PilotPlan;
        setPlan(parsed);
        setCurrentDay(getCurrentPilotDay(parsed));
      }
      const savedAudits = JSON.parse(localStorage.getItem(auditStorageKey) || localStorage.getItem(previousAuditStorageKey) || "[]") as AuditSession[];
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
  const handoffPack = useMemo(() => buildPilotHandoffFromPlan(plan, progress, finalReview), [plan, progress, finalReview]);
  const executionTracker = useMemo(() => buildPilotExecutionTracker(plan, currentDay), [plan, currentDay]);
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
    <MarketingPage>
      <section className="report-hero">
        <p className="eyebrow">14-Day Rescue Pilot</p>
        <h1>Turn the audit into a daily routine your team can actually run.</h1>
        <p className="hero-copy">Two weeks of guided work — baseline, daily actions, mid-pilot check, and a final savings review.</p>
        <p className="muted">Phone numbers and addresses are only needed when you run real customer messaging or address fixes.</p>
      </section>

      {message && <section className="calculator-layout single"><div className="success">{message}</div></section>}

      <section className={`panel wide-section pilot-handoff pilot-handoff--${handoffPack.status}`}>
        <div className="split">
          <div>
            <p className="eyebrow">CEO handoff pack</p>
            <h2>{handoffPack.headline}</h2>
            <p className="muted">{handoffPack.ceoInstruction}</p>
          </div>
          <span className="badge neutral">{handoffPack.status.replaceAll("_", " ")}</span>
        </div>
        <div className="pilot-handoff__criteria">
          {handoffPack.successCriteria.map((criterion) => (
            <div className={criterion.met ? "pilot-criterion met" : "pilot-criterion"} key={criterion.label}>
              <span>{criterion.met ? "Met" : "Open"}</span>
              <strong>{criterion.label}</strong>
              <small>{criterion.current} / {criterion.target}</small>
            </div>
          ))}
        </div>
        <div className="pilot-handoff__risks">
          <div>
            <strong>Decision rule</strong>
            <p>{handoffPack.decisionRule}</p>
          </div>
          <div>
            <strong>Renewal decision</strong>
            <p>{handoffPack.renewalDecision}</p>
          </div>
        </div>
      </section>

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

      <section className="panel wide-section pilot-execution">
        <div className="split">
          <div>
            <p className="eyebrow">Pilot execution tracker</p>
            <h2>{executionTracker.today?.label || `Day ${executionTracker.currentDay}`}: {executionTracker.currentInstruction}</h2>
            <p className="muted">{executionTracker.warnings.join(" ")}</p>
          </div>
          <div className="pilot-execution__score">
            <strong>{executionTracker.completionPercent}%</strong>
            <span>{executionTracker.loggedDays}/14 days logged</span>
          </div>
        </div>
        <div className="pilot-execution__stats">
          <Metric label="Proof days" value={formatNumber(executionTracker.proofDays)} />
          <Metric label="Missed days" value={formatNumber(executionTracker.missedDays)} />
          <Metric label="Current phase" value={executionTracker.today?.phase || "Pilot"} />
          <Metric label="Today savings" value={formatCurrency(todayMetrics.estimatedSavings)} />
        </div>
        <div className="pilot-day-grid" aria-label="14-day pilot status">
          {executionTracker.days.map((day) => (
            <button className={`pilot-day-card ${day.status} ${day.day === currentDay ? "selected" : ""}`} key={day.day} onClick={() => setCurrentDay(day.day)}>
              <span>{day.day}</span>
              <strong>{day.phase}</strong>
              <small>{day.status.replaceAll("_", " ")}</small>
              {day.estimatedSavings > 0 ? <em>{formatCurrency(day.estimatedSavings)}</em> : null}
            </button>
          ))}
        </div>
        <div className="pilot-checkpoint-grid">
          {executionTracker.checkpoints.map((checkpoint) => (
            <div className={`pilot-checkpoint ${checkpoint.status}`} key={checkpoint.day}>
              <span>Day {checkpoint.day}</span>
              <strong>{checkpoint.label}</strong>
              <p>{checkpoint.criteria}</p>
              <small>{checkpoint.decision}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel wide-section">
        <h2>Today&apos;s focus — Day {currentDay}</h2>
        <div className="public-section-grid" style={{ marginTop: 12 }}>
          <div className="panel" style={{ background: "#fff8ec" }}>
            <strong>Morning</strong>
            <p className="muted">Pull in new orders, review the risky cash queue, and line up confirmations and address fixes.</p>
            <div className="toolbar tight">
              <Link className="button secondary" href="/dashboard">Open dashboard</Link>
            </div>
          </div>
          <div className="panel" style={{ background: "#fff8ec" }}>
            <strong>Afternoon</strong>
            <p className="muted">Check customer responses. Mark each one confirmed, cancelled, or updated — then dispatch.</p>
          </div>
          <div className="panel" style={{ background: "#ffe4e0" }}>
            <strong>Evening — failed-delivery rescue</strong>
            <p className="muted">Walk through every failed delivery: send a rescue message, then mark reattempt, call, cancel, or return.</p>
            <div className="toolbar tight">
              <Link className="button secondary" href="/dashboard">Open rescue room</Link>
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
          <h2>Step 1 — Baseline setup</h2>
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
          <h2>Action rules you'll use</h2>
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
        <h2>Step 2 — Daily routine</h2>
        <div className="public-section-grid">
          <Workflow title="Morning" items={["Pull in new orders", "Review risky cash orders", "Queue confirmations", "Queue address fixes", "Queue prepaid offers"]} />
          <Workflow title="Afternoon" items={["Check customer responses", "Mark confirmed / cancelled / updated", "Decide what to dispatch"]} />
          <Workflow title="Evening" items={["Review failed deliveries", "Send rescue messages", "Mark reattempt / call / cancel / return", "Log savings"]} />
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
          <h2>Step 3 — Mid-pilot review</h2>
          <Result label="Current results" value={formatCurrency(progress.estimatedSavings)} />
          <Result label="Action completion rate" value={formatPercent(progress.actionCompletionRate * 100)} />
          <Result label="NDR response rate" value={formatPercent(progress.ndrResponseRate * 100)} />
          <Result label="Delivered-after-NDR count" value={formatNumber(progress.deliveredAfterNdrCount)} />
          <Result label="Cancellations before shipping" value={formatNumber(progress.cancellationsBeforeShipping)} />
          <p className="muted">Recommendations: adjust risk threshold, change message template, focus on top pincode, focus on top courier, and increase call fallback for high-value orders.</p>
        </div>
        <div className="panel">
          <h2>Step 4 — Final savings review</h2>
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
    </MarketingPage>
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
