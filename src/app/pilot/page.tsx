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
  type PilotOwnerDiscipline,
  type PilotPlan
} from "@/lib/pilot";
import {
  buildAuditToPilotHandoff,
  buildPilotFinalReviewTemplate,
  buildPilotHandoffFromPlan,
  type AuditToPilotHandoff
} from "@/features/pilot-handoff";
import { buildPilotExecutionTracker } from "@/features/pilot-execution";
import { buildPilotGoNoGoFromPlan, evaluatePilotOwnerDiscipline } from "@/features/pilot-readiness";
import { buildPilotDailyLogRows, buildPilotWorkflowCalendar } from "@/features/pilot-workflow";
import { pilotOperatorSop } from "@/features/sops";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/reporting";
import { calculatePilotBreakEven } from "@/lib/roi";

const pilotStorageKey = "wembro:pilot-plan";
const previousPilotStorageKey = "rtoshield:pilot-plan";
const auditStorageKey = "wembro:audit-sessions";
const previousAuditStorageKey = "rtoshield:audit-sessions";
const auditPilotHandoffStorageKey = "wembro:audit-pilot-handoff";
const defaultOwnerDiscipline: PilotOwnerDiscipline = {
  ownerRole: "",
  ownerName: "",
  morningWindow: "",
  afternoonWindow: "",
  eveningWindow: "",
  escalationChannel: ""
};

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
  const [savedAuditHandoff, setSavedAuditHandoff] = useState<AuditToPilotHandoff | null>(null);

  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem(pilotStorageKey) || localStorage.getItem(previousPilotStorageKey);
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan) as PilotPlan;
        setPlan(parsed);
        setCurrentDay(getCurrentPilotDay(parsed));
      }
      const savedAudits = JSON.parse(localStorage.getItem(auditStorageKey) || localStorage.getItem(previousAuditStorageKey) || "[]") as AuditSession[];
      const savedHandoff = JSON.parse(localStorage.getItem(auditPilotHandoffStorageKey) || "null") as AuditToPilotHandoff | null;
      setAudits(savedAudits);
      setSavedAuditHandoff(savedHandoff);
      setSelectedAuditId(savedHandoff?.sourceAuditId && savedAudits.some((audit) => audit.id === savedHandoff.sourceAuditId) ? savedHandoff.sourceAuditId : savedAudits[0]?.id || "");
    } catch {
      setAudits([]);
      setSavedAuditHandoff(null);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(pilotStorageKey, JSON.stringify(plan));
    setCurrentDay(getCurrentPilotDay(plan));
  }, [plan]);

  const progress = useMemo(() => calculatePilotProgress(plan), [plan]);
  const finalReview = plan.finalReview || generatePilotFinalReview(plan);
  const selectedAudit = useMemo(() => audits.find((item) => item.id === selectedAuditId), [audits, selectedAuditId]);
  const selectedAuditHandoff = useMemo(() => selectedAudit ? buildAuditToPilotHandoff(selectedAudit) : null, [selectedAudit]);
  const visibleAuditHandoff = selectedAuditHandoff || savedAuditHandoff;
  const ownerDiscipline = plan.ownerDiscipline || defaultOwnerDiscipline;
  const ownerReadiness = useMemo(() => evaluatePilotOwnerDiscipline(ownerDiscipline), [ownerDiscipline]);
  const goNoGo = useMemo(() => buildPilotGoNoGoFromPlan(plan, progress, finalReview), [plan, progress, finalReview]);
  const handoffPack = useMemo(() => buildPilotHandoffFromPlan(plan, progress, finalReview), [plan, progress, finalReview]);
  const finalReviewTemplate = useMemo(() => buildPilotFinalReviewTemplate({ plan, finalReview }), [plan, finalReview]);
  const executionTracker = useMemo(() => buildPilotExecutionTracker(plan, currentDay), [plan, currentDay]);
  const pilotCalendar = useMemo(() => buildPilotWorkflowCalendar(plan, currentDay), [plan, currentDay]);
  const dailyLogRows = useMemo(() => buildPilotDailyLogRows(plan), [plan]);
  const breakEven = useMemo(
    () => calculatePilotBreakEven({
      pilotFee: plan.pilotFee,
      rtoLossPerOrder: plan.baseline.rtoLossPerOrder,
      estimatedSavings: progress.estimatedSavings
    }),
    [plan.baseline.rtoLossPerOrder, plan.pilotFee, progress.estimatedSavings]
  );
  const dayProgressPercent = Math.round((currentDay / 14) * 100);
  const todayMetrics = plan.days[currentDay - 1] || plan.days[0];
  const completedActions = plan.checklist.filter((c) => c.complete).length + plan.days.filter((d) => d.ordersChecked > 0).length;
  const totalActions = plan.checklist.length + 14;

  function createFromAudit() {
    const next = createPilotFromAudit(selectedAudit);
    setPlan(next);
    setMessage(selectedAudit ? `Rescue pilot created from ${selectedAudit.brand_name} profit audit. Privacy label preserved in the handoff panel.` : "Demo rescue pilot created.");
  }

  function updateDay(day: number, key: keyof PilotDayMetrics, value: string) {
    const textKeys = new Set<keyof PilotDayMetrics>(["notes", "proofNote", "blocker"]);
    setPlan((current) => ({
      ...current,
      days: current.days.map((item) => (item.day === day ? { ...item, [key]: textKeys.has(key) ? value : Number(value || 0) } : item))
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

  function updateOwnerDiscipline(key: keyof PilotOwnerDiscipline, value: string) {
    setPlan((current) => ({
      ...current,
      ownerDiscipline: {
        ...defaultOwnerDiscipline,
        ...current.ownerDiscipline,
        [key]: value
      }
    }));
  }

  async function copyFinalReview() {
    await navigator.clipboard.writeText(finalReviewTemplate.markdown);
    setMessage("Final review copied locally.");
  }

  function exportFinalReview() {
    const blob = new Blob([finalReviewTemplate.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${plan.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-pilot-final-review.md`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Final review exported locally.");
  }

  return (
    <MarketingPage>
      <section className="report-hero">
        <p className="eyebrow">14-Day Rescue Pilot</p>
        <h1>Turn the profit audit into a daily routine your team can actually run.</h1>
        <p className="hero-copy">Two weeks of guided work — baseline, daily actions, mid-pilot check, and a final savings review.</p>
        <p className="muted">Phone numbers and addresses are only needed when you run real customer messaging or address fixes.</p>
      </section>

      {message && <section className="calculator-layout single"><div className="success">{message}</div></section>}

      <section className="panel wide-section pilot-sop" id="operator-sop">
        <div className="split">
          <div>
            <p className="eyebrow">Operator SOP</p>
            <h2>{pilotOperatorSop.title}</h2>
            <p className="muted">{pilotOperatorSop.promise}</p>
          </div>
          <div className="toolbar tight">
            <Link className="button secondary" href="/dashboard">Open dashboard playbooks</Link>
          </div>
        </div>
        <div className="notice">{pilotOperatorSop.providerBoundary}</div>
        <div className="pilot-sop__routine">
          {pilotOperatorSop.routine.map((block) => (
            <article className="pilot-sop__block" key={block.id}>
              <span>{block.window}</span>
              <strong>{block.title}</strong>
              <p>{block.goal}</p>
              <ul>
                {block.steps.slice(0, 3).map((step) => <li key={step}>{step}</li>)}
              </ul>
              <small>Proof: {block.proofLog.slice(0, 3).join(", ")}</small>
            </article>
          ))}
        </div>
        <div className="pilot-sop__workflows">
          {pilotOperatorSop.workflows.map((workflow) => (
            <div key={workflow.id}>
              <strong>{workflow.title}</strong>
              <p>{workflow.operatorAction}</p>
              <small>{workflow.proofRequired}</small>
            </div>
          ))}
        </div>
      </section>

      <section className={`panel wide-section pilot-gate pilot-gate--${goNoGo.recommendation}`}>
        <div className="split">
          <div>
            <p className="eyebrow">Pilot go/no-go gate</p>
            <h2>{goNoGo.headline}</h2>
            <p className="muted">{goNoGo.detail}</p>
          </div>
          <span className="badge neutral">{goNoGo.recommendation}</span>
        </div>
        <div className="pilot-gate__grid">
          {goNoGo.gates.map((gate) => (
            <article className={`pilot-gate__item ${gate.status}`} key={gate.id}>
              <span>{gate.status === "pass" ? "Pass" : "Fail"}</span>
              <strong>{gate.label}</strong>
              <small>{gate.metric}</small>
              <p>{gate.reason}</p>
              {gate.status === "fail" ? <em>{gate.nextAction}</em> : null}
            </article>
          ))}
        </div>
      </section>

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

      <section className="panel wide-section pilot-break-even">
        <div className="split">
          <div>
            <p className="eyebrow">Pilot break-even estimate</p>
            <h2>About {formatNumber(breakEven.breakEvenSavedOrders)} saved or RTO-prevented orders covers {formatCurrency(breakEven.pilotFee)}.</h2>
            <p className="muted">{breakEven.caveat}</p>
          </div>
          <span className="badge neutral">{breakEven.label}</span>
        </div>
        <div className="pilot-break-even__grid">
          <Metric label="Pilot fee" value={formatCurrency(breakEven.pilotFee)} />
          <Metric label="Assumed RTO loss/order" value={formatCurrency(breakEven.rtoLossPerOrder, { perOrder: true })} />
          <Metric label="Break-even orders" value={formatNumber(breakEven.breakEvenSavedOrders)} />
          <Metric label="Still needed" value={`${formatNumber(breakEven.remainingSavedOrdersToBreakEven)} orders`} />
        </div>
        <div className="pilot-break-even__formula">
          <strong>Formula</strong>
          <p>{breakEven.formula}</p>
          <small>
            {formatCurrency(breakEven.pilotFee)} / {formatCurrency(breakEven.rtoLossPerOrder)} = {formatNumber(breakEven.breakEvenSavedOrders)} saved or RTO-prevented orders.
            Current estimate equals about {formatNumber(breakEven.currentSavedOrderEquivalent)} orders; remaining estimated gap is {formatCurrency(breakEven.remainingSavingsToBreakEven)}.
          </small>
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
        <div className="pilot-day-grid" aria-label="rescue pilot status">
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

      <section className="panel wide-section pilot-calendar">
        <div className="split">
          <div>
            <p className="eyebrow">14-day rescue calendar</p>
            <h2>Day {pilotCalendar.currentDay}: {pilotCalendar.today.focus}</h2>
            <p className="muted">{pilotCalendar.today.output}</p>
          </div>
          <span className="badge neutral">{pilotCalendar.today.phase}</span>
        </div>
        <div className="pilot-calendar__today">
          <div>
            <strong>Today&apos;s proof</strong>
            <p>{pilotCalendar.today.proof}</p>
          </div>
          <div>
            <strong>Savings ledger tie</strong>
            <p>{pilotCalendar.today.savingsLedgerTie}</p>
          </div>
          <div>
            <strong>Stop condition</strong>
            <p>{pilotCalendar.today.stopCondition}</p>
          </div>
        </div>
        <div className="pilot-calendar__gates">
          {pilotCalendar.reviewGates.map((gate) => (
            <div className={`pilot-calendar__gate ${gate.status}`} key={gate.day}>
              <span>Day {gate.day}</span>
              <strong>{gate.label}</strong>
              <p>{gate.decision}</p>
              <small>{gate.stopCondition}</small>
            </div>
          ))}
        </div>
        <div className="pilot-calendar__grid" aria-label="14-day rescue calendar">
          {pilotCalendar.days.map((day) => (
            <article className={`pilot-calendar__day ${day.status}`} key={day.day}>
              <button type="button" onClick={() => setCurrentDay(day.day)}>
                <span>Day {day.day}</span>
                <strong>{day.focus}</strong>
                <small>{day.status.replaceAll("_", " ")}</small>
              </button>
              <p>{day.actions.join(" · ")}</p>
              <dl>
                <div>
                  <dt>Output</dt>
                  <dd>{day.output}</dd>
                </div>
                <div>
                  <dt>Proof</dt>
                  <dd>{day.proof}</dd>
                </div>
                <div>
                  <dt>Ledger</dt>
                  <dd>{day.estimatedSavings > 0 ? `${formatCurrency(day.estimatedSavings)} logged · ` : ""}{day.savingsLedgerTie}</dd>
                </div>
                <div>
                  <dt>Stop</dt>
                  <dd>{day.stopCondition}</dd>
                </div>
              </dl>
            </article>
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
          <h2>Rescue Pilot Overview</h2>
          <div className="form-grid one">
            <label>
              <span>Start from audit session</span>
              <select className="select" value={selectedAuditId} onChange={(event) => setSelectedAuditId(event.target.value)}>
                <option value="">Demo baseline</option>
                {audits.map((audit) => <option key={audit.id} value={audit.id}>{audit.brand_name} · {formatCurrency(audit.calculated_metrics.monthlyLeakage)}</option>)}
              </select>
            </label>
            <button className="button" onClick={createFromAudit}>Create rescue pilot plan</button>
          </div>
          {visibleAuditHandoff && (
            <div className="notice">
              <strong>Incoming profit audit handoff:</strong> {visibleAuditHandoff.nextMission}
              <p className="muted">{visibleAuditHandoff.privacyLabel}</p>
              <p className="muted">{visibleAuditHandoff.localTransferNote}</p>
            </div>
          )}
          <div className="notice">
            <strong>Owner discipline:</strong> {ownerReadiness.metric}
            <p className="muted">{ownerReadiness.nextAction}</p>
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
          <h2>Current Rescue Pilot Progress</h2>
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
          <h2>Owner and cadence</h2>
          <p className="muted">Use role/name labels only. Do not paste phone numbers, emails, or customer-level data here.</p>
          <div className="form-grid one">
            <label>
              <span>Owner role</span>
              <select className="select" value={ownerDiscipline.ownerRole} onChange={(event) => updateOwnerDiscipline("ownerRole", event.target.value)}>
                <option value="">Choose owner role</option>
                <option value="Founder">Founder</option>
                <option value="Ops lead">Ops lead</option>
                <option value="Support lead">Support lead</option>
                <option value="Warehouse lead">Warehouse lead</option>
                <option value="Other owner">Other owner</option>
              </select>
            </label>
            <Field label="Owner display name (optional)" value={ownerDiscipline.ownerName || ""} onChange={(value) => updateOwnerDiscipline("ownerName", value)} />
            <Field label="Morning order review window" value={ownerDiscipline.morningWindow} onChange={(value) => updateOwnerDiscipline("morningWindow", value)} />
            <Field label="Afternoon response review window" value={ownerDiscipline.afternoonWindow} onChange={(value) => updateOwnerDiscipline("afternoonWindow", value)} />
            <Field label="Evening NDR rescue window" value={ownerDiscipline.eveningWindow} onChange={(value) => updateOwnerDiscipline("eveningWindow", value)} />
            <Field label="Escalation channel label" value={ownerDiscipline.escalationChannel} onChange={(value) => updateOwnerDiscipline("escalationChannel", value)} />
          </div>
          <div className={ownerReadiness.ready ? "success" : "notice"}>
            <strong>{ownerReadiness.ready ? "Owner gate passes" : "Owner gate blocked"}</strong>
            <p>{ownerReadiness.metric}</p>
            {ownerReadiness.privacyWarning ? <p>{ownerReadiness.privacyWarning}</p> : null}
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
        <div className="notice">
          <strong>Daily log rule:</strong> action counts show work, proof note explains the outcome, blocker explains why work stopped, and estimated saving stays an estimate until the final review verifies it.
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Order signal</th>
                <th>Action counts</th>
                <th>NDR proof</th>
                <th>Estimated saving</th>
                <th>Proof note</th>
                <th>Blocker</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {plan.days.map((day) => (
                <tr key={day.day}>
                  <td>
                    <strong>Day {day.day}</strong>
                    <small>{dailyLogRows[day.day - 1]?.reviewLabel}</small>
                  </td>
                  <td>
                    <CompactNumber label="Orders" value={day.ordersChecked} onChange={(value) => updateDay(day.day, "ordersChecked", value)} />
                    <CompactNumber label="Risky COD" value={day.riskyCodFound} onChange={(value) => updateDay(day.day, "riskyCodFound", value)} />
                  </td>
                  <td>
                    <CompactNumber label="COD queued" value={day.codConfirmationsQueued} onChange={(value) => updateDay(day.day, "codConfirmationsQueued", value)} />
                    <CompactNumber label="Address" value={day.addressesCorrected} onChange={(value) => updateDay(day.day, "addressesCorrected", value)} />
                    <CompactNumber label="Prepaid" value={day.prepaidOpportunitiesFound} onChange={(value) => updateDay(day.day, "prepaidOpportunitiesFound", value)} />
                    <CompactNumber label="Cancelled" value={day.ordersCancelledBeforeShipping} onChange={(value) => updateDay(day.day, "ordersCancelledBeforeShipping", value)} />
                  </td>
                  <td>
                    <CompactNumber label="Cases" value={day.ndrCasesFound} onChange={(value) => updateDay(day.day, "ndrCasesFound", value)} />
                    <CompactNumber label="Contacted" value={day.ndrsContacted} onChange={(value) => updateDay(day.day, "ndrsContacted", value)} />
                    <CompactNumber label="Rescued" value={day.ndrsRescued} onChange={(value) => updateDay(day.day, "ndrsRescued", value)} />
                  </td>
                  <td>
                    <input className="input compact-input" type="number" value={String(day.estimatedSavings)} onChange={(event) => updateDay(day.day, "estimatedSavings", event.target.value)} />
                  </td>
                  <td><input className="input compact-input note-input" value={day.proofNote || ""} placeholder="Outcome tied to action" onChange={(event) => updateDay(day.day, "proofNote", event.target.value)} /></td>
                  <td><input className="input compact-input note-input" value={day.blocker || ""} placeholder="Reason work stopped" onChange={(event) => updateDay(day.day, "blocker", event.target.value)} /></td>
                  <td>
                    <small>{dailyLogRows[day.day - 1]?.actionSummary}</small>
                    <input className="input compact-input note-input" value={day.notes || ""} placeholder="Internal note" onChange={(event) => updateDay(day.day, "notes", event.target.value)} />
                  </td>
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

      <section className="panel wide-section pilot-final-review">
        <div className="split">
          <div>
            <p className="eyebrow">Copyable final review</p>
            <h2>{finalReviewTemplate.title}</h2>
            <p className="muted">Decision: <strong>{finalReviewTemplate.decision}</strong>. Estimated and verified savings stay separate.</p>
          </div>
          <div className="toolbar tight">
            <button className="button secondary" type="button" onClick={copyFinalReview}>Copy review</button>
            <button className="button" type="button" onClick={exportFinalReview}>Export .md</button>
          </div>
        </div>
        <div className="pilot-final-review__summary">
          <Metric label="Estimated savings" value={formatCurrency(finalReviewTemplate.savings.estimated)} />
          <Metric label="Verified savings" value={formatCurrency(finalReviewTemplate.savings.verified)} />
          <Metric label="Unverified estimate" value={formatCurrency(finalReviewTemplate.savings.unverified)} />
        </div>
        <div className="pilot-final-review__grid">
          <div>
            <strong>Failures and limits</strong>
            {finalReviewTemplate.failures.map((failure) => <p className="muted" key={failure}>{failure}</p>)}
          </div>
          <div>
            <strong>Next plan</strong>
            {finalReviewTemplate.nextPlan.map((item) => <p className="muted" key={item}>{item}</p>)}
          </div>
        </div>
        <textarea className="input pilot-final-review__copy" readOnly value={finalReviewTemplate.markdown} />
      </section>

      <section className="report-cta">
        <div>
          <h2>Privacy note</h2>
          <p>Customer-level communication should only be used for delivery/RTO operations, not unrelated marketing.</p>
        </div>
        <Link className="button" href="/audit">Back to profit audit</Link>
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span>{label}</span><input className="input" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function CompactNumber({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="muted">{label}</span>
      <input className="input compact-input" type="number" value={String(value)} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Workflow({ title, items }: { title: string; items: string[] }) {
  return <div className="action-row"><h3>{title}</h3>{items.map((item) => <p className="muted" key={item}>{item}</p>)}</div>;
}
