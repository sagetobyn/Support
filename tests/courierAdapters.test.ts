import { describe, it, expect } from "vitest";
import { mapNimbusPostShipment, type NimbusPostShipment } from "@/features/integrations/adapters/nimbuspost.adapter";
import { mapXpressBeesShipment, type XpressBeesShipment } from "@/features/integrations/adapters/xpressbees.adapter";
import { mapEcomExpressShipment, type EcomExpressShipment } from "@/features/integrations/adapters/ecomexpress.adapter";
import { mapBluedartShipment, type BluedartShipment } from "@/features/integrations/adapters/bluedart.adapter";

describe("NimbusPost mapping", () => {
  const base: NimbusPostShipment = {
    order_number: "OD-NB-1",
    awb: "NB-AWB-001",
    courier: "Delhivery",
    status: "in_transit",
    payment_method: "COD",
    amount: 999,
    customer_name: "Rahul",
    customer_phone: "+91 9876543210",
    customer_pincode: "411001",
    customer_city: "Pune",
  };

  it("maps a regular shipment", () => {
    const r = mapNimbusPostShipment(base);
    expect(r.orderId).toBe("OD-NB-1");
    expect(r.paymentMode).toBe("COD");
    expect(r.phone).toBe("919876543210");
    expect(r.courier).toBe("Delhivery");
    expect(r.shipmentStatus).toBe("in_transit");
    expect(r.sourcePlatform).toBe("NimbusPost");
  });

  it("flips status to NDR for ndr/undelivered states", () => {
    expect(mapNimbusPostShipment({ ...base, status: "ndr", ndr_reason: "CNA" }).shipmentStatus).toBe("NDR");
    expect(mapNimbusPostShipment({ ...base, status: "undelivered" }).shipmentStatus).toBe("NDR");
    expect(mapNimbusPostShipment({ ...base, status: "rto-initiated" }).shipmentStatus).toBe("NDR");
  });
});

describe("XpressBees mapping", () => {
  const base: XpressBeesShipment = {
    awb_number: "XB-001",
    order_number: "OD-XB-1",
    customer_name: "Priya",
    customer_phone: "9123456789",
    customer_pincode: "560001",
    cod_amount: 1499,
    payment_mode: "COD",
    status: "Out for Delivery",
  };

  it("maps a regular XB shipment", () => {
    const r = mapXpressBeesShipment(base);
    expect(r.orderId).toBe("OD-XB-1");
    expect(r.paymentMode).toBe("COD");
    expect(r.courier).toBe("XpressBees");
    expect(r.orderValue).toBe(1499);
  });

  it("detects COD from non-zero cod_amount even when payment_mode missing", () => {
    expect(mapXpressBeesShipment({ ...base, payment_mode: undefined }).paymentMode).toBe("COD");
  });

  it("flips status to NDR for ndr-style states", () => {
    expect(mapXpressBeesShipment({ ...base, status: "NDR", ndr_reason: "Door locked" }).shipmentStatus).toBe("NDR");
    expect(mapXpressBeesShipment({ ...base, status: "Out for Delivery - NDR" }).shipmentStatus).toBe("NDR");
  });
});

describe("Ecom Express mapping", () => {
  const base: EcomExpressShipment = {
    awb_number: "EE-001",
    reference_number: "OD-EE-1",
    consignee: "Amit",
    consignee_phone: "9988776655",
    consignee_pincode: "110001",
    consignee_city: "Delhi",
    cod_amount: 599,
    status: "in_transit",
  };

  it("maps a regular EE shipment", () => {
    const r = mapEcomExpressShipment(base);
    expect(r.orderId).toBe("OD-EE-1");
    expect(r.paymentMode).toBe("COD");
    expect(r.courier).toBe("Ecom Express");
    expect(r.pincode).toBe("110001");
  });

  it("treats zero cod_amount as Prepaid", () => {
    expect(mapEcomExpressShipment({ ...base, cod_amount: 0 }).paymentMode).toBe("Prepaid");
  });

  it("flips status to NDR with reason", () => {
    expect(mapEcomExpressShipment({ ...base, status: "NDR", reason: "Customer not available" }).shipmentStatus).toBe("NDR");
    expect(mapEcomExpressShipment({ ...base, status: "undelivered" }).shipmentStatus).toBe("NDR");
  });
});

describe("Bluedart mapping", () => {
  const base: BluedartShipment = {
    WaybillNo: "BD-9999",
    RefNo: "OD-BD-1",
    Status: "InTransit",
    StatusType: "InTransit",
    Origin: "Mumbai",
    Destination: "411001",
    Consignee: "Rahul",
    ConsigneePincode: "411001",
    ConsigneePhone: "9876543210",
    COD: true,
    CODAmount: 1999,
    Scans: [
      { Scan: "Picked Up", ScanDate: "2026-05-01" },
      { Scan: "In Transit", ScanDate: "2026-05-02" },
    ],
  };

  it("maps a regular Bluedart shipment", () => {
    const r = mapBluedartShipment(base);
    expect(r.orderId).toBe("OD-BD-1");
    expect(r.awb).toBe("BD-9999");
    expect(r.paymentMode).toBe("COD");
    expect(r.orderValue).toBe(1999);
    expect(r.courier).toBe("Bluedart");
  });

  it("flips to NDR when StatusType is Undelivered", () => {
    const ndr = { ...base, StatusType: "Undelivered", Scans: [{ Scan: "CNA - consignee not available" }] };
    expect(mapBluedartShipment(ndr).shipmentStatus).toBe("NDR");
    expect(mapBluedartShipment(ndr).ndrReason).toMatch(/CNA/);
  });

  it("detects NDR from scan text even when StatusType is generic", () => {
    const indirectNdr = { ...base, StatusType: "InTransit", Scans: [{ Scan: "Undeliverable - door locked" }] };
    expect(mapBluedartShipment(indirectNdr).shipmentStatus).toBe("NDR");
  });

  it("treats COD=false and zero amount as Prepaid", () => {
    expect(mapBluedartShipment({ ...base, COD: false, CODAmount: 0 }).paymentMode).toBe("Prepaid");
  });
});
