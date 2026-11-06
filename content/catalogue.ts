import type { Colour, PackOption, Product, ShippingRules } from "@/lib/shop/types";

/**
 * PAPER CATALOGUE: default commercial data.
 *
 * Descriptive copy lives here. Prices, MOQ, availability and colours are DEFAULTS:
 * when Supabase is connected, the `catalogue_options` / `catalogue_products` tables override
 * them and the owner edits them in /studio/catalogue without touching code.
 *
 * Sources:
 *  - 50 / 70 / 100 cm per-sheet prices & MOQ, and "150 cm+ by enquiry": owner's 2026 brief (provisional).
 *  - 10–37.5 cm pack prices, six colours, 200–600 cm, custom grid up to 256, 1-month lead time:
 *    the previous /Catalog page.
 *  - Shipping: the previous order modal.
 */

const rs = (rupees: number) => Math.round(rupees * 100);

export const colours: Colour[] = [
  { id: "red", name: "Red", hex: "#b5292e" },
  { id: "black", name: "Black", hex: "#1b1b18" },
  { id: "blue", name: "Blue", hex: "#1f4e8c" },
  { id: "yellow", name: "Yellow", hex: "#c99a1b" },
  { id: "green", name: "Green", hex: "#2e6b45" },
  { id: "white", name: "White", hex: "#fafaf7" },
];
const ALL = colours.map((c) => c.id);

const pack = (size: string, sheets: number, rupees: number): PackOption => ({
  sku: `dt-${size}-p${sheets}`,
  label: `Pack of ${sheets} sheets`,
  sheetsPerUnit: sheets,
  unitPrice: rs(rupees),
  minUnits: 1,
  maxUnits: 20,
  availability: "made_to_order",
});
const perSheet = (size: string, rupees: number, moq: number): PackOption => ({
  sku: `dt-${size}-sheet`,
  label: "Per sheet",
  sheetsPerUnit: 1,
  unitPrice: rs(rupees),
  minUnits: moq,
  maxUnits: 50,
  availability: "made_to_order",
});

const DT = "Double tissue (two layers of tissue bonded together)";
const TREAT = "Hand-treated in the studio";
const PACKING_SMALL = "Packed flat between boards.";
const PACKING_LARGE = "Large sheets are rolled around a tube to avoid hard creases; packing is confirmed with your order.";
const LIMITS = [
  "Each batch is made by hand, so colour can vary slightly between batches.",
  "Approximate weight (GSM) has not yet been measured and published.",
];

function starter(sizeCm: number, label: string, packs: [number, number][]): Product {
  const key = String(sizeCm).replace(".", "-");
  return {
    slug: `double-tissue-${key}cm`,
    published: true,
    name: `Treated double-tissue paper, ${label}`,
    shortName: label,
    group: "starter",
    construction: DT,
    treatment: TREAT,
    sizeCm,
    sizeLabel: `${label} × ${label}`,
    gsm: null,
    colourIds: ALL,
    pricing: "fixed",
    options: packs.map(([n, p]) => pack(key, n, p)),
    summary: `Small ${label} squares of the same double tissue used for the studio's sculptures, for learning, practice folds and smaller models.`,
    applications: ["Practice and learning", "Smaller and intermediate models", "Test folds before committing a large sheet"],
    packing: PACKING_SMALL,
    limitations: LIMITS,
  };
}

function artist(sizeCm: number, rupees: number, moq: number, applications: string[]): Product {
  return {
    slug: `double-tissue-${sizeCm}cm`,
    published: true,
    name: `Treated double-tissue paper, ${sizeCm} cm`,
    shortName: `${sizeCm} cm`,
    group: "artist",
    construction: DT,
    treatment: TREAT,
    sizeCm,
    sizeLabel: `${sizeCm} × ${sizeCm} cm`,
    gsm: null,
    colourIds: ALL,
    pricing: "fixed",
    options: [perSheet(String(sizeCm), rupees, moq)],
    summary: `Large-format ${sizeCm} cm squares of hand-treated double tissue, the material the studio uses for its own complex sculptures.`,
    applications,
    packing: sizeCm >= 70 ? PACKING_LARGE : PACKING_SMALL,
    limitations: LIMITS,
    todo: ["Price & MOQ provisional, confirm before launch"],
  };
}

