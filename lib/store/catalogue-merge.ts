import { colours, products, shipping } from "@/content/catalogue";
import type { Catalogue } from "@/lib/shop/catalogue";
import type { OptionPatch } from "./types";

/** Apply database overrides (price, MOQ, availability, published) on top of the content defaults. */
export function mergeCatalogue(
  optionOverrides: Record<string, OptionPatch>,
  publishedOverrides: Record<string, boolean>,
): Catalogue {
  return {
    colours,
    shipping,
    products: products.map((p) => ({
      ...p,
      published: publishedOverrides[p.slug] ?? p.published,
      options: p.options.map((o) => ({ ...o, ...(optionOverrides[o.sku] ?? {}) })),
    })),
  };
}
