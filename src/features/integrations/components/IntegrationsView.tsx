"use client";

import { useEffect, useState } from "react";
import type { IntegrationRecord, IntegrationType } from "../types";

interface SyncResult {
  ordersIngested: number;
  ordersSkipped: number;
  errors: string[];
  syncedAt: string;
}

interface ConnectForm {
  // Shopify
  shopUrl?: string;
  accessToken?: string;
  webhookSecret?: string;
  // WooCommerce
  siteUrl?: string;
  consumerKey?: string;
  consumerSecret?: string;
  // Delhivery
  apiToken?: string;
  // Shiprocket
  email?: string;
  password?: string;
  // Amazon SP-API
  region?: "in" | "eu" | "us";
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  sellerId?: string;
  marketplaceId?: string;
  // Flipkart
  applicationId?: string;
  applicationSecret?: string;
  // Meesho
  apiKey?: string;
  apiSecret?: string;
  // Ecom Express
  username?: string;
  // Bluedart
  loginId?: string;
  apiPassword?: string;
  // AiSensy
  senderNumber?: string;
  // MSG91
  authKey?: string;
  senderId?: string;
  defaultTemplateId?: string;
  // Exotel
  sid?: string;
  apiToken?: string;
  callerId?: string;
  appId?: string;
  // Wati
  tenantId?: string;
  // Razorpay
  keyId?: string;
  keySecret?: string;
  // Cashfree (appId reused)
  secretKey?: string;
}

