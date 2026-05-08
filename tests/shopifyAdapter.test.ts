import { describe, it, expect } from "vitest";
import { mapShopifyOrder, parseNextPageUrl, verifyShopifyWebhook, type ShopifyOrder } from "@/features/integrations/adapters/shopify.adapter";

const baseOrder: ShopifyOrder = {
  id: 4567,
  name: "#1001",
  created_at: "2026-05-01T10:00:00Z",
  cancelled_at: null,
  financial_status: "pending",
  fulfillment_status: null,
  gateway: "Cash on Delivery",
  total_price: "1499.00",
  customer: { first_name: "Rahul", last_name: "Kumar", phone: "+91 98765-43210" },
  shipping_address: { address1: "House 10, Block A", zip: "411001", city: "Pune", province: "Maharashtra", phone: "9876543210", name: "Rahul Kumar" },
  billing_address: undefined,
  line_items: [{ name: "Sneakers", sku: "SKU-1", quantity: 2, price: "749.50" }],
  fulfillments: [],
};

describe("ShopifyAdapter mapping", () => {
  it("maps a COD Shopify order to the normalized shape", () => {
    const result = mapShopifyOrder(baseOrder);
    expect(result.orderId).toBe("4567");
    expect(result.paymentMode).toBe("COD");
    expect(result.orderValue).toBe(1499);
    expect(result.customerName).toBe("Rahul Kumar");
    expect(result.phone).toBe("919876543210"); // digits only, includes country code
    expect(result.pincode).toBe("411001");
    expect(result.city).toBe("Pune");
    expect(result.state).toBe("Maharashtra");
    expect(result.productName).toBe("Sneakers");
    expect(result.sku).toBe("SKU-1");
    expect(result.quantity).toBe(2);
    expect(result.sourcePlatform).toBe("Shopify");
  });

  it("detects prepaid when gateway is set but not COD", () => {
    const result = mapShopifyOrder({ ...baseOrder, gateway: "razorpay" });
    expect(result.paymentMode).toBe("Prepaid");
  });

  it("returns Unknown payment mode when gateway is empty", () => {
    const result = mapShopifyOrder({ ...baseOrder, gateway: "" });
    expect(result.paymentMode).toBe("Unknown");
  });

  it("flags cancelled orders in finalStatus", () => {
    const cancelled = { ...baseOrder, cancelled_at: "2026-05-02T08:00:00Z", fulfillment_status: null };
    expect(mapShopifyOrder(cancelled).finalStatus).toBe("cancelled");
  });

  it("captures fulfillment AWB and courier when present", () => {
    const shipped = {
      ...baseOrder,
      fulfillment_status: "fulfilled",
      fulfillments: [{ tracking_number: "DLV12345", tracking_company: "Delhivery", shipment_status: "in_transit", status: "success" }],
    };
    const result = mapShopifyOrder(shipped);
    expect(result.awb).toBe("DLV12345");
    expect(result.courier).toBe("Delhivery");
    expect(result.shipmentStatus).toBe("in_transit");
    expect(result.finalStatus).toBe("fulfilled");
  });

  it("falls back to billing address when shipping address is missing", () => {
    const noShipping = { ...baseOrder, shipping_address: undefined, billing_address: { address1: "Office 5", zip: "560001", city: "Bangalore" } };
    const result = mapShopifyOrder(noShipping);
    expect(result.addressLine1).toBe("Office 5");
    expect(result.pincode).toBe("560001");
    expect(result.city).toBe("Bangalore");
  });
});

describe("ShopifyAdapter pagination", () => {
  it("extracts the next-page URL from a Link header with rel=next", () => {
    const linkHeader = '<https://shop.myshopify.com/admin/api/2024-10/orders.json?page_info=ABC&limit=250>; rel="next"';
    expect(parseNextPageUrl(linkHeader)).toBe("https://shop.myshopify.com/admin/api/2024-10/orders.json?page_info=ABC&limit=250");
  });

  it("ignores rel=previous when only previous is present", () => {
    const linkHeader = '<https://shop.myshopify.com/admin/api/2024-10/orders.json?page_info=XYZ>; rel="previous"';
    expect(parseNextPageUrl(linkHeader)).toBeNull();
  });

  it("picks rel=next from a header with both prev and next", () => {
    const linkHeader = '<https://shop.myshopify.com/admin/api/2024-10/orders.json?page_info=PREV>; rel="previous", <https://shop.myshopify.com/admin/api/2024-10/orders.json?page_info=NEXT>; rel="next"';
    expect(parseNextPageUrl(linkHeader)).toBe("https://shop.myshopify.com/admin/api/2024-10/orders.json?page_info=NEXT");
  });

  it("returns null on empty header", () => {
    expect(parseNextPageUrl(null)).toBeNull();
    expect(parseNextPageUrl("")).toBeNull();
  });
});

describe("ShopifyAdapter webhook verification", () => {
  it("accepts a valid HMAC-SHA256 signature", async () => {
    const secret = "test-secret-key";
    const body = JSON.stringify({ id: 1, total_price: "100" });

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const validHmac = btoa(String.fromCharCode(...new Uint8Array(sig)));

    expect(await verifyShopifyWebhook(body, validHmac, secret)).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const secret = "test-secret-key";
    const body = JSON.stringify({ id: 1, total_price: "100" });

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const validHmac = btoa(String.fromCharCode(...new Uint8Array(sig)));

    expect(await verifyShopifyWebhook(body + "tampered", validHmac, secret)).toBe(false);
  });

  it("rejects with the wrong secret", async () => {
    const body = JSON.stringify({ id: 1 });
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode("real-secret"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const hmac = btoa(String.fromCharCode(...new Uint8Array(sig)));

    expect(await verifyShopifyWebhook(body, hmac, "wrong-secret")).toBe(false);
  });
});
