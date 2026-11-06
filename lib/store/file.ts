import { promises as fs } from "node:fs";
import path from "node:path";
import { mergeCatalogue } from "./catalogue-merge";
import { makePublicToken, makeReference, uuid } from "./ids";
import type { EnquiryRecord, NewEnquiry, NewOrderRequest, NotificationKind, NotificationRecord, OptionPatch, OrderRequestRecord, Store } from "./types";
import type { OrderStatus } from "@/lib/orders/status";

interface Db {
  orders: OrderRequestRecord[];
  enquiries: EnquiryRecord[];
  notifications: NotificationRecord[];
  optionOverrides: Record<string, OptionPatch>;
  publishedOverrides: Record<string, boolean>;
}
const empty = (): Db => ({ orders: [], enquiries: [], notifications: [], optionOverrides: {}, publishedOverrides: {} });

/**
 * Development / test store: one JSON file, writes serialised through a promise chain and
 * written atomically (temp file + rename). NOT used in production.
 */
export class FileStore implements Store {
  readonly kind = "file" as const;
  private chain: Promise<unknown> = Promise.resolve();
  constructor(private readonly file: string) {}

  private async read(): Promise<Db> {
    try {
      return { ...empty(), ...JSON.parse(await fs.readFile(this.file, "utf8")) };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return empty();
      throw e;
    }
  }
  private async write(db: Db) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, this.file);
  }
  /** Run a read-modify-write as one serialised "transaction". */
  private tx<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
    const run = this.chain.then(async () => {
      const db = await this.read();
      const out = await fn(db);
      await this.write(db);
      return out;
    });
    this.chain = run.catch(() => undefined);
    return run;
  }

  async getCatalogue() {
    const db = await this.read();
    return mergeCatalogue(db.optionOverrides, db.publishedOverrides);
  }
  updateOption(sku: string, patch: OptionPatch) {
    return this.tx((db) => {
      db.optionOverrides[sku] = { ...(db.optionOverrides[sku] ?? {}), ...patch };
    });
  }
  setProductPublished(slug: string, published: boolean) {
    return this.tx((db) => {
      db.publishedOverrides[slug] = published;
    });
  }

  private notifs(db: Db, now: string, list: { kind: NotificationKind; recipient: string }[], ref: { orderId?: string; enquiryId?: string }) {
    for (const n of list) {
      db.notifications.push({
        id: uuid(), kind: n.kind, recipient: n.recipient, orderId: ref.orderId ?? null, enquiryId: ref.enquiryId ?? null,
        status: "pending", attempts: 0, lastError: null, providerId: null, createdAt: now, updatedAt: now,
      });
    }
  }

  createOrderRequest(input: NewOrderRequest, notify: { kind: NotificationKind; recipient: string }[]) {
    return this.tx((db) => {
      const existing = db.orders.find((o) => o.idempotencyKey === input.idempotencyKey);
      if (existing) return { order: existing, created: false };
      const now = new Date().toISOString();
      const order: OrderRequestRecord = {
        ...input, id: uuid(), reference: makeReference("NO"), publicToken: makePublicToken(),
        status: "requested", createdAt: now, updatedAt: now,
        history: [{ status: "requested", at: now, note: "Submitted on the website" }], internalNotes: [],
      };
      db.orders.push(order);
      this.notifs(db, now, notify, { orderId: order.id });
      return { order, created: true };
    });
  }
  async getOrderByToken(token: string) {
    return (await this.read()).orders.find((o) => o.publicToken === token) ?? null;
  }
  async getOrder(id: string) {
    return (await this.read()).orders.find((o) => o.id === id) ?? null;
  }
  async listOrders(filter?: { status?: OrderStatus }) {
    const all = (await this.read()).orders;
    return all.filter((o) => !filter?.status || o.status === filter.status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  updateOrderStatus(id: string, status: OrderStatus, note: string) {
    return this.tx((db) => {
      const o = db.orders.find((x) => x.id === id);
      if (!o) throw new Error("Order not found");
      const now = new Date().toISOString();
      o.status = status;
      o.updatedAt = now;
      o.history.push({ status, at: now, note });
    });
  }
  addOrderNote(id: string, body: string) {
    return this.tx((db) => {
      const o = db.orders.find((x) => x.id === id);
      if (!o) throw new Error("Order not found");
      o.internalNotes.push({ at: new Date().toISOString(), body });
    });
  }

  createEnquiry(input: NewEnquiry, notify: { kind: NotificationKind; recipient: string }[]) {
    return this.tx((db) => {
      const existing = db.enquiries.find((e) => e.idempotencyKey === input.idempotencyKey);
      if (existing) return { enquiry: existing, created: false };
      const now = new Date().toISOString();
      const enquiry: EnquiryRecord = { ...input, id: uuid(), reference: makeReference("EN"), status: "new", createdAt: now };
      db.enquiries.push(enquiry);
      this.notifs(db, now, notify, { enquiryId: enquiry.id });
      return { enquiry, created: true };
    });
  }
  async listEnquiries() {
    return (await this.read()).enquiries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getEnquiry(id: string) {
    return (await this.read()).enquiries.find((e) => e.id === id) ?? null;
  }

  async listNotifications(filter?: { status?: NotificationRecord["status"]; orderId?: string; enquiryId?: string }) {
    return (await this.read()).notifications.filter(
      (n) => (!filter?.status || n.status === filter.status) && (!filter?.orderId || n.orderId === filter.orderId) && (!filter?.enquiryId || n.enquiryId === filter.enquiryId),
    );
  }
  updateNotification(id: string, patch: Partial<Pick<NotificationRecord, "status" | "attempts" | "lastError" | "providerId">>) {
    return this.tx((db) => {
      const n = db.notifications.find((x) => x.id === id);
      if (!n) throw new Error("Notification not found");
      Object.assign(n, patch, { updatedAt: new Date().toISOString() });
    });
  }
}
