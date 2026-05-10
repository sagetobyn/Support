import Link from "next/link";
import type { ReactNode } from "react";
import type {
  AgentDefinition,
  AutomationAction,
  CommerceGraphNode,
  DataQualityMetric,
  IngestionSource,
  MoneyMetric,
  RiskLevel
} from "../domain/types";

export const operationsRoutes = [
  { href: "/", label: "Website" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/data-ingestion", label: "Data Ingestion" },
  { href: "/data-brain", label: "Data Brain" },
  { href: "/ai-operations-engine", label: "AI Engine" },
  { href: "/automation", label: "Automation" },
  { href: "/alerts-reports", label: "Dashboard + Reports" },
  { href: "/settings", label: "Settings" },
  { href: "/model-control", label: "Model Control" },
  { href: "/marketing-automation", label: "Marketing" }
];

export function formatInr(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatCompact(value: number) {
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

export function OsShell({ active, children }: { active: string; children: ReactNode }) {
  return (
    <main className="os-page">
      <header className="os-topbar">
        <Link className="os-brand" href="/" aria-label="Wembro home">
          <span>W</span>
          <strong>
            Wembro
            <small>AI Operations OS</small>
          </strong>
        </Link>
        <nav className="os-topnav" aria-label="AI Operations OS navigation">
          <Link href="/product">Product</Link>
          <Link href="/data-ingestion">Integrations</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/alerts-reports">Reports</Link>
        </nav>
        <div className="os-topbar__actions">
          <Link className="os-button os-button--secondary" href="/login">Log in</Link>
          <Link className="os-button" href="/onboarding">Connect Marketplace</Link>
        </div>
      </header>
      <div className="os-shell">
        <aside className="os-sidebar">
          <div className="os-sidebar__eyebrow">AI Operations</div>
          <nav aria-label="Product layers">
            {operationsRoutes.map((route) => (
              <Link className={route.href === active ? "active" : ""} href={route.href} key={route.href}>
                {route.label}
              </Link>
            ))}
          </nav>
          <div className="os-status-card">
            <span>System Status</span>
            <strong>Healthy</strong>
            <small>{"Data -> Insight -> Decision -> Action -> Learning"}</small>
          </div>
        </aside>
        <section className="os-content">{children}</section>
      </div>
    </main>
  );
}

export function OsPageHeader({
  eyebrow,
  title,
  subtitle,
  actions
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="os-page-header">
      <div>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className="os-page-header__actions">{actions}</div> : null}
    </div>
  );
}

export function OsPanel({ title, eyebrow, children, action }: { title?: string; eyebrow?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="os-panel">
      {title || eyebrow || action ? (
        <header className="os-panel__header">
          <div>
            {eyebrow ? <span>{eyebrow}</span> : null}
            {title ? <h2>{title}</h2> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function OsMetricCard({ metric }: { metric: MoneyMetric }) {
  const isCountMetric = metric.id.includes("pending") || metric.id.includes("confidence");
  const value = metric.id.includes("confidence")
    ? `${(metric.value / 10).toFixed(1)}%`
    : isCountMetric
      ? metric.value.toLocaleString("en-IN")
      : formatInr(metric.value);

  return (
    <article className={`os-metric os-tone-${metric.tone}`}>
      <span>{metric.label}</span>
      <strong>{value}</strong>
      {metric.deltaLabel ? <small>{metric.deltaLabel}</small> : null}
    </article>
  );
}

export function OsStatusPill({ value }: { value: string }) {
  return <span className={`os-pill os-pill-${value.toLowerCase().replaceAll("_", "-")}`}>{value.replaceAll("_", " ")}</span>;
}

export function OsRiskPill({ value }: { value: RiskLevel }) {
  return <span className={`os-risk os-risk-${value}`}>{value}</span>;
}

export function OsSourceGrid({ sources }: { sources: IngestionSource[] }) {
  return (
    <div className="os-source-grid">
      {sources.map((source) => (
        <article className="os-source-card" key={source.id}>
          <div>
            <strong>{source.label}</strong>
            <OsStatusPill value={source.status} />
          </div>
          <p>{formatCompact(source.recordCount)} records</p>
          <small>Freshness: {source.freshnessLabel}</small>
        </article>
      ))}
    </div>
  );
}

export function OsQualityList({ metrics }: { metrics: DataQualityMetric[] }) {
  return (
    <div className="os-quality-list">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.score.toFixed(1)}%</strong>
          <p>{metric.description}</p>
        </div>
      ))}
    </div>
  );
}

export function OsCommerceGraph({ nodes }: { nodes: CommerceGraphNode[] }) {
  return (
    <div className="os-graph" aria-label="Unified commerce graph preview">
      <div className="os-graph__core">
        <strong>Seller Data Brain</strong>
        <small>Unified commerce graph</small>
      </div>
      {nodes.slice(0, 10).map((node, index) => (
        <article className={`os-graph__node node-${index + 1}`} key={node.id}>
          <strong>{node.label}</strong>
          <span>{formatCompact(node.count)}</span>
          <small>{node.confidence.toFixed(1)}% confidence</small>
        </article>
      ))}
    </div>
  );
}

export function OsAgentGrid({ agents }: { agents: AgentDefinition[] }) {
  return (
    <div className="os-agent-grid">
      {agents.map((agent) => (
        <article className="os-agent-card" key={agent.id}>
          <div>
            <h3>{agent.name}</h3>
            <OsStatusPill value={agent.status} />
          </div>
          <p>{agent.purpose}</p>
          <dl>
            <div>
              <dt>Impact 7d</dt>
              <dd>{formatInr(agent.sevenDayImpact)}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{agent.confidence}%</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

export function OsActionTable({ actions }: { actions: AutomationAction[] }) {
  return (
    <div className="os-table-wrap">
      <table className="os-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Impact</th>
            <th>Risk</th>
            <th>Confidence</th>
            <th>State</th>
            <th>Assignee</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((action) => (
            <tr key={action.id}>
              <td>
                <strong>{action.title}</strong>
                <small>{action.actionType}</small>
              </td>
              <td>{formatInr(action.impactAmount)}</td>
              <td><OsRiskPill value={action.riskLevel} /></td>
              <td>{action.confidence}%</td>
              <td><OsStatusPill value={action.state} /></td>
              <td>{action.assignee}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
