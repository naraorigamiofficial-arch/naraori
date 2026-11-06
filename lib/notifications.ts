import "server-only";
import { emailConfig, getEmailSender } from "@/lib/email/sender";
import { enquiryCustomerEmail, enquiryStudioEmail, orderCustomerEmail, orderStudioEmail, type EmailMessage } from "@/lib/email/templates";
import type { NotificationRecord, Store } from "@/lib/store/types";

export const MAX_ATTEMPTS = 8;

async function buildMessage(store: Store, n: NotificationRecord): Promise<EmailMessage> {
  const cfg = emailConfig() ?? devConfig();
  if (n.orderId) {
    const o = await store.getOrder(n.orderId);
    if (!o) throw new Error("Order not found");
    return n.kind === "order_studio" ? orderStudioEmail(o, n.recipient) : orderCustomerEmail(o, cfg.replyTo);
  }
  const e = n.enquiryId ? await store.getEnquiry(n.enquiryId) : null;
  if (!e) throw new Error("Enquiry not found");
  return n.kind === "enquiry_studio" ? enquiryStudioEmail(e, n.recipient) : enquiryCustomerEmail(e, cfg.replyTo);
}

function devConfig() {
  return { from: "dev@localhost", replyTo: "studio@localhost", studioInbox: "studio@localhost" };
}

/** Recipients for a new request. The studio inbox comes from configuration only. */
export function studioInbox() {
  return emailConfig()?.studioInbox ?? (process.env.NODE_ENV !== "production" || process.env.NARA_FILE_STORE === "1" ? devConfig().studioInbox : null);
}

/**
 * Deliver one outbox job. Safe to call repeatedly: the outbox id is the Resend idempotency key,
 * so a retry after a timeout cannot send the same email twice.
 */
export async function deliver(store: Store, n: NotificationRecord): Promise<boolean> {
  if (n.status === "sent") return true;
  const attempts = n.attempts + 1;
  try {
    const msg = await buildMessage(store, n);
    const { id } = await getEmailSender().send(msg, `nara-${n.id}`);
    await store.updateNotification(n.id, { status: "sent", attempts, providerId: id, lastError: null });
    return true;
  } catch (e) {
    const message = (e as Error).message.slice(0, 900);
    console.error(`[notify] ${n.kind} ${n.id} attempt ${attempts} failed: ${message}`);
    await store.updateNotification(n.id, { status: "failed", attempts, lastError: message });
    return false;
  }
}

export async function deliverFor(store: Store, ref: { orderId?: string; enquiryId?: string }) {
  const list = await store.listNotifications(ref);
  const out: Partial<Record<NotificationRecord["kind"], boolean>> = {};
  await Promise.all(
    list.map(async (n) => {
      out[n.kind] = n.status === "sent" ? true : await deliver(store, n);
    }),
  );
  return out;
}

/** Retry everything that has not been sent yet (cron / dashboard button). */
export async function retryPending(store: Store) {
  const pending = [...(await store.listNotifications({ status: "pending" })), ...(await store.listNotifications({ status: "failed" }))];
  let sent = 0;
  for (const n of pending) if (n.attempts < MAX_ATTEMPTS && (await deliver(store, n))) sent++;
  return { attempted: pending.length, sent };
}
