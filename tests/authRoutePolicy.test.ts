import { describe, expect, it } from "vitest";
import { isPublicTrustRoute, PUBLIC_TRUST_PREFIXES, PUBLIC_TRUST_ROUTES } from "@/lib/auth/middleware";

describe("auth route policy", () => {
  it("keeps the public surface limited to the seller trust ladder", () => {
    expect(PUBLIC_TRUST_ROUTES).toEqual([
      "/",
      "/product",
      "/pricing",
      "/calculator",
      "/audit",
      "/sample-report",
      "/demo",
      "/pilot",
      "/login"
    ]);
    expect(PUBLIC_TRUST_PREFIXES).toEqual(["/personas/", "/auth/", "/api/public"]);

    for (const route of PUBLIC_TRUST_ROUTES) {
      expect(isPublicTrustRoute(route)).toBe(true);
    }
    expect(isPublicTrustRoute("/personas/founder")).toBe(true);
    expect(isPublicTrustRoute("/personas/operations")).toBe(true);
  });

  it("keeps the control room, future OS shells, and private APIs protected", () => {
    const protectedRoutes = [
      "/dashboard",
      "/onboarding",
      "/data-ingestion",
      "/data-brain",
      "/ai-operations-engine",
      "/automation",
      "/automation-coverage",
      "/alerts-reports",
      "/settings",
      "/model-control",
      "/marketing-automation",
      "/api/v1/orders",
      "/api/v1/ndr",
      "/api/v1/actions",
      "/api/v1/savings",
      "/api/v1/automation/capabilities"
    ];

    for (const route of protectedRoutes) {
      expect(isPublicTrustRoute(route)).toBe(false);
    }
  });

  it("keeps provider webhook stubs non-public until integration proof exists", () => {
    expect(isPublicTrustRoute("/api/webhooks/shopify")).toBe(false);
    expect(isPublicTrustRoute("/api/webhooks/woocommerce")).toBe(false);
    expect(isPublicTrustRoute("/api/webhooks/shiprocket")).toBe(false);
  });
});
