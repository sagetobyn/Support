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

export type IntegrationType = "shopify" | "woocommerce" | "delhivery" | "shiprocket";

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

export type IntegrationCredentials =
  | ShopifyCredentials
  | WooCommerceCredentials
  | DelhiveryCredentials
  | ShiprocketCredentials;

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

// Every platform adapter implements this interface.
// fetchOrders is called by the sync orchestrator; it must be idempotent (safe to call repeatedly).
export interface IntegrationAdapter {
  readonly type: IntegrationType;
  fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<IntegrationOrderInput[]>;
}
