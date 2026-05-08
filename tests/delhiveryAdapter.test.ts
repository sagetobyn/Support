import { describe, it, expect } from "vitest";
import { mapDelhiveryNdrRow, mapDelhiveryPackage, cleanDelhiveryNdrReason } from "@/features/integrations/adapters/delhivery.adapter";
import { normalizeNdrReason } from "@/lib/ndr";

describe("DelhiveryAdapter NDR row mapping", () => {
  it("maps a typical NDR row to normalized order shape", () => {
    const row = {
      waybill: "DLV1234567890",
      ref_id: "ORD-001",
      consignee: "Rahul Kumar",
      consignee_phone: "+91 9876543210",
      city: "Pune",
      pincode: "411001",
      cod_amount: "1499.00",
      status: "NDR",
      reason: "CNA - Consignee not available",
      attempts: 2,
    };

    const result = mapDelhiveryNdrRow(row);
    expect(result.orderId).toBe("ORD-001");
    expect(result.awb).toBe("DLV1234567890");
    expect(result.customerName).toBe("Rahul Kumar");
    expect(result.phone).toBe("919876543210");
    expect(result.pincode).toBe("411001");
    expect(result.city).toBe("Pune");
    expect(result.orderValue).toBe(1499);
    expect(result.paymentMode).toBe("COD");
    expect(result.courier).toBe("Delhivery");
    expect(result.shipmentStatus).toBe("NDR");
    expect(result.ndrReason).toBe("Consignee not available");
    expect(result.attemptCount).toBe(2);
    expect(result.sourcePlatform).toBe("Delhivery");
  });

  it("falls back to AWB when ref_id is missing", () => {
    const row = { waybill: "DLV-99", cod_amount: "0" };
    expect(mapDelhiveryNdrRow(row).orderId).toBe("DLV-99");
  });

  it("treats zero COD amount as Unknown payment mode", () => {
    const row = { waybill: "DLV-1", cod_amount: "0" };
    expect(mapDelhiveryNdrRow(row).paymentMode).toBe("Unknown");
  });
});

describe("DelhiveryAdapter package (track) mapping", () => {
  it("maps a delivered package's last scan", () => {
    const pkg = {
      AWB: "DLV-555",
      "Ref Id": "ORD-555",
      "Consignee Name": "Priya",
      "Receiver Phone": "9123456789",
      "PinCode": "560001",
      "COD Amount": "799",
      "Payment Type": "COD",
      "Status": "Delivered",
      "Scans": [
        { Scan: "Picked Up", ScanDateTime: "2026-05-01T10:00:00Z" },
        { Scan: "Delivered", ScanDateTime: "2026-05-03T15:00:00Z" },
      ],
    };

    const result = mapDelhiveryPackage(pkg);
    expect(result.orderId).toBe("ORD-555");
    expect(result.awb).toBe("DLV-555");
    expect(result.shipmentStatus).toBe("Delivered");
    expect(result.finalStatus).toBe("Delivered");
    expect(result.paymentMode).toBe("COD");
    expect(result.ndrReason).toBeUndefined();
  });

  it("detects NDR from scan instructions and extracts reason", () => {
    const pkg = {
      AWB: "DLV-666",
      "Ref Id": "ORD-666",
      "COD Amount": "0",
      "Payment Type": "Prepaid",
      "Status": "In Transit",
      "Scans": [
        { Scan: "Out for Delivery", ScanDateTime: "2026-05-03T09:00:00Z" },
        { Scan: "Undelivered", Instructions: "CNA - Consignee not available", ScanDateTime: "2026-05-03T15:00:00Z" },
      ],
    };

    const result = mapDelhiveryPackage(pkg);
    expect(result.ndrReason).toBe("Consignee not available");
    expect(result.paymentMode).toBe("Prepaid");
  });
});

describe("cleanDelhiveryNdrReason + normalize integration", () => {
  it("strips Delhivery code prefixes", () => {
    expect(cleanDelhiveryNdrReason("CNA - Consignee not available")).toBe("Consignee not available");
    expect(cleanDelhiveryNdrReason("DEL: Customer refused delivery")).toBe("Customer refused delivery");
    expect(cleanDelhiveryNdrReason("404 - Address not found")).toBe("Address not found");
    expect(cleanDelhiveryNdrReason("")).toBe("");
    expect(cleanDelhiveryNdrReason(undefined)).toBe("");
  });

  it("hands cleaned Delhivery reasons to normalizeNdrReason successfully", () => {
    // Verifies the clean function output flows correctly through the existing NDR normalizer
    const cleaned = cleanDelhiveryNdrReason("CNA - Customer not available");
    const normalized = normalizeNdrReason(cleaned);
    expect(normalized.normalizedReason).toBe("customer_unavailable");
    expect(normalized.confidence).toBeGreaterThan(0.5);
  });
});
