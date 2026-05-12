import Link from "next/link";
import Image from "next/image";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { MarketingPage } from "@/components/marketing/MarketingChrome";
import type { PersonaContent } from "@/features/marketing";

export function PersonaPage({ persona }: { persona: PersonaContent }) {
  return (
    <MarketingPage>
      <section className="persona-hero">
        <Image
          className="product-hero__bg"
          src="/media/dashboard-control-room.png"
          alt="Wembro dashboard interface"
          fill
          priority
          sizes="100vw"
        />
        <div>
          <span className="eyebrow">{persona.eyebrow}</span>
          <h1>{persona.headline}</h1>
          <p>{persona.subhead}</p>
          <div className="saas-actions">
            <Link className="button" href={persona.primaryHref}>{persona.primaryCta}</Link>
            <Link className="button secondary" href={persona.secondaryHref}>{persona.secondaryCta}</Link>
          </div>
        </div>
        <aside className="persona-proof">
          <span>{persona.name}</span>
          <strong>{persona.proofMetric}</strong>
          <small>{persona.proofLabel}</small>
        </aside>
      </section>

      <section className="persona-grid">
        <div className="saas-panel">
          <span className="eyebrow">Where it hurts today</span>
          <h2>The problems we hear most</h2>
          <div className="saas-list">
            {persona.pains.map((pain) => <p key={pain}>{pain}</p>)}
          </div>
        </div>
        <div className="saas-panel">
          <span className="eyebrow">How Wembro helps</span>
          <h2>What you&apos;ll actually do</h2>
          <div className="saas-list">
            {persona.useCases.map((useCase) => <p key={useCase}>{useCase}</p>)}
          </div>
        </div>
      </section>

      <DashboardPreview compact />
    </MarketingPage>
  );
}
