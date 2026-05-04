import { describe, expect, it } from "vitest";
import { checkAddressQuality } from "@/lib/addressQuality";

describe("AddressQualityService", () => {
  it("detects missing landmark, invalid pincode, short address, and vague address", () => {
    const result = checkAddressQuality({
      fullAddress: "near mandir",
      pincode: "000000",
      city: "",
      phone: "9876543210"
    });

    expect(result.issues.join(" ")).toContain("Landmark");
    expect(result.issues.join(" ")).toContain("Pincode");
    expect(result.issues.join(" ")).toContain("short");
    expect(result.issues.join(" ")).toContain("vague");
    expect(result.score).toBeLessThan(60);
  });

  it("detects missing house number and returns a suggested question", () => {
    const result = checkAddressQuality({
      fullAddress: "near market main road",
      landmark: "near market",
      pincode: "411045",
      city: "Pune",
      phone: "9876543210"
    });

    expect(result.issues).toContain("House, flat, building, or street detail is missing");
    expect(result.issues).toContain("Address relies on vague landmark-only directions");
    expect(result.suggestedQuestion).toContain("alternate phone number");
  });
});