const INTEGRATION_META: Record<IntegrationType, {
  label: string;
  description: string;
  logoChar: string;
  fields: Array<{ key: keyof ConnectForm; label: string; placeholder: string; type?: string; required?: boolean }>;
  webhookNote?: string;
}> = {
  shopify: {
    label: "Shopify",
    description: "Auto-import orders. Set up a webhook for real-time sync on new orders.",
    logoChar: "S",
    fields: [
      { key: "shopUrl", label: "Shop URL", placeholder: "yourstore.myshopify.com", required: true },
      { key: "accessToken", label: "Access Token", placeholder: "shpat_xxxx", type: "password", required: true },
      { key: "webhookSecret", label: "Webhook Secret (optional)", placeholder: "Leave blank to use polling" },
    ],
    webhookNote: "/api/webhooks/shopify?brandId=YOUR_BRAND_ID",
  },
  woocommerce: {
    label: "WooCommerce",
    description: "Auto-import orders from your WordPress + WooCommerce store.",
    logoChar: "W",
    fields: [
      { key: "siteUrl", label: "Site URL", placeholder: "https://yourstore.com", required: true },
      { key: "consumerKey", label: "Consumer Key", placeholder: "ck_xxxx", required: true },
      { key: "consumerSecret", label: "Consumer Secret", placeholder: "cs_xxxx", type: "password", required: true },
      { key: "webhookSecret", label: "Webhook Secret (optional)", placeholder: "Leave blank to use polling" },
    ],
    webhookNote: "/api/webhooks/woocommerce?brandId=YOUR_BRAND_ID",
  },
  amazon: {
    label: "Amazon Seller Central",
    description: "Pull marketplace orders via SP-API. India marketplace ID: A21TJRUUN4KGV.",
    logoChar: "A",
    fields: [
      { key: "region", label: "Region", placeholder: "in", required: true },
      { key: "marketplaceId", label: "Marketplace ID", placeholder: "A21TJRUUN4KGV", required: true },
      { key: "sellerId", label: "Seller ID", placeholder: "A1XXXXXXXXX", required: true },
      { key: "clientId", label: "LWA Client ID", placeholder: "amzn1.application-oa2-client.xxx", required: true },
      { key: "clientSecret", label: "LWA Client Secret", placeholder: "amzn1.oa2-cs.xxx", type: "password", required: true },
      { key: "refreshToken", label: "LWA Refresh Token", placeholder: "Atzr|...", type: "password", required: true },
    ],
  },
  flipkart: {
    label: "Flipkart Seller Hub",
    description: "Pull marketplace shipments via Flipkart Seller API.",
    logoChar: "F",
    fields: [
      { key: "applicationId", label: "Application ID", placeholder: "Your Flipkart App ID", required: true },
      { key: "applicationSecret", label: "Application Secret", placeholder: "Your Flipkart App Secret", type: "password", required: true },
    ],
  },
  meesho: {
    label: "Meesho Supplier",
    description: "Pull marketplace orders + NDRs. Highest-RTO marketplace — single biggest impact.",
    logoChar: "M",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "Meesho Partner API Key", required: true },
      { key: "apiSecret", label: "API Secret", placeholder: "Meesho Partner API Secret", type: "password", required: true },
    ],
  },
  delhivery: {
    label: "Delhivery",
    description: "Pull NDR cases and tracking updates directly from Delhivery.",
    logoChar: "D",
    fields: [
      { key: "apiToken", label: "API Token", placeholder: "Your Delhivery API token", type: "password", required: true },
    ],
  },
  shiprocket: {
    label: "Shiprocket",
    description: "Pull orders and NDRs. Covers Delhivery, Ecom Express, Xpressbees, and more.",
    logoChar: "SR",
    fields: [
      { key: "email", label: "Shiprocket Email", placeholder: "seller@example.com", required: true },
      { key: "password", label: "Shiprocket Password", placeholder: "••••••••", type: "password", required: true },
    ],
    webhookNote: "/api/webhooks/shiprocket?brandId=YOUR_BRAND_ID",
  },
  nimbuspost: {
    label: "NimbusPost",
    description: "Major Shiprocket alternative. Pull orders + NDRs across NimbusPost's courier network.",
    logoChar: "NP",
    fields: [
      { key: "email", label: "NimbusPost Email", placeholder: "seller@example.com", required: true },
      { key: "password", label: "NimbusPost Password", placeholder: "••••••••", type: "password", required: true },
    ],
  },
  xpressbees: {
    label: "XpressBees",
    description: "Direct courier integration. Pull NDRs + recent shipments from your XpressBees account.",
    logoChar: "XB",
    fields: [
      { key: "email", label: "XpressBees Email", placeholder: "seller@example.com", required: true },
      { key: "password", label: "XpressBees Password", placeholder: "••••••••", type: "password", required: true },
    ],
  },
  ecomexpress: {
    label: "Ecom Express",
    description: "Direct courier integration. Pull active NDR cases and refresh AWB tracking.",
    logoChar: "EE",
    fields: [
      { key: "username", label: "API Username", placeholder: "Ecom Express API username", required: true },
      { key: "password", label: "API Password", placeholder: "••••••••", type: "password", required: true },
    ],
  },
  bluedart: {
    label: "Bluedart",
    description: "Premium courier — AWB tracking refresh only. Use alongside an order source (Shopify/Amazon).",
    logoChar: "BD",
    fields: [
      { key: "loginId", label: "Login ID", placeholder: "Bluedart login ID", required: true },
      { key: "apiKey", label: "License Key", placeholder: "Bluedart license key", type: "password", required: true },
      { key: "apiPassword", label: "API Password", placeholder: "••••••••", type: "password", required: true },
    ],
  },
  aisensy: {
    label: "AiSensy",
    description: "Real WhatsApp Business API. Send pre-approved templates at scale (replaces wa.me click-and-send).",
    logoChar: "AS",
    fields: [
      { key: "apiKey", label: "AiSensy API Key", placeholder: "API key from AiSensy dashboard", type: "password", required: true },
      { key: "senderNumber", label: "Sender Number (optional)", placeholder: "Your WhatsApp Business number" },
    ],
  },
  interakt: {
    label: "Interakt",
    description: "Tata's WhatsApp BSP. Coming soon — adapter roadmapped.",
    logoChar: "IN",
    fields: [
      { key: "apiKey", label: "Interakt API Key", placeholder: "API key", type: "password", required: true },
    ],
  },
  wati: {
    label: "Wati",
    description: "Popular SMB WhatsApp BSP. Coming soon — adapter roadmapped.",
    logoChar: "WT",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "Wati access token", type: "password", required: true },
    ],
  },
  msg91: {
    label: "MSG91 (SMS)",
    description: "DLT-compliant SMS fallback when WhatsApp is unread. Critical for tier-2/3 city customers.",
    logoChar: "M91",
    fields: [
      { key: "authKey", label: "MSG91 Auth Key", placeholder: "Your MSG91 auth key", type: "password", required: true },
      { key: "senderId", label: "Sender ID (DLT)", placeholder: "RTOSHL", required: true },
      { key: "defaultTemplateId", label: "Default Template ID", placeholder: "Default DLT template ID" },
    ],
  },
  exotel: {
    label: "Exotel (Voice/IVR)",
    description: "Auto-call risky COD orders for confirmation. Recovers 10-15% of high-RTO COD orders before dispatch.",
    logoChar: "EX",
    fields: [
      { key: "sid", label: "Account SID", placeholder: "Exotel account SID", required: true },
      { key: "apiToken", label: "API Token", placeholder: "Exotel API token", type: "password", required: true },
      { key: "callerId", label: "Caller ID", placeholder: "Verified caller number e.g. 08047185000", required: true },
      { key: "appId", label: "App ID (optional)", placeholder: "Exotel call-flow app ID for IVR" },
    ],
  },
  razorpay: {
    label: "Razorpay",
    description: "Generate real prepaid payment links for risky COD orders. Replaces the placeholder link in WhatsApp templates.",
    logoChar: "RZ",
    fields: [
      { key: "keyId", label: "Key ID", placeholder: "rzp_live_xxxx or rzp_test_xxxx", required: true },
      { key: "keySecret", label: "Key Secret", placeholder: "Razorpay key secret", type: "password", required: true },
    ],
  },
  cashfree: {
    label: "Cashfree",
    description: "Alternative payment-link provider. Use as fallback if Razorpay is down.",
    logoChar: "CF",
    fields: [
      { key: "appId", label: "App ID", placeholder: "Cashfree App ID", required: true },
      { key: "secretKey", label: "Secret Key", placeholder: "Cashfree Secret Key", type: "password", required: true },
    ],
  },
};

