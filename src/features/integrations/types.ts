// Normalized order row that every adapter must produce.
// Mirrors the columns importStarterCsv accepts so runImportPipeline works unchanged.
export interface IntegrationOrderInput {
  orderId: string;
  awb?: string;
  orderDate?: string;
  customerName?: string;
  phone?: string;
  addressLine1?: string;
  pincode?: string;
  city?: string;
  state?: string;
  productName?: string;
  sku?: string;
  quantity?: number;
  orderValue: number;
  paymentMode: "COD" | "Prepaid" | "Unknown";
  courier?: string;
  shipmentStatus?: string;
  finalStatus?: string;
  ndrReason?: string;
  attemptCount?: number;
  sourcePlatform?: string;
  rawData?: Record<string, unknown>;
}

export type IntegrationCategory = "source" | "messaging" | "payment";

export type SourceType =
  | "shopify"
  | "woocommerce"
  | "amazon"
  | "flipkart"
  | "meesho"
  | "delhivery"
  | "shiprocket"
  | "nimbuspost"
  | "xpressbees"
  | "ecomexpress"
  | "bluedart";

export type MessagingType =
  | "aisensy"      // WhatsApp BSP
  | "interakt"     // WhatsApp BSP
  | "wati"         // WhatsApp BSP
  | "msg91"        // SMS
  | "exotel";      // Voice / IVR

export type PaymentType = "razorpay" | "cashfree";

export type IntegrationType = SourceType | MessagingType | PaymentType;

export const SOURCE_TYPES: SourceType[] = [
  "shopify", "woocommerce", "amazon", "flipkart", "meesho",
  "delhivery", "shiprocket", "nimbuspost", "xpressbees", "ecomexpress", "bluedart",
];
export const MESSAGING_TYPES: MessagingType[] = ["aisensy", "interakt", "wati", "msg91", "exotel"];
export const PAYMENT_TYPES: PaymentType[] = ["razorpay", "cashfree"];

export function categoryForType(type: IntegrationType): IntegrationCategory {
  if (MESSAGING_TYPES.includes(type as MessagingType)) return "messaging";
  if (PAYMENT_TYPES.includes(type as PaymentType)) return "payment";
  return "source";
}

// Credentials are platform-specific. Keep the shape narrow per type.
export type ShopifyCredentials = {
  shopUrl: string;       // e.g. "mystore.myshopify.com"
  accessToken: string;
  webhookSecret?: string;
};

export type WooCommerceCredentials = {
  siteUrl: string;       // e.g. "https://mystore.com"
  consumerKey: string;
  consumerSecret: string;
  webhookSecret?: string;
};

export type DelhiveryCredentials = {
  apiToken: string;
};

export type ShiprocketCredentials = {
  email: string;
  password: string;
  // jwtToken is fetched dynamically; store here after auth refresh
  jwtToken?: string;
  jwtExpiresAt?: string;
};

// Amazon SP-API uses Login With Amazon (LWA) refresh token + AWS STS role assumption.
// Region: "in" for India. Sellers register the app once, get refreshToken, paste here.
export type AmazonCredentials = {
  region: "in" | "eu" | "us";
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  sellerId: string;
  marketplaceId: string;       // e.g. "A21TJRUUN4KGV" for India
  // Cached LWA access token (1h lifetime)
  accessToken?: string;
  accessTokenExpiresAt?: string;
};

export type FlipkartCredentials = {
  // Flipkart Seller API uses OAuth2 with merchant_id + access token
  applicationId: string;
  applicationSecret: string;
  accessToken?: string;        // refreshed via client_credentials grant
  accessTokenExpiresAt?: string;
};

export type MeeshoCredentials = {
  // Meesho's Supplier API uses an API key + secret (Partner API).
  // Note: requires being onboarded as a Meesho integration partner.
  apiKey: string;
  apiSecret: string;
};

export type NimbusPostCredentials = {
  email: string;
  password: string;
  jwtToken?: string;
  jwtExpiresAt?: string;
};

export type XpressBeesCredentials = {
  email: string;
  password: string;
  bearerToken?: string;
  bearerExpiresAt?: string;
};

export type EcomExpressCredentials = {
  username: string;
  password: string;
};

export type BluedartCredentials = {
  apiKey: string;          // license key
  loginId: string;
  apiPassword: string;
};

// ---- Messaging providers ----

// AiSensy uses an API key per project. Templates are pre-approved in their dashboard.
export type AiSensyCredentials = {
  apiKey: string;
  // Default sender (WhatsApp Business number). Optional; can be overridden per message.
  senderNumber?: string;
};

// Interakt uses an API key (secret). Templates also pre-approved.
export type InteraktCredentials = {
  apiKey: string;
};

