"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import {
  benefitCards,
  featureCards,
  glossaryTerms,
  personaPages,
  recoverySteps,
  representativeProof,
  serviceLedOffers,
  serviceModules,
  trustSignals
} from "@/features/marketing";

const sellerSegments = ["Fashion", "Beauty", "Wellness", "Footwear", "Accessories"];

function formatInr(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function BenefitIcon({ title }: { title: string }) {
  let icon = (
    <>
      <path d="M4 17l5-5 4 4 7-8" />
      <path d="M15 8h5v5" />
    </>
  );

  if (title.includes("RTO")) {
    icon = (
      <>
        <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-5" />
      </>
    );
  } else if (title.includes("NDR")) {
    icon = (
      <>
        <path d="M12 21s6-5.4 6-11a6 6 0 0 0-12 0c0 5.6 6 11 6 11z" />
        <path d="M9.5 10.2h5" />
        <path d="M12 7.8v5" />
      </>
    );
  } else if (title.includes("Clear answers")) {
    icon = (
      <>
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="M15 15l5 5" />
        <path d="M8 11.5l1.6 1.6 3.4-4.2" />
      </>
    );
  }

  return (
    <span className="benefit-icon" aria-hidden>
      <svg viewBox="0 0 24 24" focusable="false">
        {icon}
      </svg>
    </span>
  );
}

export default function HomePage() {
  const [activeModuleId, setActiveModuleId] = useState(serviceModules[0].id);
  const activeModule = useMemo(() => serviceModules.find((module) => module.id === activeModuleId) || serviceModules[0], [activeModuleId]);

  return (
    <MarketingPage tone="dark">
      <section className="saas-hero">
        <div className="hero-signal-grid" aria-hidden />
        <div className="hero-orbit" aria-hidden />
        <div className="saas-hero__content">
          <span className="eyebrow">AI Operations OS for ecommerce sellers</span>
          <h1>
            Connect your business.
            <span> Let Wembro run the non-physical work.</span>
          </h1>
          <p>Wembro is being rebuilt around the real operating loop: detect leakage, decide the next action, create execution work, record proof, and learn from outcomes across every seller workflow.</p>
          <div className="saas-actions">
            <Link className="button" href="/onboarding">Connect business</Link>
            <Link className="button secondary play-cta" href="/automation-coverage">See automation truth <span aria-hidden /></Link>
          </div>
          <div className="hero-trust-row" aria-label="Trust indicators">
            <div className="avatar-stack" aria-hidden>
              <span>A</span><span>N</span><span>R</span><span>S</span><strong>+28</strong>
            </div>
            <p>Dashboard visibility is only the control room. Every capability now shows whether it is missing, mock, local automation, AI decision, or execution-ready.</p>
          </div>
          <div className="segment-row" aria-label="Seller segments">
            <small>Trusted by</small>
            {sellerSegments.map((segment) => <span key={segment}>{segment}</span>)}
          </div>
        </div>

        <HeroDashboardMock />
      </section>

      <section className="glossary-strip" aria-label="Quick definitions">
        <div className="glossary-strip__intro">
          <span className="eyebrow">First — the words we use</span>
          <p>Plain English, no jargon. Hover any term across the site to see its definition again.</p>
        </div>
        <div className="glossary-strip__chips">
          {glossaryTerms.map((entry) => (
            <article className="glossary-chip" key={entry.term}>
              <header>
                <strong>{entry.term}</strong>
                <em>{entry.short}</em>
              </header>
              <p>{entry.long}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="benefit-strip" aria-label="Primary benefits">
        {benefitCards.map((card) => (
          <article className={`benefit-card accent-${card.accent}`} key={card.title}>
            <BenefitIcon title={card.title} />
            <div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <small>{card.metric}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="saas-section saas-explain">
        <div className="saas-section-heading center">
          <span className="eyebrow">How it works</span>
          <h2>Three simple moves. One profit-recovery rhythm.</h2>
        </div>
        <div className="step-flow">
          {recoverySteps.slice(0, 3).map((step, index) => (
            <article className="step-node" key={step.label}>
              <div className="step-illustration"><span>{step.label}</span></div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              {index < 2 ? <i aria-hidden /> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="saas-section feature-command">
        <div className="saas-section-heading center">
          <span className="eyebrow">AI Operations OS modules</span>
          <h2>Detect, decide, act, and learn across the seller business.</h2>
        </div>
        <div className="feature-grid">
          {featureCards.map((feature) => (
            <article className={`feature-card accent-${feature.accent}`} key={feature.title}>
              <span className="feature-icon" aria-hidden />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <ul>
                {feature.bullets.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <Link href="/automation-coverage">Explore automation status →</Link>
            </article>
          ))}
        </div>
      </section>

      <HomeRoiEstimator />

      <section className="saas-section module-story" id="product">
        <div className="saas-section-heading">
          <span className="eyebrow">Modules built around outcomes</span>
          <h2>Start with proof. Scale into a daily operating room.</h2>
          <p>Every module exists to remove a specific manual job. You see the next layer only when it has evidence, exceptions, approvals, or proof.</p>
        </div>
        <div className="module-console">
          <div className="module-rail" aria-label="Service modules">
            {serviceModules.map((module) => (
              <button className={module.id === activeModule.id ? "active" : ""} key={module.id} onClick={() => setActiveModuleId(module.id)}>
                <span>{module.name}</span>
                <small>{module.outcome}</small>
              </button>
            ))}
          </div>
          <article className="module-detail">
            <span className="eyebrow">Selected module</span>
            <h3>{activeModule.name}</h3>
            <div className="module-detail__grid">
              <div>
                <small>The problem</small>
                <p>{activeModule.problem}</p>
              </div>
              <div>
                <small>What you get</small>
                <p>{activeModule.outcome}</p>
              </div>
              <div>
                <small>The proof</small>
                <p>{activeModule.proof}</p>
              </div>
            </div>
            <Link className="button" href={activeModule.route}>Open {activeModule.name}</Link>
          </article>
        </div>
      </section>

      <section className="saas-section service-led-band">
        <div className="saas-section-heading">
          <span className="eyebrow">Service-led for early customers</span>
          <h2>For the first 20-50 customers, we work like a rescue team.</h2>
          <p>Do not start by buying pure SaaS. Start with a concrete leakage check, a paid audit, a 14-day rescue pilot, and a monthly recovery plan only after the ROI is visible.</p>
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

      <DashboardPreview />

      <section className="saas-section persona-preview">
        <div className="saas-section-heading">
          <span className="eyebrow">Built for every role</span>
          <h2>Same problem. Three different views.</h2>
          <p>Founders, operators, and growth leads each see the page that matches their decision.</p>
        </div>
        <div className="persona-card-grid">
          {personaPages.map((persona) => (
            <Link className="persona-card" href={`/personas/${persona.slug}`} key={persona.slug}>
              <span className="eyebrow">{persona.eyebrow}</span>
              <h3>{persona.name}</h3>
              <p>{persona.headline}</p>
              <strong>{persona.proofMetric}</strong>
              <small>{persona.proofLabel}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="saas-section trust-section">
        <div className="saas-section-heading">
          <span className="eyebrow">Trust by design</span>
          <h2>Useful. Transparent. Focused.</h2>
          <p>No invented complexity. No black-box savings claims. No pretending a mock is full automation.</p>
        </div>
        <div className="trust-grid">
          <div className="trust-stack">
            {trustSignals.map((signal) => (
              <div className="trust-signal" key={signal}>
                <span />
                <p>{signal}</p>
              </div>
            ))}
          </div>
          <div className="proof-story" aria-label="Representative pilot story">
            <span className="eyebrow">A typical pilot, in three frames</span>
            {representativeProof.map((item) => (
              <article key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="saas-section conversion-band">
        <span className="cta-shield" aria-hidden>W</span>
        <div>
          <span className="eyebrow">Ready to see your real loss?</span>
          <h2>Start by connecting the business. Wembro shows what it can automate and what is still manual.</h2>
          <p>Five-minute setup, then an exception-first operating room: approvals, failures, proof, and uncovered manual work.</p>
        </div>
        <div className="saas-actions">
          <Link className="button secondary" href="/automation-coverage">See coverage</Link>
          <Link className="button" href="/onboarding">Connect business</Link>
        </div>
      </section>
    </MarketingPage>
  );
}

function HeroDashboardMock() {
  const drivers = [
    { label: "Risky cash orders", value: "₹4.5L", width: 84 },
    { label: "Fake / invalid orders", value: "₹3.2L", width: 62 },
    { label: "Wrong address / pincode", value: "₹2.1L", width: 45 },
    { label: "Customer unreachable", value: "₹1.7L", width: 36 }
  ];

  return (
    <div className="hero-dashboard-scene" aria-label="Wembro dashboard preview">
      <div className="mock-dashboard">
        <div className="scan-beam" aria-hidden />
        <aside>
          <strong>Wembro</strong>
          {["Daily Briefing", "Priority Queue", "Leakage Map", "NDR Rescue", "Savings Ledger"].map((item, index) => (
            <span className={index === 0 ? "active" : ""} key={item}>{item}</span>
          ))}
          <small>Updated 5m ago</small>
        </aside>
        <main>
          <div className="mock-topbar">
            <div>
              <span>Daily Briefing</span>
              <strong>Good morning. Here's where to recover today.</strong>
            </div>
            <em>Data quality 96/100</em>
          </div>
          <div className="mock-kpi-grid">
            <div className="mock-kpi main-kpi">
              <span>Money you can save this month</span>
              <strong>₹14,27,500</strong>
              <small>+12.6% vs last 30 days</small>
            </div>
            <div className="mock-kpi">
              <span>Critical actions</span>
              <strong>1</strong>
              <small>Needs attention</small>
            </div>
            <div className="mock-kpi">
              <span>Rescues near deadline</span>
              <strong>4</strong>
              <small>Act within 2h</small>
            </div>
          </div>
          <div className="mock-chart-row">
            <div className="spark-chart" aria-hidden>
              <span style={{ height: "42%" }} />
              <span style={{ height: "64%" }} />
              <span style={{ height: "48%" }} />
              <span style={{ height: "78%" }} />
              <span style={{ height: "70%" }} />
              <span style={{ height: "92%" }} />
            </div>
            <div className="driver-list">
              <strong>Where money is leaking</strong>
              {drivers.map((driver) => (
                <div className="driver-row" key={driver.label}>
                  <span>{driver.label}</span>
                  <i><b style={{ width: `${driver.width}%` }} /></i>
                  <em>{driver.value}</em>
                </div>
              ))}
            </div>
          </div>
          <div className="mock-actions">
            {["Open queue", "Run analysis", "Review rescues", "Message team"].map((action) => <button key={action}>{action}</button>)}
          </div>
        </main>
      </div>
    </div>
  );
}

function HomeRoiEstimator() {
  const [orders, setOrders] = useState(50000);
  const [aov, setAov] = useState(799);
  const [rtoRate, setRtoRate] = useState(18);
  const [ndrRate, setNdrRate] = useState(8);
  const rtoLossPerOrder = 395;
  const monthlyRtoOrders = Math.round(orders * (rtoRate / 100));
  const monthlyLeakage = monthlyRtoOrders * rtoLossPerOrder;
  const ndrLeakage = Math.round(orders * (ndrRate / 100) * rtoLossPerOrder * 0.42);
  const potentialAnnualSavings = Math.round((monthlyLeakage + ndrLeakage) * 12 * 0.28);
  const roi = Math.max(1, potentialAnnualSavings / (50000 * 12));

  return (
    <section className="roi-preview" aria-label="Profit recovery savings preview">
      <div>
        <span className="eyebrow">Real impact. Real numbers.</span>
        <h2>How much could you save?</h2>
        <p>Move the sliders. We'll show you the size of the leak — using transparent assumptions you can audit.</p>
        <div className="roi-input-grid">
          <label>
            <span>Orders / month</span>
            <input type="number" min="100" value={orders} onChange={(event) => setOrders(Number(event.target.value || 0))} />
          </label>
          <label>
            <span>Average order value (₹)</span>
            <input type="number" min="1" value={aov} onChange={(event) => setAov(Number(event.target.value || 0))} />
          </label>
          <label>
            <span>Return rate (%)</span>
            <input type="number" min="0" max="100" value={rtoRate} onChange={(event) => setRtoRate(Number(event.target.value || 0))} />
          </label>
          <label>
            <span>Failed-delivery rate (%)</span>
            <input type="number" min="0" max="100" value={ndrRate} onChange={(event) => setNdrRate(Number(event.target.value || 0))} />
          </label>
        </div>
      </div>
      <div className="roi-output-grid">
        <div>
          <span>Could save in a year</span>
          <strong>{formatInr(potentialAnnualSavings)}</strong>
        </div>
        <div>
          <span>Monthly return loss</span>
          <strong>{formatInr(monthlyLeakage)}</strong>
        </div>
        <div>
          <span>Failed-delivery savings</span>
          <strong>{formatInr(ndrLeakage)}</strong>
        </div>
        <div>
          <span>Estimated return</span>
          <strong>{roi.toFixed(1)}x</strong>
        </div>
      </div>
    </section>
  );
}