const SOURCE_TYPES_LIST: IntegrationType[] = ["shopify", "woocommerce", "amazon", "flipkart", "meesho"];
const COURIER_TYPES_LIST: IntegrationType[] = ["delhivery", "shiprocket", "nimbuspost", "xpressbees", "ecomexpress", "bluedart"];
const MESSAGING_TYPES_LIST: IntegrationType[] = ["aisensy", "interakt", "wati", "msg91", "exotel"];
const PAYMENT_TYPES_LIST: IntegrationType[] = ["razorpay", "cashfree"];

interface CategorySection { title: string; subtitle: string; types: IntegrationType[]; }
const CATEGORY_SECTIONS: CategorySection[] = [
  { title: "Order Sources", subtitle: "Auto-import orders from your storefronts and marketplaces.", types: SOURCE_TYPES_LIST },
  { title: "Couriers", subtitle: "Pull NDRs and refresh tracking from courier APIs.", types: COURIER_TYPES_LIST },
  { title: "Communication Channels", subtitle: "Send WhatsApp / SMS / IVR calls from inside the dashboard.", types: MESSAGING_TYPES_LIST },
  { title: "Payment Providers", subtitle: "Generate real prepaid payment links for COD-to-prepaid conversion.", types: PAYMENT_TYPES_LIST },
];

