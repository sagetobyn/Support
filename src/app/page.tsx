"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import { personaPages, recoverySteps, representativeProof, serviceModules, trustSignals } from "@/features/marketing";

export default function HomePage() {
  const [activeModuleId, setActiveModuleId] = useState(serviceModules[0].id);
  const activeModule = useMemo(() => serviceModules.find((module) => module.id === activeModuleId) || serviceModules[0], [activeModuleId]);

  return (
    <MarketingPage>
      <section className="saas-hero">
        <img className="saas-hero__image" src="/media/dashboard-control-room.png" alt="RTOShield profit recovery dashboard" />
        <div className="saas-hero__content">
          <span className="eyebrow">RTOShield by SupportWaala</span>
          <h1>RTOShield</h1>
          <p>Recover profit after checkout by preventing COD, NDR, and RTO leakage.</p>
          <div className="saas-actions">
            <Link className="button" href="/calculator">Check leakage free</Link>
            <Link className="button secondary" href="/dashboard">Open dashboard</Link>
          </div>
        </div>
        <div className="saas-hero__brief">
          <span>Daily operating question</span>
          <strong>What money is leaking, why, and what should the team do today?</strong>
        </div>
      </section>

      <section className="saas-section saas-explain">
        <div className="saas-section-heading">
          <span className="eyebrow">Understand in 30 seconds</span>
          <h2>A profit recovery system, not another ecommerce dashboard.</h2>
          <p>RTOShield organizes the journey from awareness to proof: measure the leak, prioritize the rescue work, act inside the courier window, and show verified value.</p>
        </div>
        <div className="recovery-loop">
          {recoverySteps.map((step) => (
            <article className="recovery-step" key={step.label}>
              <span>{step.label}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="saas-section module-story" id="product">
        <div className="saas-section-heading">
          <span className="eyebrow">Modular services</span>
          <h2>Start small, then move toward a daily operating room.</h2>
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
        <div>
          <span className="eyebrow">Next best step</span>
          <h2>See the leakage first. Commit to the workflow only when the numbers make sense.</h2>
          <p>Start with a privacy-safe calculator, move into an audit, then run a 14-day pilot before adopting the full operating room.</p>
        </div>
        <div className="saas-actions">
          <Link className="button" href="/calculator">Run free check</Link>
          <Link className="button secondary" href="/pricing">Compare plans</Link>
        </div>
      </section>
    </MarketingPage>
  );
}
