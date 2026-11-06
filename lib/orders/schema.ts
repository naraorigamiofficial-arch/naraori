import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);

export const COUNTRY = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, "Choose a country.");

export const orderRequestSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z
    .array(
      z.object({
        sku: text(64).min(1),
        colourId: text(32).min(1),
        units: z.coerce.number().int().min(1).max(500),
      }),
    )
    .min(1, "Your order sheet is empty.")
    .max(30),
  customer: z.object({
    name: text(120).min(2, "Please enter your name."),
    email: z.string().trim().toLowerCase().max(254).email("Please enter a valid email address."),
    phone: text(40).optional().default(""),
    city: text(80).min(2, "Please enter your city."),
    region: text(80).optional().default(""),
    postalCode: text(16).optional().default(""),
    country: COUNTRY,
  }),
  note: text(2000).optional().default(""),
  acknowledged: z.literal(true, { error: "Please confirm you understand this is an order request." }),
  // Spam protection: hidden field that must stay empty, and time on form.
  website: z.string().max(0).optional().default(""),
  startedAt: z.coerce.number().int().optional(),
});
export type OrderRequestInput = z.infer<typeof orderRequestSchema>;

export const enquirySchema = z.object({
  idempotencyKey: z.string().uuid(),
  kind: z.enum(["commission", "acquisition", "collaboration", "press", "general"]),
  name: text(120).min(2, "Please enter your name."),
  email: z.string().trim().toLowerCase().max(254).email("Please enter a valid email address."),
  organisation: text(160).optional().default(""),
  country: COUNTRY,
  budget: text(80).optional().default(""),
  timeline: text(80).optional().default(""),
  message: text(4000).min(20, "Please tell us a little more (at least 20 characters)."),
  website: z.string().max(0).optional().default(""),
  startedAt: z.coerce.number().int().optional(),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

/** Rejects bots that submit faster than a person could read the form. */
export function looksAutomated(startedAt: number | undefined, now = Date.now()) {
  if (!startedAt) return false;
  return now - startedAt < 1500;
}
