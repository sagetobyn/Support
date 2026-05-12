import Link from "next/link";
import type { ReactNode } from "react";
import { isPublicLoginBypassEnabledForTesting } from "@/lib/auth/testing-bypass";

export function MarketingHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isLoginBypassed = isPublicLoginBypassEnabledForTesting();

  return (
    <header className={`saas-header ${variant === "dark" ? "saas-header--dark" : ""}`}>
      <Link className="saas-brand" href="/" aria-label="Wembro home">
        <span>W</span>
        <strong>
          Wembro
          <small>Profit Recovery</small>
        </strong>
      </Link>
      <nav className="saas-nav" aria-label="Main navigation">
        <div className="saas-nav-menu">
          <Link href="/product">Product <span>v</span></Link>
          <div className="saas-nav-popover">
            <Link href="/product">Product overview</Link>
            <Link href="/ai-operations-engine">AI Operations Engine</Link>
            <Link href="/data-brain">Unified Data Brain</Link>
            <Link href="/dashboard">Dashboard preview</Link>
            <Link href="/pilot">Pilot workflow</Link>
          </div>
        </div>
        <div className="saas-nav-menu">
          <Link href="/personas/founder">Solutions <span>v</span></Link>
          <div className="saas-nav-popover">
            <Link href="/personas/founder">For founders</Link>
            <Link href="/personas/operations">For operations</Link>
            <Link href="/personas/growth-lead">For growth teams</Link>
          </div>
        </div>
        <div className="saas-nav-menu">
          <Link href="/audit">Resources <span>v</span></Link>
          <div className="saas-nav-popover">
            <Link href="/calculator">Leakage calculator</Link>
            <Link href="/audit">Profit audit</Link>
            <Link href="/sample-report">Sample report</Link>
          </div>
        </div>
        <Link href="/data-ingestion">Integrations</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/alerts-reports">Reports</Link>
      </nav>
      <div className="saas-header__actions">
        <Link className="button secondary" href={isLoginBypassed ? "/dashboard" : "/login"}>
          {isLoginBypassed ? "Open dashboard" : "Sign in"}
        </Link>
        <Link className="button" href="/calculator">Free leakage check <span aria-hidden>→</span></Link>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="saas-footer">
      <div>
        <Link className="saas-brand" href="/">
          <span>W</span>
          <strong>Wembro</strong>
        </Link>
        <p>Wembro starts with CSV-first COD/RTO/NDR profit recovery for Indian D2C sellers. The broader AI Operations OS remains future architecture until the wedge has proof.</p>
      </div>
      <div className="saas-footer__links">
        <Link href="/product">Product</Link>
        <Link href="/calculator">Leakage Check</Link>
        <Link href="/sample-report">Sample Report</Link>
        <Link href="/audit">Profit Audit</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/pilot">Pilot Workflow</Link>
        <Link href="/dashboard">Dashboard</Link>
      </div>
    </footer>
  );
}

export function MarketingPage({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <main className={`saas-page saas-page--${tone}`}>
      <MarketingHeader variant={tone === "dark" ? "dark" : "light"} />
      {children}
      <MarketingFooter />
    </main>
  );
}
