import { describe, expect, it } from "vitest";
import { defaultBrand } from "@/data/seed";
import { importOrdersFromCsv } from "@/lib/csvImport";

describe("CSVImportService", () => {
  it("parses, normalizes, validates, and scores CSV rows", () => {
    const csv = `order_id,customer_name,phone,full_address,pincode,city,order_value,payment_mode,courier,shipment_status,ndr_reason
T-1,Rahul,9876543221,"Near mandir ghaziabad",201001,Ghaziabad,1999,COD,Xpressbees,Undelivered,Incorrect address
T-2,Sneha,9123456721,"Flat 12 Tower B Koramangala Bengaluru",560095,Bengaluru,799,Prepaid,Ekart,Delivered,`;

    const summary = importOrdersFromCsv({ csv, brandId: defaultBrand.id, settings: defaultBrand });
    expect(summary.successCount).toBe(2);
    expect(summary.errorCount).toBe(0);
    expect(summary.orders[0].paymentMode).toBe("COD");
    expect(summary.orders[0].riskScore).toBeGreaterThan(0);
  });

  it("reports malformed rows", () => {
    const summary = importOrdersFromCsv({ csv: "order_id,order_value\n,abc", brandId: defaultBrand.id, settings: defaultBrand });
    expect(summary.errorCount).toBe(1);
  });

  it("maps aliases, parses INR values, and updates duplicates by order_id plus awb", () => {
    const csv = `name,tracking number,customer_mobile,shipping address,pincode,city,order amount,cod/prepaid,status,delivery status
T-10,AWB10,9876543210,"House 9 Block A Pune",411045,Pune,"₹1,999",Cash on delivery,In Transit,In Transit`;
    const first = importOrdersFromCsv({ csv, brandId: defaultBrand.id, settings: defaultBrand });
    const second = importOrdersFromCsv({ csv, brandId: defaultBrand.id, settings: defaultBrand, existingOrders: first.orders });

    expect(first.orders[0].orderId).toBe("T-10");
    expect(first.orders[0].awb).toBe("AWB10");
    expect(first.orders[0].orderValue).toBe(1999);
    expect(first.orders[0].paymentMode).toBe("COD");
    expect(second.updated).toBe(1);
  });

  it("allows missing optional customer identity data but records quality warnings", () => {
    const csv = `order_id,awb,full_address,pincode,order_value,payment_mode
T-11,AWB11,"House 9 Block A, Pune Residency, Baner Road",411045,999,COD`;
    const summary = importOrdersFromCsv({ csv, brandId: defaultBrand.id, settings: defaultBrand });

    expect(summary.successCount).toBe(1);
    expect(summary.errorCount).toBe(0);
    expect(summary.orders[0].customerName).toBe("");
    expect(summary.orders[0].rawData.data_quality_warnings).toContain("Missing phone");
  });
});
