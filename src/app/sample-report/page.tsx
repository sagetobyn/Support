import Link from "next/link";
import type { ReactNode } from "react";
import {
  buildSampleReportForwardableText,
  sampleReportAssumptions,
  sampleReportCtaLadder,
  sampleReportDecision,
  sampleReportFictionalNotice,
  sampleReportLeakageBreakdown,
  sampleReportMetrics,
  sampleReportPaidArtifactIncludes,
  sampleReportPrintSummary,
  sampleReportProofNotes,
  sampleReportRankedActions,
  sampleReportSeller,
  sampleReportTopLeaks
} from "@/features/reports";

export default function SampleReportPage() {
  const forwardableText = buildSampleReportForwardableText();

  return (
    <main className="public-page report-page">
      <header className="public-header">
        <Link className="brand-link" href="/">Wembro</Link>
        <nav className="public-nav">
          <Link href="/calculator">Free Leakage Check</Link>
          <Link href="/sample-report">Sample Profit Audit</Link>
          <Link href="/audit">Profit Audit</Link>
          <Link href="/pilot">Rescue Pilot</Link>
        </nav>
      </header>

      <section className="report-hero">
        <p className="eyebrow">{sampleReportDecision.eyebrow}</p>
        <h1>{sampleReportDecision.headline}</h1>
        <p className="hero-copy">{sampleReportDecision.summary}</p>
        <div className="notice">
          <strong>Fictional data boundary:</strong> {sampleReportFictionalNotice}
        </div>
        <p className="muted"><strong>Recommended next step:</strong> {sampleReportDecision.nextStep}</p>
      </section>

      <section className="report-summary-grid">
        {sampleReportMetrics.map((metric) => (
          <Metric key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="print-only sample-report-print-summary" aria-label={sampleReportPrintSummary.title}>
        <ReportBlock title={sampleReportPrintSummary.title}>
          <p><strong>{sampleReportPrintSummary.decision}</strong></p>
          <p>{sampleReportDecision.summary}</p>
          <p><strong>Fictional label:</strong> {sampleReportPrintSummary.boundary}</p>
        </ReportBlock>

        <TableBlock
          title="Print Summary: Top Leak And First Action"
          headers={["Leak", "Evidence", "Estimated impact", "First action", "Proof note"]}
          rows={[
            [
              sampleReportPrintSummary.topLeak.title,
              sampleReportPrintSummary.topLeak.evidence,
              sampleReportPrintSummary.topLeak.estimatedImpact,
              sampleReportPrintSummary.topLeak.firstAction,
              sampleReportPrintSummary.topLeak.proofNote
            ]
          ]}
        />

        <TableBlock
          title="Print Summary: Next Actions"
          headers={["Rank", "Action", "Owner", "What happens"]}
          rows={sampleReportPrintSummary.nextActions.map((action) => [action.rank, action.title, action.owner, action.action])}
        />

        <TableBlock
          title="Print Summary: Assumptions"
          headers={["Assumption", "Value"]}
          rows={sampleReportPrintSummary.assumptions.map((assumption) => [assumption.label, assumption.value])}
        />

        <ReportBlock title="Print Summary: Trust Boundary">
          <p>{sampleReportPrintSummary.footerNote}</p>
          <p>No live WhatsApp sending, courier API push, Shopify/WooCommerce sync, customer-level PII, ML prediction, or guaranteed ROI is included.</p>
        </ReportBlock>
      </section>

      <section className="report-section-grid sample-report-screen-detail">
        <ReportBlock title="1. Founder Summary">
          <p>This is the paid-audit style answer a founder should be able to forward without extra explanation.</p>
          <div className="roi-strip">
            {forwardableText.split("\n").map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </ReportBlock>

        <ReportBlock title="2. Assumptions The Seller Can Challenge">
          <p>The sample math is intentionally visible. In a real audit, these are confirmed before any pilot recommendation.</p>
          <ul>
            {sampleReportAssumptions.map((assumption) => (
              <li key={assumption.label}><strong>{assumption.label}:</strong> {assumption.value}</li>
            ))}
          </ul>
        </ReportBlock>

        <TableBlock
          title="3. Top Leaks, First Actions, Proof Notes"
          headers={["Rank", "Leak", "Evidence", "Impact", "First action", "Proof note"]}
          rows={sampleReportTopLeaks.map((leak) => [
            leak.rank,
            leak.title,
            leak.evidence,
            leak.estimatedImpact,
            leak.firstAction,
            leak.proofNote
          ])}
        />

        <TableBlock
          title="4. Leakage Breakdown"
          headers={["Leak bucket", "Estimate", "Assumption note"]}
          rows={sampleReportLeakageBreakdown.map((row) => [row.label, row.amount, row.note])}
        />

        <TableBlock
          title="5. Ranked Next Actions"
          headers={["Rank", "Action", "Owner", "What happens"]}
          rows={sampleReportRankedActions.map((action) => [action.rank, action.title, action.owner, action.action])}
        />

        <ReportBlock title="6. Profit Audit Artifact Includes">
          <ul>
            {sampleReportPaidArtifactIncludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ReportBlock>

        <ReportBlock title="7. Proof And Trust Notes">
          <ul>
            {sampleReportProofNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </ReportBlock>

        <ReportBlock title="8. What This Sample Does Not Claim">
          <p>This is a fictional {sampleReportSeller.category} sample. It is not a real seller result, not a verified savings report, and not a customer case study.</p>
          <p>It does not include live WhatsApp sending, courier API pushes, Shopify/WooCommerce sync, customer-level PII, ML prediction, or guaranteed ROI.</p>
        </ReportBlock>
      </section>

      <section className="report-cta">
        <div>
          <h2>Ready for a profit audit of your own COD/RTO/NDR leakage?</h2>
          <p>Start with summary numbers. Move to anonymized CSV only when the privacy boundary is clear, then consider a rescue pilot only if the audit finds a repeatable action queue.</p>
        </div>
        <div className="hero-actions">
          {sampleReportCtaLadder.map((cta) => (
            <Link key={cta.href} className={cta.style === "primary" ? "button" : "button secondary"} href={cta.href} title={cta.note}>
              {cta.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel metric">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function ReportBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="panel report-block">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function TableBlock({ title, headers, rows }: { title: string; headers: string[]; rows: readonly (readonly unknown[])[] }) {
  return (
    <div className="panel report-block wide">
      <h2>{title}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{String(cell)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