export const products: Product[] = [
  starter(10, "10 cm", [[20, 200], [30, 300], [50, 500], [70, 700], [140, 1400]]),
  starter(15, "15 cm", [[20, 270], [30, 390], [50, 600], [100, 1100]]),
  starter(20, "20 cm", [[25, 800], [50, 1500]]),
  starter(25, "25 cm", [[5, 600], [10, 1100], [25, 2100], [50, 3300]]),
  starter(37.5, "37.5 cm", [[5, 800], [10, 1800], [25, 3400], [50, 5400]]),
  artist(50, 259, 5, ["Intermediate and complex models", "Box-pleated designs on moderate grids"]),
  artist(70, 389, 2, ["Complex models", "Figures with many small flaps"]),
  artist(100, 999, 2, ["Highly complex models on large grids", "Exhibition-scale sculpture"]),
  {
    slug: "large-format-double-tissue",
    published: true,
    name: "Large-format double tissue, 150 cm to 600 cm",
    shortName: "150–600 cm",
    group: "large",
    construction: DT,
    treatment: TREAT,
    sizeCm: 150,
    sizeLabel: "150 cm, and made-to-order sheets from 200 cm up to 600 cm",
    gsm: null,
    colourIds: ALL,
    pricing: "enquiry",
    options: [
      { sku: "dt-150-enquiry", label: "150 cm sheet", sheetsPerUnit: 1, unitPrice: 0, minUnits: 1, maxUnits: 10, availability: "by_enquiry" },
      { sku: "dt-200-enquiry", label: "200 cm sheet", sheetsPerUnit: 1, unitPrice: 0, minUnits: 1, maxUnits: 5, availability: "by_enquiry" },
      { sku: "dt-300-enquiry", label: "300 cm sheet", sheetsPerUnit: 1, unitPrice: 0, minUnits: 1, maxUnits: 5, availability: "by_enquiry" },
      { sku: "dt-400-enquiry", label: "400 cm sheet", sheetsPerUnit: 1, unitPrice: 0, minUnits: 1, maxUnits: 3, availability: "by_enquiry" },
      { sku: "dt-600-enquiry", label: "600 cm sheet", sheetsPerUnit: 1, unitPrice: 0, minUnits: 1, maxUnits: 2, availability: "by_enquiry" },
    ],
    summary: "Sheets for mega-projects. The studio's own sculptures are folded from 150 cm squares and 1 m × 2 m rectangles; larger sheets up to six metres are made for the order.",
    applications: ["Sculptures on very large grids (64 and above)", "Installations and oversized art"],
    packing: PACKING_LARGE,
    limitations: ["Made to order: plan on at least one month before your project date.", ...LIMITS],
  },
  {
    slug: "custom-grid-and-colour",
    published: true,
    name: "Custom grid, duo-colour and dyed paper",
    shortName: "Custom",
    group: "custom",
    construction: DT,
    treatment: TREAT,
    sizeCm: null,
    sizeLabel: "Any size the studio makes",
    gsm: null,
    colourIds: ALL,
    pricing: "enquiry",
    options: [
      { sku: "custom-grid", label: "Pre-gridded sheet (up to a 256-line grid)", sheetsPerUnit: 1, unitPrice: 0, minUnits: 1, maxUnits: 10, availability: "by_enquiry" },
      { sku: "custom-duo", label: "Duo-colour sheet", sheetsPerUnit: 1, unitPrice: 0, minUnits: 1, maxUnits: 10, availability: "by_enquiry" },
      { sku: "custom-dyed", label: "Dyed sheet", sheetsPerUnit: 1, unitPrice: 0, minUnits: 1, maxUnits: 10, availability: "by_enquiry" },
    ],
    summary: "Sheets made for a specific project: a pre-marked grid of up to 256 lines, two-colour sheets for colour changes, or custom-dyed paper.",
    applications: ["Colour-change designs", "Precise folding on very fine grids"],
    packing: PACKING_LARGE,
    limitations: ["Large custom grid paper can only be made when a production slot is open.", "Made to order: plan on at least one month.", ...LIMITS],
  },
];

export const shipping: ShippingRules = {
  domestic: { flat: rs(140), freeAbove: rs(2000) },
  international: { flatUsdCents: 3000, freeAboveUsdCents: 20000 },
  note: "Shipping shown here is an estimate. The studio confirms the final shipping cost by email before you pay.",
};
