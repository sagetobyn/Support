import Link from "next/link";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import { recoverySteps, serviceModules } from "@/features/marketing";

export default function ProductPage() {
  return (
    <MarketingPage>
      <section className="product-hero">
        <img className="product-hero__bg" src="/media/dashboard-control-room.png" alt="RTOShield dashboard interface" />
        <div>
          <span className="eyebrow">Product overview</span>
          <h1>The operating system for post-checkout profit recovery.</h1>
          <p>RTOShield helps ecommerce sellers understand, prioritize, act, and prove value across COD risk, NDR rescue, address quality, courier lanes, SKUs, campaigns, and savings proof.</p>
          <div className="saas-actions">
            <Link className="button" href="/dashboard">Explore dashboard</Link>
            <Link className="button secondary" href="/audit">Start profit audit</Link>
          </div>
        </div>
      </section>

      <section className="saas-section">
        <div className="saas-section-heading">
          <span className="eyebrow">System map</span>
          <h2>Everything is organized by seller outcome.</h2>
          <p>The product is modular, but the experience stays coherent because every module answers a business question.</p>
        </div>
        <div className="product-module-grid">
          {serviceModules.map((module) => (
            <article className="product-module-card" key={module.id}>
              <span className="eyebrow">{module.name}</span>
              <h3>{module.outcome}</h3>
              <p>{module.problem}</p>
              <small>{module.proof}</small>
              <Link href={module.route}>Open module</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="saas-section">
        <div className="saas-section-heading">
          <span className="eyebrow">Workflow</span>
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
