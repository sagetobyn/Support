"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import {
  benefitCards,
  featureCards,
  personaPages,
  recoverySteps,
  representativeProof,
  serviceModules,
  trustSignals
} from "@/features/marketing";

const sellerSegments = ["Fashion", "Beauty", "Wellness", "Footwear", "Accessories"];

function formatInr(value: number) {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
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
  } else if (title.includes("insights")) {
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
          <span className="eyebrow">RTOShield for D2C and ecommerce brands</span>
          <h1>
            Recover profit after checkout.
            <span> Stop COD, RTO and NDR leakage.</span>
          </h1>
          <p>RTOShield detects leakage, prioritizes the right actions, and helps sellers recover more every day.</p>
          <div className="saas-actions">
            <Link className="button" href="/calculator">Book a demo</Link>
            <Link className="button secondary play-cta" href="/product">See how it works <span aria-hidden /></Link>
          </div>
          <div className="hero-trust-row" aria-label="Trust indicators">
            <div className="avatar-stack" aria-hidden>
              <span>A</span><span>N</span><span>R</span><span>S</span><strong>+28</strong>
            </div>
            <p>Built for teams that need calm COD, NDR and RTO recovery without ERP clutter.</p>
          </div>
          <div className="segment-row" aria-label="Seller segments">
            <small>Designed for</small>
            {sellerSegments.map((segment) => <span key={segment}>{segment}</span>)}
          </div>
        </div>

        <HeroDashboardMock />
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
          <h2>Three simple moves. One profit recovery rhythm.</h2>
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
          <span className="eyebrow">Everything you need</span>
          <h2>Stop leakage and recover more without overwhelming the team.</h2>
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
              <Link href="/dashboard">Explore -&gt;</Link>
            </article>
          ))}
        </div>
      </section>

      <HomeRoiEstimator />

      <section className="saas-section module-story" id="product">
        <div className="saas-section-heading">
          <span className="eyebrow">Modular services</span>
          <h2>Start with proof, then move toward a daily operating room.</h2>
          <p>Each module exists because a seller has a specific business problem. The interface reveals the next layer only when the seller needs it.</p>
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
                <small>Business problem</small>
                <p>{activeModule.problem}</p>
              </div>
              <div>
                <small>Seller outcome</small>
                <p>{activeModule.outcome}</p>
              </div>
              <div>
                <small>Proof layer</small>
                <p>{activeModule.proof}</p>
              </div>
            </div>
            <Link className="button" href={activeModule.route}>Open {activeModule.name}</Link>
          </article>
        </div>
      </section>

      <DashboardPreview />

      <section className="saas-section persona-preview">
        <div className="saas-section-heading">
          <span className="eyebrow">Persona flows</span>
          <h2>Different teams see the same profit problem from different angles.</h2>
          <p>The website routes each client type toward the page that matches their pain, decision, and next action.</p>
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
          <h2>Premium because the system is useful, transparent, and focused.</h2>
          <p>No invented complexity. No ERP sprawl. No black-box savings claims. The product is built around profit recovery that a seller can understand and verify.</p>
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
            <span className="eyebrow">Representative pilot story</span>
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
        <span className="cta-shield" aria-hidden>SW</span>
        <div>
          <span className="eyebrow">Ready to recover more profit?</span>
          <h2>See leakage first. Commit to the workflow only when the numbers make sense.</h2>
          <p>Start with a privacy-safe calculator, move into an audit, then run a 14-day pilot before adopting the full operating room.</p>
        </div>
        <div className="saas-actions">
          <Link className="button secondary" href="/dashboard">See dashboard</Link>
          <Link className="button" href="/calculator">Book a demo</Link>
        </div>
      </section>
    </MarketingPage>
  );
}

function HeroDashboardMock() {
  const drivers = [
    { label: "COD Risk", value: "Rs 4.5L", width: 84 },
    { label: "Fake / invalid orders", value: "Rs 3.2L", width: 62 },
    { label: "Address / pincode issues", value: "Rs 2.1L", width: 45 },
    { label: "Customer unreachable", value: "Rs 1.7L", width: 36 }
  ];

  return (
    <div className="hero-dashboard-scene" aria-label="RTOShield dashboard preview">
      <div className="mock-dashboard">
        <div className="scan-beam" aria-hidden />
        <aside>
          <strong>RTOShield</strong>
          {["Daily Briefing", "Priority Work Queue", "Leakage Analysis", "NDR Management", "Savings Ledger"].map((item, index) => (
            <span className={index === 0 ? "active" : ""} key={item}>{item}</span>
          ))}
          <small>Data updated 5m ago</small>
        </aside>
        <main>
          <div className="mock-topbar">
            <div>
              <span>Daily Briefing</span>
              <strong>Good morning. Recover profit after checkout today.</strong>
            </div>
            <em>Data quality 96/100</em>
          </div>
          <div className="mock-kpi-grid">
            <div className="mock-kpi main-kpi">
              <span>Recoverable revenue</span>
              <strong>Rs 14,27,500</strong>
              <small>+12.6% vs last 30 days</small>
            </div>
            <div className="mock-kpi">
              <span>Critical actions</span>
              <strong>1</strong>
              <small>Needs attention</small>
            </div>
            <div className="mock-kpi">
              <span>NDRs near SLA</span>
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
              <strong>Top leakage drivers</strong>
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
            {["Open queue", "Run analysis", "Review NDR", "Message team"].map((action) => <button key={action}>{action}</button>)}
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
        <span className="eyebrow">Real impact. Measurable ROI.</span>
        <h2>Turn savings into profit.</h2>
        <p>See how much a seller could protect when COD, NDR and RTO work is prioritized daily. This is directional and uses transparent assumptions.</p>
        <div className="roi-input-grid">
          <label>
            <span>Orders / month</span>
            <input type="number" min="100" value={orders} onChange={(event) => setOrders(Number(event.target.value || 0))} />
          </label>
          <label>
            <span>AOV</span>
            <input type="number" min="1" value={aov} onChange={(event) => setAov(Number(event.target.value || 0))} />
          </label>
          <label>
            <span>RTO rate (%)</span>
            <input type="number" min="0" max="100" value={rtoRate} onChange={(event) => setRtoRate(Number(event.target.value || 0))} />
          </label>
          <label>
            <span>NDR rate (%)</span>
            <input type="number" min="0" max="100" value={ndrRate} onChange={(event) => setNdrRate(Number(event.target.value || 0))} />
          </label>
        </div>
      </div>
      <div className="roi-output-grid">
        <div>
          <span>Potential annual savings</span>
          <strong>{formatInr(potentialAnnualSavings)}</strong>
        </div>
        <div>
          <span>Monthly RTO leakage</span>
          <strong>{formatInr(monthlyLeakage)}</strong>
        </div>
        <div>
          <span>NDR savings pool</span>
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
