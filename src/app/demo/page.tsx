"use client";

import { useState } from "react";
import Link from "next/link";
import { createMainStore } from "@/features/stores";
import { demoProfiles, generateDemoWorkspace, type DemoProfileId } from "@/features/demo";
import { currentProPlan } from "@/features/plans";
import { saveWorkspaceState, storageVersion, type StarterWorkspaceState } from "@/shared/storage";

export default function DemoPage() {
  const [profileId, setProfileId] = useState<DemoProfileId>("fashion");
  const [orderCount, setOrderCount] = useState(1400);
  const [status, setStatus] = useState("");
  const profile = demoProfiles[profileId];

  function loadDemo() {
    const generated = generateDemoWorkspace({ profileId, orderCount, seed: 6400 + orderCount });
    const stores = [createMainStore(generated.brand.id, `${generated.profile.category} Main Store`)];
    const state: StarterWorkspaceState = {
      storageVersion,
      currentPlan: "pro",
      brand: generated.brand,
      orders: generated.orders.map((order) => ({ ...order, storeId: stores[0].id })),
      ndrCases: generated.ndrCases,
      messages: [],
      responses: [],
      savingsEvents: generated.savingsEvents,
      actions: [],
      audits: [
        {
          id: `audit-demo-${Date.now()}`,
          brandId: generated.brand.id,
          action: "csv_imported",
          entityType: "import",
          entityId: generated.imports[0].id,
          metadata: { source: "generated /demo route", profile: generated.profile.label, rows: generated.orders.length },
          createdAt: new Date().toISOString()
        }
      ],
      imports: generated.imports,
      stores,
      policyRecommendations: [],
      weeklyReports: [],
      monthlyStrategyReports: [],
      policySimulations: [],
      exports: [],
      overLimit: generated.orders.length > currentProPlan.limits.monthly_order_limit
    };
    saveWorkspaceState(state);
    setStatus(`${generated.profile.label} workspace loaded with ${generated.orders.length.toLocaleString("en-IN")} fictional orders.`);
  }

  return (
    <main className="public-page">
      <header className="public-header">
        <Link className="brand-link" href="/">SupportWaala</Link>
        <nav className="public-nav"><Link href="/">Open control room</Link><Link href="/calculator">Free Leakage Check</Link></nav>
      </header>
      <section className="report-hero">
        <p className="eyebrow">Demo / Client Test Mode</p>
        <h1>Load a fictional RTOShield workspace</h1>
        <p className="hero-copy">Choose a D2C profile, generate local demo orders, then open SupportWaala as a client story: leakage check, audit, rescue pilot, daily control room, and founder intelligence. No external integrations or real WhatsApp sending are used.</p>
      </section>
      <section className="calculator-layout">
        <div className="panel">
          <h2>Profile</h2>
          <div className="form-grid">
            <label><span className="muted">Business profile</span><select className="select" value={profileId} onChange={(event) => setProfileId(event.target.value as DemoProfileId)}>{Object.values(demoProfiles).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label><span className="muted">Order count</span><input className="input" type="number" min={500} max={5000} value={orderCount} onChange={(event) => setOrderCount(Number(event.target.value))} /></label>
          </div>
          <div className="grid metrics">
            <div className="panel metric"><div className="label">COD share</div><div className="value">{profile.codPercent}%</div></div>
            <div className="panel metric"><div className="label">RTO target</div><div className="value">{profile.rtoPercent}%</div></div>
            <div className="panel metric"><div className="label">AOV</div><div className="value">₹{profile.averageOrderValue.toLocaleString("en-IN")}</div></div>
          </div>
          <div className="toolbar">
            <button className="button" onClick={loadDemo}>Load demo workspace</button>
            <Link className="button secondary" href="/">Open control room</Link>
          </div>
          {status ? <div className="success">{status}</div> : null}
        </div>
        <div className="panel">
          <h2>What this unlocks</h2>
          {["Profit Cockpit", "Daily Action Queue", "NDR Rescue", "Messaging Outbox", "Savings Ledger", "Weekly Report", "Policy Simulator"].map((item) => <div className="action-row" key={item}>{item}</div>)}
          <p className="notice">Demo data is fictional and for local testing.</p>
        </div>
      </section>
    </main>
  );
}
