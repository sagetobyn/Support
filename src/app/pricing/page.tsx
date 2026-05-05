import Link from "next/link";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import { planConfigs, type PlanId } from "@/features/plans";

const pricingOrder: PlanId[] = ["free", "audit", "pilot", "starter", "growth", "pro"];

function money(value: number) {
  if (!value) return "Free";
  return `₹${value.toLocaleString("en-IN")}/month`;
}

function planCta(id: PlanId) {
  if (id === "free") return { label: "Run leakage check", href: "/calculator" };
  if (id === "audit") return { label: "Start audit", href: "/audit" };
  if (id === "pilot") return { label: "Create pilot", href: "/pilot" };
  return { label: "Preview dashboard", href: "/dashboard" };
}

export default function PricingPage() {
  const plans = pricingOrder.map((id) => planConfigs[id]);

  return (
    <MarketingPage>
      <section className="pricing-hero">
        <img className="product-hero__bg" src="/media/dashboard-control-room.png" alt="RTOShield dashboard interface" />
        <span className="eyebrow">Pricing</span>
        <h1>Pick the level of profit recovery you are ready to operate.</h1>
        <p>Pricing is organized by seller outcome: awareness, diagnosis, pilot execution, daily recovery, and founder-grade intelligence.</p>
      </section>

      <section className="pricing-grid">
        {plans.map((plan) => {
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
          <h2>Do not buy the biggest plan first.</h2>
          <p>Start where the seller has evidence. If leakage is unclear, use Free or Audit. If the problem is clear but the operating habit is not proven, run Pilot. Use Growth or Pro when recovery work becomes a daily management system.</p>
        </div>
        <div className="saas-panel">
          <span className="eyebrow">Premium value</span>
          <h2>What makes it worth paying for?</h2>
          <p>Speed, clarity, and proof. The product protects operator focus, shows founder-level decisions, and keeps savings transparent instead of hiding behind a generic automation promise.</p>
        </div>
      </section>
    </MarketingPage>
  );
}
