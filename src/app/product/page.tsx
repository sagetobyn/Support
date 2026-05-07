import Link from "next/link";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import { recoverySteps, serviceModules } from "@/features/marketing";

export default function ProductPage() {
  return (
    <MarketingPage>
      <section className="product-hero">
        <img className="product-hero__bg" src="/media/dashboard-control-room.png" alt="Wembro dashboard interface" />
        <div>
          <span className="eyebrow">Product</span>
          <h1>One workspace for everything that happens after checkout.</h1>
          <p>Wembro turns scattered courier exports and spreadsheets into one calm operating room — with a clear next action and a savings ledger.</p>
          <div className="saas-actions">
            <Link className="button" href="/dashboard">See the dashboard</Link>
            <Link className="button secondary" href="/audit">Start a free audit</Link>
          </div>
        </div>
      </section>

      <section className="saas-section">
        <div className="saas-section-heading">
          <span className="eyebrow">Built around outcomes</span>
          <h2>Every module answers one question.</h2>
          <p>Modular by design — but the experience stays coherent because each piece exists for a reason.</p>
        </div>
        <div className="product-module-grid">
          {serviceModules.map((module) => (
            <article className="product-module-card" key={module.id}>
              <span className="eyebrow">{module.name}</span>
              <h3>{module.outcome}</h3>
              <p>{module.problem}</p>
              <small>{module.proof}</small>
              <Link href={module.route}>Open module →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="saas-section">
        <div className="saas-section-heading">
          <span className="eyebrow">The flow</span>
          <h2>From first estimate to founder decision.</h2>
        </div>
        <div className="product-timeline">
          {recoverySteps.map((step) => (
            <article key={step.label}>
              <span>{step.label}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <DashboardPreview compact />
    </MarketingPage>
  );
}