export function IntegrationsView() {
  const [records, setRecords] = useState<IntegrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingType, setConnectingType] = useState<IntegrationType | null>(null);
  const [form, setForm] = useState<ConnectForm>({});
  const [submitting, setSubmitting] = useState(false);
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/integrations");
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json() as { integrations: IntegrationRecord[] };
      setRecords(json.integrations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load integrations. Are you logged in?");
    } finally {
      setLoading(false);
    }
  }

  async function connect(type: IntegrationType) {
    setSubmitting(true);
    setError(null);
    try {
      const credentials = buildCredentials(type, form);
      const res = await fetch("/api/v1/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, label: INTEGRATION_META[type].label, credentials }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setConnectingType(null);
      setForm({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function triggerSync(integration: IntegrationRecord) {
    setSyncing(integration.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/integrations/${integration.id}/sync`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json() as { result: SyncResult };
      setSyncResults((prev) => ({ ...prev, [integration.id]: json.result }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(null);
    }
  }

  async function disconnect(integration: IntegrationRecord) {
    if (!confirm(`Disconnect ${INTEGRATION_META[integration.type as IntegrationType].label}? Credentials will be deleted.`)) return;
    try {
      await fetch(`/api/v1/integrations/${integration.id}`, { method: "DELETE" });
      await load();
    } catch {
      setError("Disconnect failed");
    }
  }

  function buildCredentials(type: IntegrationType, f: ConnectForm): Record<string, string> {
    if (type === "shopify") return { shopUrl: f.shopUrl ?? "", accessToken: f.accessToken ?? "", ...(f.webhookSecret ? { webhookSecret: f.webhookSecret } : {}) };
    if (type === "woocommerce") return { siteUrl: f.siteUrl ?? "", consumerKey: f.consumerKey ?? "", consumerSecret: f.consumerSecret ?? "", ...(f.webhookSecret ? { webhookSecret: f.webhookSecret } : {}) };
    if (type === "amazon") return {
      region: f.region ?? "in",
      marketplaceId: f.marketplaceId ?? "A21TJRUUN4KGV",
      sellerId: f.sellerId ?? "",
      clientId: f.clientId ?? "",
      clientSecret: f.clientSecret ?? "",
      refreshToken: f.refreshToken ?? "",
    };
    if (type === "flipkart") return { applicationId: f.applicationId ?? "", applicationSecret: f.applicationSecret ?? "" };
    if (type === "meesho") return { apiKey: f.apiKey ?? "", apiSecret: f.apiSecret ?? "" };
    if (type === "delhivery") return { apiToken: f.apiToken ?? "" };
    if (type === "shiprocket") return { email: f.email ?? "", password: f.password ?? "" };
    if (type === "nimbuspost") return { email: f.email ?? "", password: f.password ?? "" };
    if (type === "xpressbees") return { email: f.email ?? "", password: f.password ?? "" };
    if (type === "ecomexpress") return { username: f.username ?? "", password: f.password ?? "" };
    if (type === "bluedart") return { loginId: f.loginId ?? "", apiKey: f.apiKey ?? "", apiPassword: f.apiPassword ?? "" };
    if (type === "aisensy") return { apiKey: f.apiKey ?? "", ...(f.senderNumber ? { senderNumber: f.senderNumber } : {}) };
    if (type === "interakt") return { apiKey: f.apiKey ?? "" };
    if (type === "wati") return { accessToken: f.accessToken ?? "", tenantId: f.tenantId ?? "" };
    if (type === "msg91") return { authKey: f.authKey ?? "", senderId: f.senderId ?? "", ...(f.defaultTemplateId ? { defaultTemplateId: f.defaultTemplateId } : {}) };
    if (type === "exotel") return { sid: f.sid ?? "", apiToken: f.apiToken ?? "", callerId: f.callerId ?? "", ...(f.appId ? { appId: f.appId } : {}) };
    if (type === "razorpay") return { keyId: f.keyId ?? "", keySecret: f.keySecret ?? "" };
    if (type === "cashfree") return { appId: f.appId ?? "", secretKey: f.secretKey ?? "" };
    return {};
  }

  if (loading) return <div className="panel"><p className="muted">Loading integrations…</p></div>;

  function renderCard(type: IntegrationType) {
    const meta = INTEGRATION_META[type];
    const record = records.find((r) => r.type === type);
    const syncResult = record ? syncResults[record.id] : undefined;
    const isConnecting = connectingType === type;
    const isSyncing = record ? syncing === record.id : false;

    return (
      <div className="panel" key={type}>
        <div className="split">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontWeight: 700, fontSize: "1.1rem", background: "var(--surface-raised, #f4f4f4)", borderRadius: 6, padding: "4px 10px" }}>{meta.logoChar}</span>
            <div>
              <strong>{meta.label}</strong>
              {record && <span className={`badge ${record.status === "active" ? "success" : record.status === "error" ? "danger" : "neutral"}`} style={{ marginLeft: 8 }}>{record.status}</span>}
              {!record && <span className="badge neutral" style={{ marginLeft: 8 }}>not connected</span>}
            </div>
          </div>
        </div>
        <p className="muted">{meta.description}</p>

        {record && (
          <>
            <div className="muted" style={{ fontSize: "0.85rem" }}>
              {record.syncedCount} orders synced
              {record.lastSyncAt && ` · last sync ${new Date(record.lastSyncAt).toLocaleString("en-IN")}`}
              {record.lastSyncError && <span style={{ color: "var(--danger, #c00)" }}> · {record.lastSyncError}</span>}
            </div>
            {syncResult && (
              <div className="notice">
                Sync complete: {syncResult.ordersIngested} ingested, {syncResult.ordersSkipped} skipped
                {syncResult.errors.length > 0 && <span style={{ color: "var(--danger, #c00)" }}> · {syncResult.errors.join("; ")}</span>}
              </div>
            )}
            <div className="toolbar tight">
              <button className="button" disabled={isSyncing} onClick={() => void triggerSync(record)}>
                {isSyncing ? "Syncing…" : "Sync now"}
              </button>
              <button className="button secondary" onClick={() => void disconnect(record)}>Disconnect</button>
            </div>
            {meta.webhookNote && (
              <p className="muted" style={{ fontSize: "0.8rem" }}>
                Webhook URL: <code>{meta.webhookNote}</code> — register in {meta.label} for real-time sync.
              </p>
            )}
          </>
        )}

        {!record && !isConnecting && (
          <button className="button" onClick={() => { setConnectingType(type); setForm({}); setError(null); }}>Connect {meta.label}</button>
        )}

        {!record && isConnecting && (
          <div className="form-grid one" style={{ marginTop: "0.75rem" }}>
            {meta.fields.map((field) => (
              <label key={field.key}>
                <span className="muted">{field.label}</span>
                <input
                  className="input"
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  autoComplete="off"
                  value={(form[field.key] as string) ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </label>
            ))}
            <div className="toolbar tight">
              <button className="button" disabled={submitting} onClick={() => void connect(type)}>{submitting ? "Connecting…" : `Connect ${meta.label}`}</button>
              <button className="button secondary" onClick={() => { setConnectingType(null); setForm({}); }}>Cancel</button>
            </div>
            <p className="notice" style={{ fontSize: "0.8rem" }}>Credentials are stored encrypted in your account. Never share them with anyone.</p>
            {meta.webhookNote && (
              <p className="muted" style={{ fontSize: "0.8rem" }}>
                After connecting, register this webhook URL in {meta.label}: <code>{meta.webhookNote}</code>
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && <div className="notice" style={{ marginBottom: "1rem" }}>{error}</div>}
      {CATEGORY_SECTIONS.map((section) => (
        <div key={section.title} style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ marginBottom: "0.25rem" }}>{section.title}</h2>
          <p className="muted" style={{ marginTop: 0 }}>{section.subtitle}</p>
          <div className="grid report-grid">
            {section.types.map(renderCard)}
          </div>
        </div>
      ))}
    </div>
  );
}
