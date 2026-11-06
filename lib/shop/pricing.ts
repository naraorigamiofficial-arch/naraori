import type { Catalogue } from "./catalogue";
import { findOption } from "./catalogue";
import type { Paise } from "./types";

export interface RequestedItem {
  sku: string;
  colourId: string;
  units: number;
}

export interface PricedLine {
  sku: string;
  productSlug: string;
  productName: string;
  optionLabel: string;
  sizeLabel: string;
  colourId: string;
  colourName: string;
  units: number;
  sheetsPerUnit: number;
  /** null = price by enquiry */
  unitPrice: Paise | null;
  lineTotal: Paise | null;
}

export interface PricedRequest {
  lines: PricedLine[];
  /** Sum of all fixed-price lines. */
  subtotal: Paise;
  hasEnquiryItems: boolean;
  shippingEstimate:
    | { region: "domestic"; amount: Paise; free: boolean }
    | { region: "international"; usdCents: number; free: boolean };
}

export class PricingError extends Error {
  constructor(public readonly issues: { index: number; message: string }[]) {
    super(issues.map((i) => i.message).join("; "));
    this.name = "PricingError";
  }
}

/** Combine repeated sku+colour lines so MOQ is checked on the real total. */
export function mergeItems(items: RequestedItem[]): RequestedItem[] {
  const map = new Map<string, RequestedItem>();
  for (const it of items) {
    const key = `${it.sku}::${it.colourId}`;
    const prev = map.get(key);
    map.set(key, prev ? { ...prev, units: prev.units + it.units } : { ...it });
  }
  return [...map.values()];
}

/**
 * The ONLY place totals are computed. Runs on the server with trusted catalogue records.
 * The client may show the same numbers, but they are never accepted from the client.
 */
export function priceRequest(cat: Catalogue, rawItems: RequestedItem[], countryCode: string): PricedRequest {
  const items = mergeItems(rawItems);
  const issues: { index: number; message: string }[] = [];
  const lines: PricedLine[] = [];

  items.forEach((it, index) => {
    const found = findOption(cat, it.sku);
    if (!found || !found.product.published) {
      issues.push({ index, message: "This item is no longer available." });
      return;
    }
    const { product, option } = found;
    if (option.availability === "unavailable") {
      issues.push({ index, message: `${product.shortName}, ${option.label} is currently unavailable.` });
      return;
    }
    const colour = cat.colours.find((c) => c.id === it.colourId);
    if (!colour || !product.colourIds.includes(colour.id)) {
      issues.push({ index, message: `Choose an available colour for ${product.shortName}.` });
      return;
    }
    if (!Number.isInteger(it.units) || it.units < option.minUnits) {
      issues.push({ index, message: `${product.shortName}, ${option.label}: the minimum order is ${option.minUnits}.` });
      return;
    }
    if (it.units > option.maxUnits) {
      issues.push({ index, message: `${product.shortName}, ${option.label}: for more than ${option.maxUnits}, please write to the studio.` });
      return;
    }
    const enquiry = product.pricing === "enquiry" || option.availability === "by_enquiry";
    const unitPrice = enquiry ? null : option.unitPrice;
    lines.push({
      sku: option.sku,
      productSlug: product.slug,
      productName: product.name,
      optionLabel: option.label,
      sizeLabel: product.sizeLabel,
      colourId: colour.id,
      colourName: colour.name,
      units: it.units,
      sheetsPerUnit: option.sheetsPerUnit,
      unitPrice,
      lineTotal: unitPrice === null ? null : unitPrice * it.units,
    });
  });

  if (issues.length) throw new PricingError(issues);
  if (!lines.length) throw new PricingError([{ index: 0, message: "Your order sheet is empty." }]);

  const subtotal = lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0);
  const domestic = countryCode.toUpperCase() === "IN";
  const s = cat.shipping;
  const shippingEstimate: PricedRequest["shippingEstimate"] = domestic
    ? (() => {
        const free = s.domestic.freeAbove !== null && subtotal >= s.domestic.freeAbove;
        return { region: "domestic" as const, amount: free ? 0 : s.domestic.flat, free };
      })()
    : { region: "international" as const, usdCents: s.international.flatUsdCents, free: false };

  return { lines, subtotal, hasEnquiryItems: lines.some((l) => l.unitPrice === null), shippingEstimate };
}
