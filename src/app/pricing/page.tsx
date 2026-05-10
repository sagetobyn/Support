import Link from "next/link";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import { serviceLedOffers } from "@/features/marketing";
import { planConfigs, type PlanId } from "@/features/plans";

const monthlyPlanOrder: PlanId[] = ["starter", "growth", "pro"];

function money(value: number) {
  if (!value) return "Free";
  return `₹${value.toLocaleString("en-IN")} / month`;
}

function planCta(id: PlanId) {
  if (id === "free") return { label: "Run free check", href: "/calculator" };
  if (id === "audit") return { label: "Start audit", href: "/audit" };
  if (id === "pilot") return { label: "Plan a pilot", href: "/pilot" };
  return { label: "Preview dashboard", href: "/dashboard" };
}

export default function PricingPage() {
  const monthlyPlans = monthlyPlanOrder.map((id) => planConfigs[id]);

  return (
    <MarketingPage>
      <section className="pricing-hero">
        <img className="product-hero__bg" src="/media/dashboard-control-room.png" alt="Wembro dashboard interface" />
        <div className="pricing-hero__content">
          <span className="eyebrow">Pricing</span>
          <h1>Start service-led. Stay only when the recovery is real.</h1>
          <p>For early customers, Wembro is packaged like a rescue team first and SaaS second: check, audit, pilot, monthly recovery plan, then software plus operator workflow.</p>
        </div>
      </section>

      <section className="saas-section service-pricing">
        <div className="saas-section-heading">
          <span className="eyebrow">First 20-50 customers</span>
          <h2>Buy proof before you buy a platform.</h2>
          <p>Each step has a clear artifact, a clear owner, and a clear reason to move forward.</p>
        </div>
        <div className="service-led-grid">
          {serviceLedOffers.map((offer) => (
            <article className="service-led-card" key={offer.id}>
              <div>
                <span>{offer.stage}</span>
                <strong>{offer.priceLabel}</strong>
              </div>
              <h3>{offer.name}</h3>
              <p>{offer.buyerPromise}</p>
              <dl>
                <dt>What we do</dt>
                <dd>{offer.teamDoes}</dd>
                <dt>Proof</dt>
                <dd>{offer.proofArtifact}</dd>
              </dl>
              <Link className="button secondary" href={offer.route}>{offer.ctaLabel}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="saas-section">
        <div className="saas-section-heading">
          <span className="eyebrow">Monthly recovery plans</span>
          <h2>After the pilot, keep the operating rhythm.</h2>
          <p>Starter, Growth, and Pro are monthly recovery systems for sellers who have already seen the leakage and want the daily workflow to continue.</p>
        </div>
      </section>
      <section className="pricing-grid">
        {monthlyPlans.map((plan) => {
          const cta = planCta(plan.id);
          const featured = plan.id === "growth" || plan.id === "pro";
          return (
            <article className={`pricing-card ${featured ? "featured" : ""}`} key={plan.id}>
              <div>
                <div className="split">
                  <h2>{plan.name}</h2>
                  {featured ? <span className="badge neutral">Recommended</span> : null}
                </div>
                <strong className="pricing-card__price">{money(plan.priceMonthlyInr)}</strong>
                <p>{plan.primaryOutcome}</p>
              </div>
              <div className="pricing-card__value">{plan.valuePromise}</div>
              <div className="pricing-feature-list">
                {(plan.unlockedModules || []).slice(0, 5).map((item) => <span key={item}>{item}</span>)}
              </div>
              <Link className={featured ? "button" : "button secondary"} href={cta.href}>{cta.label}</Link>
            </article>
          );
        })}
      </section>

      <section className="saas-section pricing-guidance">
        <div className="saas-panel">
          <span className="eyebrow">How to choose</span>
          <h2>Don't buy the biggest plan first.</h2>
          <p>If you don't know your loss, start Free. If the loss is clear but the team habit isn't, run a Pilot. Pick Growth or Pro only when daily recovery is a real workflow.</p>
        </div>
        <div className="saas-panel">
          <span className="eyebrow">What you're paying for</span>
          <h2>Speed, clarity, and proof.</h2>
          <p>You're buying focus for your operators, decisions for your founder, and a savings ledger you can audit. No black boxes.</p>
        </div>
      </section>
    </MarketingPage>
  );
}
