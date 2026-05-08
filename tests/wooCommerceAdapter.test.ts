import { describe, it, expect } from "vitest";
import { mapWooOrder, verifyWooWebhook, type WooOrder } from "@/features/integrations/adapters/woocommerce.adapter";

const baseOrder: WooOrder = {
  id: 100,
  number: "100",
  date_created: "2026-05-01T10:00:00Z",
  status: "processing",
  payment_method: "cod",
  total: "1499.00",
  billing: {
    first_name: "Rahul",
    last_name: "Kumar",
    address_1: "House 10, Block A",
    postcode: "411001",
    city: "Pune",
    state: "MH",
    phone: "+91 98765-43210",
  },
  shipping: {
    first_name: "Rahul",
    last_name: "Kumar",
    address_1: "House 10, Block A",
    postcode: "411001",
    city: "Pune",
    state: "MH",
  },
  line_items: [{ name: "Sneakers", sku: "SKU-1", quantity: 2, price: "749.50" }],
  meta_data: [],
  shipping_lines: [{ method_title: "Standard Shipping" }],
};

describe("WooCommerceAdapter mapping", () => {
  it("maps a COD WooCommerce order to the normalized shape", () => {
    const result = mapWooOrder(baseOrder);
    expect(result.orderId).toBe("100");
    expect(result.paymentMode).toBe("COD");
    expect(result.orderValue).toBe(1499);
    expect(result.customerName).toBe("Rahul Kumar");
    expect(result.phone).toBe("919876543210");
    expect(result.pincode).toBe("411001");
    expect(result.city).toBe("Pune");
    expect(result.state).toBe("MH");
    expect(result.sourcePlatform).toBe("WooCommerce");
  });

  it("detects prepaid for non-COD payment methods", () => {
    expect(mapWooOrder({ ...baseOrder, payment_method: "razorpay" }).paymentMode).toBe("Prepaid");
    expect(mapWooOrder({ ...baseOrder, payment_method: "stripe" }).paymentMode).toBe("Prepaid");
  });

  it("returns Unknown when payment method is empty", () => {
    expect(mapWooOrder({ ...baseOrder, payment_method: "" }).paymentMode).toBe("Unknown");
  });

  it("falls back to billing address when shipping address is empty", () => {
    const noShipping: WooOrder = { ...baseOrder, shipping: { first_name: "", last_name: "", address_1: "" } };
    const result = mapWooOrder(noShipping);
    expect(result.addressLine1).toBe("House 10, Block A");
    expect(result.pincode).toBe("411001");
  });

  it("reads tracking number from AST plugin meta key", () => {
    const withTracking: WooOrder = {
      ...baseOrder,
      meta_data: [{ key: "_tracking_number", value: "DLV12345" }, { key: "_tracking_provider", value: "Delhivery" }],
    };
    const result = mapWooOrder(withTracking);
    expect(result.awb).toBe("DLV12345");
    expect(result.courier).toBe("Delhivery");
  });

  it("reads tracking from WooCommerce Shipment Tracking array format", () => {
    const withArrayTracking: WooOrder = {
      ...baseOrder,
      meta_data: [
        {
          key: "_wc_shipment_tracking_items",
          value: [{ tracking_number: "BD9999", tracking_provider: "Bluedart" }],
        },
      ],
    };
    const result = mapWooOrder(withArrayTracking);
    expect(result.awb).toBe("BD9999");
  });

  it("falls back to shipping_lines method_title when no tracking provider meta", () => {
    const result = mapWooOrder(baseOrder);
    expect(result.courier).toBe("Standard Shipping");
  });
});

describe("WooCommerceAdapter webhook verification", () => {
  it("accepts a valid HMAC-SHA256 signature", async () => {
    const secret = "wc-secret";
    const body = JSON.stringify({ id: 1, status: "processing" });

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const validSig = btoa(String.fromCharCode(...new Uint8Array(sig)));

    expect(await verifyWooWebhook(body, validSig, secret)).toBe(true);
  });

  it("rejects when signature header is empty", async () => {
    expect(await verifyWooWebhook(JSON.stringify({ id: 1 }), "", "secret")).toBe(false);
  });

  it("rejects on tampered body", async () => {
    const secret = "wc-secret";
    const body = JSON.stringify({ id: 1 });

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const validSig = btoa(String.fromCharCode(...new Uint8Array(sig)));

    expect(await verifyWooWebhook(body + "X", validSig, secret)).toBe(false);
  });
});
