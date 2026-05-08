import { describe, it, expect } from "vitest";
import { mapShiprocketOrder, mapShiprocketNdr, detectPaymentMode, dedupe, type ShiprocketOrder, type ShiprocketNdrShipment } from "@/features/integrations/adapters/shiprocket.adapter";
import type { IntegrationOrderInput } from "@/features/integrations";

describe("ShiprocketAdapter mapping", () => {
  const baseOrder: ShiprocketOrder = {
    id: 7777,
    channel_order_id: "ORD-7777",
    created_at: "2026-05-01T10:00:00Z",
    status: "in_transit",
    payment_method: "COD",
    total: 1499,
    customer_name: "Rahul Kumar",
    customer_phone: "+91 98765-43210",
    delivery_address: "House 10, Block A, Pune",
    delivery_pincode: "411001",
    delivery_city: "Pune",
    delivery_state: "MH",
    products: [{ name: "Sneakers", sku: "SKU-1", units: 2, selling_price: "749.50" }],
    awb_code: "DLV-AWB-001",
    courier_name: "Delhivery",
    shipment_status: "Out for Delivery",
  };

  it("maps a Shiprocket order using channel_order_id when present", () => {
    const result = mapShiprocketOrder(baseOrder);
    expect(result.orderId).toBe("ORD-7777");
    expect(result.paymentMode).toBe("COD");
    expect(result.orderValue).toBe(1499);
    expect(result.phone).toBe("919876543210");
    expect(result.awb).toBe("DLV-AWB-001");
    expect(result.courier).toBe("Delhivery");
    expect(result.shipmentStatus).toBe("Out for Delivery");
    expect(result.sourcePlatform).toBe("Shiprocket");
  });

  it("falls back to numeric id when channel_order_id missing", () => {
    expect(mapShiprocketOrder({ ...baseOrder, channel_order_id: undefined }).orderId).toBe("7777");
  });

  it("maps an NDR shipment with reason and attempts", () => {
    const ndr: ShiprocketNdrShipment = {
      awb: "DLV-AWB-002",
      channel_order_id: "ORD-NDR-1",
      customer_name: "Priya",
      customer_phone: "9123456789",
      delivery_pincode: "560001",
      delivery_city: "Bangalore",
      cod_amount: 999,
      ndr_reason: "Customer not available",
      attempts: 2,
      courier_name: "Bluedart",
    };

    const result = mapShiprocketNdr(ndr);
    expect(result.orderId).toBe("ORD-NDR-1");
    expect(result.shipmentStatus).toBe("NDR");
    expect(result.ndrReason).toBe("Customer not available");
    expect(result.attemptCount).toBe(2);
    expect(result.paymentMode).toBe("COD");
    expect(result.orderValue).toBe(999);
  });

  it("treats zero-COD NDR as Unknown payment mode", () => {
    expect(mapShiprocketNdr({ awb: "AWB-3", cod_amount: 0 }).paymentMode).toBe("Unknown");
  });
});

describe("ShiprocketAdapter payment mode detection", () => {
  it("detects COD from method string", () => {
    expect(detectPaymentMode("COD")).toBe("COD");
    expect(detectPaymentMode("cash on delivery")).toBe("COD");
  });

  it("detects COD from non-zero COD amount even when method is unclear", () => {
    expect(detectPaymentMode(undefined, 500)).toBe("COD");
  });

  it("detects Prepaid for non-COD methods", () => {
    expect(detectPaymentMode("razorpay")).toBe("Prepaid");
    expect(detectPaymentMode("stripe")).toBe("Prepaid");
  });

  it("returns Unknown when both inputs are absent", () => {
    expect(detectPaymentMode(undefined, undefined)).toBe("Unknown");
    expect(detectPaymentMode("", undefined)).toBe("Unknown");
  });
});

describe("ShiprocketAdapter dedupe", () => {
  it("keeps NDR rows over regular order rows when orderId collides", () => {
    const ndr: IntegrationOrderInput = { orderId: "X1", orderValue: 100, paymentMode: "COD", shipmentStatus: "NDR", ndrReason: "Customer refused" };
    const order: IntegrationOrderInput = { orderId: "X1", orderValue: 100, paymentMode: "COD", shipmentStatus: "delivered" };
    const result = dedupe([ndr], [order]);
    expect(result).toHaveLength(1);
    expect(result[0].shipmentStatus).toBe("NDR");
    expect(result[0].ndrReason).toBe("Customer refused");
  });

  it("preserves all unique orderIds", () => {
    const a: IntegrationOrderInput = { orderId: "A", orderValue: 1, paymentMode: "COD" };
    const b: IntegrationOrderInput = { orderId: "B", orderValue: 2, paymentMode: "Prepaid" };
    const c: IntegrationOrderInput = { orderId: "C", orderValue: 3, paymentMode: "Unknown" };
    expect(dedupe([a], [b, c])).toHaveLength(3);
  });
});
