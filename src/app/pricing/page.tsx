import Link from "next/link";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import { planConfigs, type PlanId } from "@/features/plans";

const pricingOrder: PlanId[] = ["free", "audit", "pilot", "starter", "growth", "pro"];

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
  const plans = pricingOrder.map((id) => planConfigs[id]);

  return (
    <MarketingPage>
      <section className="pricing-hero">
        <img className="product-hero__bg" src="/media/dashboard-control-room.png" alt="Wembro dashboard interface" />
        <span className="eyebrow">Pricing</span>
        <h1>Pay for the level of help you actually need.</h1>
        <p>Start free. Move up only when the numbers prove it.</p>
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
