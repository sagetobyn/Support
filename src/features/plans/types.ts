export type PlanId = "free" | "audit" | "pilot" | "starter" | "growth" | "pro" | "managed_pro" | "scale" | "enterprise";

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceMonthlyInr: number;
  bestFor: string;
  limits: {
    monthly_order_limit: number;
    csv_upload: boolean;
    max_import_rows_per_file: number;
    risk_scoring: string;
    address_check: string;
    ndr_dashboard: string;
    daily_action_queue: string;
    whatsapp_outbox: string;
    manual_response_capture: string;
    reports: "disabled" | "basic" | "advanced";
    roi_dashboard: "disabled" | "basic" | "advanced";
    real_whatsapp_api: boolean;
    integrations: boolean;
    managed_support: boolean;
    [key: string]: string | number | boolean | undefined;
  };
  gatedFeatures?: string[];
}
