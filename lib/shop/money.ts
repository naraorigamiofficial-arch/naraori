import type { Paise } from "./types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0 });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const formatINR = (p: Paise) => inr.format(p / 100);
export const formatUSDCents = (c: number) => usd.format(c / 100);
