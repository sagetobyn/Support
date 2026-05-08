import { describe, it, expect } from "vitest";
import { mapAmazonOrder, type AmazonOrder } from "@/features/integrations/adapters/amazon.adapter";
import { mapFlipkartShipment, type FlipkartShipment } from "@/features/integrations/adapters/flipkart.adapter";
import { mapMeeshoOrder, type MeeshoOrder } from "@/features/integrations/adapters/meesho.adapter";

describe("AmazonAdapter mapping", () => {
  const baseOrder: AmazonOrder = {
    AmazonOrderId: "171-1234567-1234567",
    PurchaseDate: "2026-05-01T10:00:00Z",
    OrderStatus: "Unshipped",
    PaymentMethod: "COD",
    OrderTotal: { Amount: "1499.00", CurrencyCode: "INR" },
    ShippingAddress: {
      Name: "Rahul Kumar",
      AddressLine1: "House 10",
      City: "Pune",
      StateOrRegion: "MH",
      PostalCode: "411001",
      Phone: "+91-9876543210",
    },
    BuyerInfo: { BuyerName: "Rahul Kumar", BuyerEmail: "rahul@example.com" },
  };

  it("maps a COD Amazon order", () => {
    const result = mapAmazonOrder(baseOrder, [{ Title: "Sneakers", SellerSKU: "SKU-1", QuantityOrdered: 1 }]);
    expect(result.orderId).toBe("171-1234567-1234567");
    expect(result.paymentMode).toBe("COD");
    expect(result.orderValue).toBe(1499);
    expect(result.customerName).toBe("Rahul Kumar");
    expect(result.phone).toBe("919876543210");
    expect(result.pincode).toBe("411001");
    expect(result.productName).toBe("Sneakers");
    expect(result.sourcePlatform).toBe("Amazon");
  });

  it("detects COD from PaymentMethodDetails when PaymentMethod is 'Other'", () => {
    const order = { ...baseOrder, PaymentMethod: "Other", PaymentMethodDetails: ["Cash On Delivery"] };
    expect(mapAmazonOrder(order).paymentMode).toBe("COD");
  });

  it("returns Unknown when payment method is 'Other' with no details", () => {
    const order = { ...baseOrder, PaymentMethod: "Other", PaymentMethodDetails: undefined };
    expect(mapAmazonOrder(order).paymentMode).toBe("Unknown");
  });

  it("sums quantity across multiple items", () => {
    const items = [
      { Title: "A", SellerSKU: "A", QuantityOrdered: 2 },
      { Title: "B", SellerSKU: "B", QuantityOrdered: 3 },
    ];
    expect(mapAmazonOrder(baseOrder, items).quantity).toBe(5);
  });

  it("uses separate shipping address when provided", () => {
    const customAddress = { AddressLine1: "Office 5", City: "Bangalore", PostalCode: "560001" };
    const result = mapAmazonOrder(baseOrder, [], customAddress);
    expect(result.addressLine1).toBe("Office 5");
    expect(result.city).toBe("Bangalore");
    expect(result.pincode).toBe("560001");
  });
});

describe("FlipkartAdapter mapping", () => {
  const baseShipment: FlipkartShipment = {
    shipmentId: "SHIP-1",
    orderId: "OD-12345",
    orderState: "shipped",
    paymentType: "COD",
    amount: 1499,
    trackingId: "FK-AWB-001",
    courierName: "Ekart",
    orderDate: "2026-05-01T10:00:00Z",
    productTitle: "Sneakers",
    sku: "SKU-1",
    quantity: 1,
    shippingAddress: {
      contactName: "Rahul",
      addressLine1: "House 10",
      city: "Pune",
      state: "MH",
      pincode: "411001",
      phone: "9876543210",
    },
  };

  it("maps a COD Flipkart shipment", () => {
    const result = mapFlipkartShipment(baseShipment);
    expect(result.orderId).toBe("OD-12345");
    expect(result.paymentMode).toBe("COD");
    expect(result.awb).toBe("FK-AWB-001");
    expect(result.courier).toBe("Ekart");
    expect(result.shipmentStatus).toBe("shipped");
    expect(result.phone).toBe("9876543210");
    expect(result.sourcePlatform).toBe("Flipkart");
  });

  it("detects PREPAID payment", () => {
    expect(mapFlipkartShipment({ ...baseShipment, paymentType: "PREPAID" }).paymentMode).toBe("Prepaid");
  });

  it("returns Unknown when paymentType is missing", () => {
    expect(mapFlipkartShipment({ ...baseShipment, paymentType: undefined }).paymentMode).toBe("Unknown");
  });
});

describe("MeeshoAdapter mapping", () => {
  const baseOrder: MeeshoOrder = {
    order_id: "MSH-1",
    sub_order_id: "MSH-1-SUB-1",
    order_date: "2026-05-01T10:00:00Z",
    order_status: "SHIPPED",
    payment_method: "COD",
    total_amount: 499,
    awb_number: "MSH-AWB-001",
    courier_partner: "Ecom Express",
    customer_name: "Priya",
    customer_phone: "+91 9123456789",
    customer_address: "Flat 22, Tower B",
    customer_pincode: "560001",
    customer_city: "Bangalore",
    customer_state: "Karnataka",
    product_name: "T-shirt",
    sku: "TS-001",
    quantity: 1,
  };

  it("maps a Meesho order using sub_order_id when present", () => {
    const result = mapMeeshoOrder(baseOrder);
    expect(result.orderId).toBe("MSH-1-SUB-1");
    expect(result.paymentMode).toBe("COD");
    expect(result.orderValue).toBe(499);
    expect(result.awb).toBe("MSH-AWB-001");
    expect(result.courier).toBe("Ecom Express");
    expect(result.phone).toBe("919123456789");
    expect(result.sourcePlatform).toBe("Meesho");
  });

  it("flips shipmentStatus to NDR for RTO_INITIATED orders", () => {
    const ndrOrder = { ...baseOrder, order_status: "RTO_INITIATED", ndr_reason: "Customer not available" };
    const result = mapMeeshoOrder(ndrOrder);
    expect(result.shipmentStatus).toBe("NDR");
    expect(result.ndrReason).toBe("Customer not available");
    expect(result.finalStatus).toBe("RTO_INITIATED");
  });

  it("treats UNDELIVERED status as NDR", () => {
    expect(mapMeeshoOrder({ ...baseOrder, order_status: "UNDELIVERED" }).shipmentStatus).toBe("NDR");
  });

  it("falls back to order_id when sub_order_id missing", () => {
    expect(mapMeeshoOrder({ ...baseOrder, sub_order_id: undefined }).orderId).toBe("MSH-1");
  });
});
