import type { Colour, PackOption, Product, ShippingRules } from "./types";

export interface Catalogue {
  products: Product[];
  colours: Colour[];
  shipping: ShippingRules;
}

export interface ResolvedOption {
  product: Product;
  option: PackOption;
}

export function findOption(cat: Catalogue, sku: string): ResolvedOption | null {
  for (const product of cat.products) {
    const option = product.options.find((o) => o.sku === sku);
    if (option) return { product, option };
  }
  return null;
}

export const publicProducts = (cat: Catalogue) => cat.products.filter((p) => p.published);
