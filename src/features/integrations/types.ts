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

export type IntegrationType =
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
  | BluedartCredentials;

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
  readonly type: IntegrationType;
  fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<AdapterFetchResult>;
}
