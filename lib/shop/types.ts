/** All money is integer paise (₹1 = 100 paise). Never floats. */
export type Paise = number;

export type Availability = "made_to_order" | "in_stock" | "by_enquiry" | "unavailable";

export interface Colour {
  id: string;
  name: string;
  hex: string;
}

/** A purchasable option of a product: e.g. "single sheet" or "pack of 20 sheets". */
export interface PackOption {
  sku: string;
  label: string;
  sheetsPerUnit: number;
  unitPrice: Paise;
  /** Minimum number of units (MOQ). */
  minUnits: number;
  maxUnits: number;
  availability: Availability;
}

export interface Product {
  slug: string;
  published: boolean;
  name: string;
  shortName: string;
  group: "starter" | "artist" | "large" | "custom";
  construction: string;
  treatment: string;
  /** Sheet edge in cm (squares). null for custom work. */
  sizeCm: number | null;
  sizeLabel: string;
  gsm: string | null; // "Approximate GSM", null until measured
  colourIds: string[];
  pricing: "fixed" | "enquiry";
  options: PackOption[];
  summary: string;
  applications: string[];
  packing: string;
  limitations: string[];
  /** Internal verification notes, never rendered publicly. */
  todo?: string[];
}

export interface ShippingRules {
  domestic: { flat: Paise; freeAbove: Paise | null };
  international: { flatUsdCents: number; freeAboveUsdCents: number | null };
  note: string;
}
