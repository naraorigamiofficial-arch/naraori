import "server-only";
import { deliverFor, studioInbox } from "@/lib/notifications";
import { PricingError, priceRequest } from "@/lib/shop/pricing";
import { getStore } from "@/lib/store";
import type { Store } from "@/lib/store/types";
import { enquirySchema, looksAutomated, orderRequestSchema } from "./schema";

export type SubmitResult =
  | { ok: true; reference: string; token?: string; duplicate: boolean; emails: { studio: boolean; customer: boolean } }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string>; itemErrors?: { index: number; message: string }[] };

function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.map(String).join(".");
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

const UNAVAILABLE: SubmitResult = {
  ok: false,
  status: 503,
  error: "Online order requests are temporarily unavailable. Please email the studio instead. Nothing you entered has been sent.",
};

export async function submitOrderRequest(body: unknown, store: Store | null = getStore()): Promise<SubmitResult> {
  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 422, error: "Please check the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error.issues) };
  const input = parsed.data;
  // Bots: pretend success-free rejection without revealing which check fired.
  if (input.website || looksAutomated(input.startedAt)) return { ok: false, status: 400, error: "That was quicker than we expected. Please wait a moment and submit again." };
  const inbox = studioInbox();
  if (!store || !inbox) return UNAVAILABLE;

  const catalogue = await store.getCatalogue();
  let priced;
  try {
    priced = priceRequest(catalogue, input.items, input.customer.country);
  } catch (e) {
    if (e instanceof PricingError) return { ok: false, status: 422, error: "Some items on your order sheet need attention.", itemErrors: e.issues };
    throw e;
  }

  const { order, created } = await store.createOrderRequest(
    { idempotencyKey: input.idempotencyKey, customer: input.customer, note: input.note, ...priced },
    [
      { kind: "order_studio", recipient: inbox },
      { kind: "order_customer", recipient: input.customer.email },
    ],
  );
  // The request is safely stored before any email is attempted. Failures stay in the outbox.
  const sent = await deliverFor(store, { orderId: order.id });
  return {
    ok: true,
    reference: order.reference,
    token: order.publicToken,
    duplicate: !created,
    emails: { studio: !!sent.order_studio, customer: !!sent.order_customer },
  };
}

export async function submitEnquiry(body: unknown, store: Store | null = getStore()): Promise<SubmitResult> {
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 422, error: "Please check the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error.issues) };
  const { website, startedAt, ...input } = parsed.data;
  if (website || looksAutomated(startedAt)) return { ok: false, status: 400, error: "That was quicker than we expected. Please wait a moment and send again." };
  const inbox = studioInbox();
  if (!store || !inbox) return { ...UNAVAILABLE, error: "The enquiry form is temporarily unavailable. Please email the studio directly." } as SubmitResult;

  const { enquiry, created } = await store.createEnquiry(input, [
    { kind: "enquiry_studio", recipient: inbox },
    { kind: "enquiry_customer", recipient: input.email },
  ]);
  const sent = await deliverFor(store, { enquiryId: enquiry.id });
  return { ok: true, reference: enquiry.reference, duplicate: !created, emails: { studio: !!sent.enquiry_studio, customer: !!sent.enquiry_customer } };
}
