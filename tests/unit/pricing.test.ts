import { describe, expect, it } from "vitest";
import { PricingError, priceRequest } from "@/lib/shop/pricing";
import { mergeCatalogue } from "@/lib/store/catalogue-merge";

const cat = mergeCatalogue({}, {});

describe("priceRequest (server-side totals)", () => {
  it("prices 50 cm sheets at ₹259 with MOQ 5", () => {
    const r = priceRequest(cat, [{ sku: "dt-50-sheet", colourId: "red", units: 5 }], "IN");
    expect(r.lines[0].unitPrice).toBe(25900);
    expect(r.subtotal).toBe(5 * 25900);
    expect(r.shippingEstimate).toEqual({ region: "domestic", amount: 14000, free: false });
  });

  it("rejects quantities below the minimum", () => {
    expect(() => priceRequest(cat, [{ sku: "dt-70-sheet", colourId: "black", units: 1 }], "IN")).toThrow(PricingError);
  });

  it("checks MOQ on merged lines (3 + 2 of the same item = 5)", () => {
    const r = priceRequest(cat, [{ sku: "dt-50-sheet", colourId: "red", units: 3 }, { sku: "dt-50-sheet", colourId: "red", units: 2 }], "IN");
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0].units).toBe(5);
  });

  it("gives free domestic shipping at ₹2,000 and above", () => {
    const r = priceRequest(cat, [{ sku: "dt-100-sheet", colourId: "white", units: 2 }], "IN");
    expect(r.subtotal).toBe(199800);
    expect(r.shippingEstimate).toMatchObject({ free: false });
    const r2 = priceRequest(cat, [{ sku: "dt-100-sheet", colourId: "white", units: 3 }], "IN");
    expect(r2.shippingEstimate).toEqual({ region: "domestic", amount: 0, free: true });
  });

  it("uses international estimate outside India", () => {
    const r = priceRequest(cat, [{ sku: "dt-10-p20", colourId: "blue", units: 1 }], "US");
    expect(r.shippingEstimate).toEqual({ region: "international", usdCents: 3000, free: false });
  });

  it("treats enquiry items as unpriced and excludes them from the subtotal", () => {
    const r = priceRequest(cat, [{ sku: "dt-150-enquiry", colourId: "black", units: 1 }, { sku: "dt-50-sheet", colourId: "red", units: 5 }], "IN");
    expect(r.hasEnquiryItems).toBe(true);
    expect(r.lines.find((l) => l.sku === "dt-150-enquiry")!.lineTotal).toBeNull();
    expect(r.subtotal).toBe(5 * 25900);
  });

  it("rejects unknown SKUs, unknown colours and unpublished products", () => {
    expect(() => priceRequest(cat, [{ sku: "nope", colourId: "red", units: 1 }], "IN")).toThrow(PricingError);
    expect(() => priceRequest(cat, [{ sku: "dt-50-sheet", colourId: "purple", units: 5 }], "IN")).toThrow(PricingError);
    const hidden = mergeCatalogue({}, { "double-tissue-50cm": false });
    expect(() => priceRequest(hidden, [{ sku: "dt-50-sheet", colourId: "red", units: 5 }], "IN")).toThrow(PricingError);
  });

  it("applies database overrides for price, MOQ and availability", () => {
    const over = mergeCatalogue({ "dt-50-sheet": { unitPrice: 30000, minUnits: 2 } }, {});
    const r = priceRequest(over, [{ sku: "dt-50-sheet", colourId: "red", units: 2 }], "IN");
    expect(r.subtotal).toBe(60000);
    const off = mergeCatalogue({ "dt-50-sheet": { availability: "unavailable" } }, {});
    expect(() => priceRequest(off, [{ sku: "dt-50-sheet", colourId: "red", units: 5 }], "IN")).toThrow(/unavailable/);
  });

  it("rejects an empty sheet", () => {
    expect(() => priceRequest(cat, [], "IN")).toThrow(PricingError);
  });
});
