import type { ReactNode } from "react";
import { maskPhone } from "@/lib/privacy";
import type { Role, RiskBucket } from "@/types/domain";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";
type Priority = "Low" | "Medium" | "High" | "Critical";
type Status = "Open" | "Queued" | "Done" | "Delivered" | "RTO" | "Cancelled" | "Waiting" | "Urgent";
type Confidence = "High" | "Medium" | "Low";

function toneClass(tone: Tone = "neutral") {
  return `tone-${tone}`;
}

export function MetricCard({
  title,
  value,
  delta,
  description,
  icon,
  tone = "neutral",
  trend,
  onClick
}: {
  title: string;
  value: ReactNode;
  delta?: string;
  description?: string;
  icon?: ReactNode;
  tone?: Tone;
  trend?: "up" | "down" | "flat";
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="metric-card__top">
        <span>{title}</span>
        {icon ? <span className="metric-card__icon">{icon}</span> : null}
      </div>
      <div className="metric-card__value">{value}</div>
      {(delta || description) && (
        <div className="metric-card__meta">
          {delta ? <strong className={trend ? `trend-${trend}` : ""}>{delta}</strong> : null}
          {description ? <span>{description}</span> : null}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button className={`metric-card metric-card--button ${toneClass(tone)}`} onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return <div className={`metric-card ${toneClass(tone)}`}>{content}</div>;
}

export function InsightCard({
  title,
  insight,
  recommendation,
  confidence,
  impact,
  actionLabel,
  onAction
}: {
  title: string;
  insight: string;
  recommendation: string;
  confidence?: Confidence;
  impact?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="insight-card">
      <div className="split">
        <h2>{title}</h2>
        {confidence ? <ConfidenceBadge value={confidence} /> : null}
      </div>
      <p className="insight-card__text">{insight}</p>
      <div className="recommendation-strip">
        <strong>Recommended next move</strong>
        <span>{recommendation}</span>
      </div>
      <div className="split">
        {impact ? <span className="impact-pill">{impact}</span> : <span />}
        {actionLabel ? (
          <button className="button secondary" onClick={onAction} type="button">
            {actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function ActionCard({
  title,
  orderId,
  priority,
  reason,
  estimatedSaving,
  primaryAction,
  secondaryAction,
  status,
  onPrimary,
  onSecondary,
  children
}: {
  title: string;
  orderId?: string;
  priority: Priority;
  reason: string;
  estimatedSaving?: ReactNode;
  primaryAction?: string;
  secondaryAction?: string;
  status?: Status;
  onPrimary?: () => void;
  onSecondary?: () => void;
  children?: ReactNode;
}) {
  return (
    <article className="action-card">
      <div className="split">
        <div>
          <h3>{title}</h3>
          {orderId ? <div className="muted">{orderId}</div> : null}
        </div>
        <div className="badge-stack">
          <PriorityBadge value={priority} />
          {status ? <StatusBadge value={status} /> : null}
        </div>
      </div>
      <p>{reason}</p>
      {estimatedSaving ? <div className="impact-pill">Estimated impact: {estimatedSaving}</div> : null}
      {children}
      {(primaryAction || secondaryAction) && (
        <div className="toolbar tight">
          {primaryAction ? (
            <button className="button" onClick={onPrimary} type="button">
              {primaryAction}
            </button>
          ) : null}
          {secondaryAction ? (
            <button className="button secondary" onClick={onSecondary} type="button">
              {secondaryAction}
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
}

export function RiskBadge({ value }: { value: RiskBucket | string }) {
  return <span className={`badge ${String(value).toLowerCase()}`}>{value}</span>;
}

export function PriorityBadge({ value }: { value: Priority | string }) {
  return <span className={`badge priority-${String(value).toLowerCase()}`}>{value}</span>;
}

export function StatusBadge({ value }: { value: Status | string }) {
  return <span className={`badge status-${String(value).toLowerCase().replace(/\s+/g, "-")}`}>{value}</span>;
}

export function ConfidenceBadge({ value }: { value: Confidence | string }) {
  return <span className={`badge confidence-${String(value).toLowerCase()}`}>{value} confidence</span>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="toolbar tight">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="toolbar tight">{actions}</div> : null}
    </div>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function DataQualityBadge({ score }: { score?: number }) {
  const value = Number(score || 0);
  const label = value >= 85 ? "Strong" : value >= 65 ? "Usable" : value >= 40 ? "Limited" : "Sparse";
  const tone = value >= 85 ? "low" : value >= 65 ? "medium" : value >= 40 ? "high" : "critical";
  return <span className={`badge ${tone}`}>Data quality {value}/100 · {label}</span>;
}

export function MoneyValue({ value }: { value: number }) {
  return <>{`₹${Math.round(value).toLocaleString("en-IN")}`}</>;
}

export function PercentValue({ value }: { value: number }) {
  return <>{`${Math.round(value * 1000) / 10}%`}</>;
}

export function PhoneMasked({ phone, role }: { phone?: string; role: Role }) {
  return <>{maskPhone(phone || "", role)}</>;
}

export function RecommendationPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="recommendation-panel">
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  );
}

export function Timeline({ items }: { items: Array<{ id: string; label: string; createdAt?: string }> }) {
  return (
    <div className="timeline">
      {items.length ? (
        items.map((item) => (
          <div className="timeline__item" key={item.id}>
            <span />
            <div>
              <strong>{item.label}</strong>
              {item.createdAt ? <small>{new Date(item.createdAt).toLocaleString()}</small> : null}
            </div>
          </div>
        ))
      ) : (
        <EmptyState title="No timeline yet" description="Actions, messages, and responses will appear here." />
      )}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>;
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <input aria-label={placeholder} className="input search-input" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />;
}

export function DateRangeSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select aria-label="Date range" className="select compact-select" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="7d">Last 7 days</option>
      <option value="14d">Last 14 days</option>
      <option value="30d">Last 30 days</option>
      <option value="month">This month</option>
    </select>
  );
}

export function ExportButton({ label = "Export", onClick }: { label?: string; onClick?: () => void }) {
  return (
    <button className="button secondary" onClick={onClick} type="button">
      {label}
    </button>
  );
}

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button className="button secondary" onClick={() => window.print()} type="button">
      {label}
    </button>
  );
}

export function DemoModeBanner({ children }: { children?: ReactNode }) {
  return (
    <div className="demo-banner">
      <strong>Demo data is fictional and for local testing.</strong>
      {children ? <span>{children}</span> : null}
    </div>
  );
}

export function UpgradeGate({ title, description }: { title: string; description: string }) {
  return (
    <div className="upgrade-gate">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function DrawerDetailLayout({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <aside className="drawer-detail">
      <div className="drawer-detail__header">
        <h2>{title}</h2>
        {meta ? <div>{meta}</div> : null}
      </div>
      {children}
    </aside>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="loading-skeleton">
      <span />
      <span />
      <span />
    </div>
  );
}
