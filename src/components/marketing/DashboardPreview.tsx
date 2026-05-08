import Link from "next/link";
import { dashboardHighlights } from "@/features/marketing";

export function DashboardPreview({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`saas-dashboard-preview ${compact ? "compact" : ""}`}>
      <div className="saas-section-heading">
        <span className="eyebrow">Dashboard integration</span>
        <h2>Powerful enough for operators, calm enough for founders.</h2>
        <p>The dashboard leads with the money at risk and the action to take. Tables, rules, logs, and setup stay behind clear drill-downs.</p>
      </div>
      <div className="dashboard-preview-frame">
        <img src="/media/dashboard-control-room.png" alt="Wembro dashboard showing profit recovery briefing and operational controls" />
        <div className="dashboard-preview-panel" aria-label="Dashboard highlights">
          {dashboardHighlights.map((item) => (
            <div className="dashboard-preview-point" key={item}>
              <span />
              <p>{item}</p>
            </div>
          ))}
          <Link className="button" href="/dashboard">Open live dashboard</Link>
        </div>
      </div>
    </section>
  );
}