// Wati uses access_token + tenantId.
export type WatiCredentials = {
  accessToken: string;
  tenantId: string;          // e.g. "live-server-12345"
};

// MSG91 — Indian SMS gateway. Auth key + DLT-approved template + sender ID.
export type Msg91Credentials = {
  authKey: string;
  senderId: string;          // 6-character DLT-approved sender e.g. "RTOSHL"
  defaultTemplateId?: string; // fallback DLT template
};

// Exotel — voice/IVR for COD confirmation calls. SID + token + caller ID.
export type ExotelCredentials = {
  sid: string;               // account SID
  apiToken: string;
  callerId: string;          // verified caller ID e.g. "08047185000"
  // Optional: AppID of an Exotel app (call flow) to route confirmation calls through
  appId?: string;
};

// ---- Payment providers ----

export type RazorpayCredentials = {
  keyId: string;
  keySecret: string;
};

export type CashfreeCredentials = {
  appId: string;
  secretKey: string;
  environment?: "sandbox" | "production";
};

export type IntegrationCredentials =
  | ShopifyCredentials
  | WooCommerceCredentials
  | AmazonCredentials
  | FlipkartCredentials
  | MeeshoCredentials
  | DelhiveryCredentials
  | ShiprocketCredentials
  | NimbusPostCredentials
  | XpressBeesCredentials
  | EcomExpressCredentials
  | BluedartCredentials
  | AiSensyCredentials
  | InteraktCredentials
  | WatiCredentials
  | Msg91Credentials
  | ExotelCredentials
  | RazorpayCredentials
  | CashfreeCredentials;

export interface IntegrationRecord {
  id: string;
  brandId: string;
  type: IntegrationType;
  label: string | null;
  status: "active" | "paused" | "error";
  lastSyncAt: string | null;
  lastSyncStatus: "ok" | "error" | null;
  lastSyncError: string | null;
  syncedCount: number;
  createdAt: string;
  updatedAt: string;
  // credentials intentionally omitted from the public shape — repository returns this separately
}

export interface SyncResult {
  integrationId: string;
  ordersIngested: number;
  ordersSkipped: number;
  errors: string[];
  syncedAt: string;
}

// What an adapter returns from fetchOrders. updatedCredentials is set when the adapter
// refreshed credentials during the call (e.g. Shiprocket JWT) — the orchestrator persists them.
export interface AdapterFetchResult {
  orders: IntegrationOrderInput[];
  updatedCredentials?: IntegrationCredentials;
}

// Every platform adapter implements this interface.
// fetchOrders is called by the sync orchestrator; it must be idempotent (safe to call repeatedly).
export interface IntegrationAdapter {
  readonly type: SourceType;
  fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<AdapterFetchResult>;
}

// What sellers want from a messaging provider: send a templated message to a customer.
export interface MessageDispatch {
  channel: "whatsapp" | "sms" | "voice";
  to: string;             // E.164-ish digits, e.g. "919876543210"
  // For WhatsApp BSPs: pre-approved template name + variables.
  // For SMS (MSG91): DLT-approved template ID + variables.
  // For voice (Exotel): the message body is the spoken text or null if using Exotel app flow.
  templateName?: string;
  templateId?: string;
  variables?: Record<string, string>;
  body?: string;          // free-form text fallback; voice uses this as speech
  language?: "en" | "hi" | "hinglish";
}

export interface DispatchResult {
  ok: boolean;
  providerMessageId?: string;
  status: "queued" | "sent" | "failed";
  error?: string;
  // For voice: indicates whether the customer picked up. Optional, fills async via webhook.
  callStatus?: "completed" | "no-answer" | "busy" | "failed";
  updatedCredentials?: IntegrationCredentials;
}

export interface MessagingAdapter {
  readonly type: MessagingType;
  readonly channel: "whatsapp" | "sms" | "voice";
  sendMessage(credentials: IntegrationCredentials, message: MessageDispatch): Promise<DispatchResult>;
}

// Payment-link providers. createPaymentLink returns a URL the seller can drop into a
// WhatsApp message body to convert COD → prepaid.
export interface PaymentLinkRequest {
  amount: number;          // INR rupees
  orderId: string;
  customerPhone?: string;
  customerName?: string;
  description?: string;
  expiresInHours?: number;
}

export interface PaymentLinkResult {
  ok: boolean;
  paymentUrl?: string;
  paymentLinkId?: string;
  error?: string;
  updatedCredentials?: IntegrationCredentials;
}

export interface PaymentAdapter {
  readonly type: PaymentType;
  createPaymentLink(credentials: IntegrationCredentials, request: PaymentLinkRequest): Promise<PaymentLinkResult>;
}
