import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setEmailSenderForTests, type EmailSender } from "@/lib/email/sender";
import { retryPending } from "@/lib/notifications";
import { submitOrderRequest } from "@/lib/orders/service";
import { FileStore } from "@/lib/store/file";

let dir: string;
let store: FileStore;
let sent: { to: string; key: string }[];

class FakeSender implements EmailSender {
  readonly kind = "dev-file" as const;
  failing = false;
  async send(msg: { to: string }, key: string) {
    if (this.failing) throw new Error("Resend: service unavailable");
    sent.push({ to: msg.to, key });
    return { id: `fake-${key}` };
  }
}
const sender = new FakeSender();

const valid = (over: Record<string, unknown> = {}) => ({
  idempotencyKey: "6f1b6c2e-3a1d-4c1e-9f7a-2b2f0a6d1e01",
  items: [{ sku: "dt-50-sheet", colourId: "red", units: 5 }],
  customer: { name: "Asha Folder", email: "Asha@Example.com", phone: "", city: "Pune", region: "Maharashtra", postalCode: "411001", country: "IN" },
  note: "For a 64 grid dragon",
  acknowledged: true,
  website: "",
  startedAt: Date.now() - 60_000,
  ...over,
});

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "nara-"));
  store = new FileStore(path.join(dir, "store.json"));
  sent = [];
  sender.failing = false;
  setEmailSenderForTests(sender);
  process.env.STUDIO_NOTIFY_EMAIL = "studio@example.test";
  process.env.EMAIL_FROM = "Studio <studio@example.test>";
});
afterEach(() => {
  setEmailSenderForTests(null);
  rmSync(dir, { recursive: true, force: true });
});

describe("submitOrderRequest", () => {
  it("stores a request with server-computed totals and status 'requested', then emails studio and customer", async () => {
    const r = await submitOrderRequest(valid(), store);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.reference).toMatch(/^NO-\d{4}-[0-9A-Z]{5}$/);
    expect(r.emails).toEqual({ studio: true, customer: true });
    const [order] = await store.listOrders();
    expect(order.status).toBe("requested");
    expect(order.subtotal).toBe(129500);
    expect(order.customer.email).toBe("asha@example.com");
    expect(order.publicToken).not.toContain(order.reference);
    expect(sent.map((s) => s.to).sort()).toEqual(["asha@example.com", "studio@example.test"]);
  });

  it("ignores any client-sent price fields", async () => {
    const r = await submitOrderRequest(valid({ items: [{ sku: "dt-50-sheet", colourId: "red", units: 5, unitPrice: 1 }], subtotal: 1 }), store);
    expect(r.ok).toBe(true);
    expect((await store.listOrders())[0].subtotal).toBe(129500);
  });

  it("is idempotent: the same key twice creates one request and sends emails once", async () => {
    const a = await submitOrderRequest(valid(), store);
    const b = await submitOrderRequest(valid(), store);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(b.reference).toBe(a.reference);
    expect(b.duplicate).toBe(true);
    expect(await store.listOrders()).toHaveLength(1);
    expect(sent).toHaveLength(2);
  });

  it("handles concurrent duplicate submissions safely", async () => {
    const results = await Promise.all([submitOrderRequest(valid(), store), submitOrderRequest(valid(), store), submitOrderRequest(valid(), store)]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(await store.listOrders()).toHaveLength(1);
  });

  it("keeps the request when email fails, records the failure, and a retry sends without duplicating", async () => {
    sender.failing = true;
    const r = await submitOrderRequest(valid(), store);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.emails).toEqual({ studio: false, customer: false });
    expect(await store.listOrders()).toHaveLength(1);
    const failed = await store.listNotifications({ status: "failed" });
    expect(failed).toHaveLength(2);
    expect(failed[0].lastError).toMatch(/service unavailable/);

    sender.failing = false;
    const out = await retryPending(store);
    expect(out.sent).toBe(2);
    expect(await store.listNotifications({ status: "failed" })).toHaveLength(0);
    // Retrying again sends nothing new.
    await retryPending(store);
    expect(sent).toHaveLength(2);
    // Each email carries a stable idempotency key derived from its outbox id.
    expect(new Set(sent.map((s) => s.key)).size).toBe(2);
  });

  it("requires the unchecked acknowledgement", async () => {
    const r = await submitOrderRequest(valid({ acknowledged: false }), store);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors?.acknowledged).toBeTruthy();
  });

  it("validates fields and reports item problems", async () => {
    const bad = await submitOrderRequest(valid({ customer: { name: "", email: "nope", city: "", country: "India" } }), store);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.fieldErrors ?? {})).toEqual(expect.arrayContaining(["customer.name", "customer.email", "customer.city", "customer.country"]));
    const moq = await submitOrderRequest(valid({ items: [{ sku: "dt-50-sheet", colourId: "red", units: 2 }] }), store);
    expect(moq.ok).toBe(false);
    if (!moq.ok) expect(moq.itemErrors?.[0].message).toMatch(/minimum order is 5/);
  });

  it("rejects bots (honeypot filled or impossibly fast)", async () => {
    expect((await submitOrderRequest(valid({ website: "spam.example" }), store)).ok).toBe(false);
    expect((await submitOrderRequest(valid({ startedAt: Date.now() }), store)).ok).toBe(false);
    expect(await store.listOrders()).toHaveLength(0);
  });

  it("refuses honestly when storage is not configured", async () => {
    const r = await submitOrderRequest(valid(), null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(503);
  });
});
