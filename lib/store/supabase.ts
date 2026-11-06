import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mergeCatalogue } from "./catalogue-merge";
import { makePublicToken, makeReference } from "./ids";
import type { EnquiryRecord, NewEnquiry, NewOrderRequest, NotificationKind, NotificationRecord, OptionPatch, OrderRequestRecord, Store } from "./types";
import type { OrderStatus } from "@/lib/orders/status";
import type { PricedLine } from "@/lib/shop/pricing";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

function must<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data;
}

/**
 * Production store. Uses the SECRET (service-role) key, so it must only ever run on the server.
 * The browser never talks to these tables: RLS + revoked grants block the public API entirely.
 */
export class SupabaseStore implements Store {
  readonly kind = "supabase" as const;
  private db: SupabaseClient;
  constructor(url: string, secretKey: string) {
    this.db = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async getCatalogue() {
    const [opts, prods] = await Promise.all([
      this.db.from("catalogue_options").select("*"),
      this.db.from("catalogue_products").select("*"),
    ]);
    const optionOverrides: Record<string, OptionPatch> = {};
    for (const r of must(opts) as Row[]) {
      const p: OptionPatch = {};
      if (r.unit_price_paise !== null) p.unitPrice = r.unit_price_paise;
      if (r.min_units !== null) p.minUnits = r.min_units;
      if (r.max_units !== null) p.maxUnits = r.max_units;
      if (r.availability !== null) p.availability = r.availability;
      optionOverrides[r.sku] = p;
    }
    const publishedOverrides = Object.fromEntries((must(prods) as Row[]).map((r) => [r.slug, r.published]));
    return mergeCatalogue(optionOverrides, publishedOverrides);
  }
  async updateOption(sku: string, patch: OptionPatch) {
    const row: Row = { sku };
    if (patch.unitPrice !== undefined) row.unit_price_paise = patch.unitPrice;
    if (patch.minUnits !== undefined) row.min_units = patch.minUnits;
    if (patch.maxUnits !== undefined) row.max_units = patch.maxUnits;
    if (patch.availability !== undefined) row.availability = patch.availability;
    must(await this.db.from("catalogue_options").upsert(row, { onConflict: "sku" }));
  }
  async setProductPublished(slug: string, published: boolean) {
    must(await this.db.from("catalogue_products").upsert({ slug, published }, { onConflict: "slug" }));
  }

  async createOrderRequest(input: NewOrderRequest, notify: { kind: NotificationKind; recipient: string }[]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const payload = {
        reference: makeReference("NO"),
        public_token: makePublicToken(),
        idempotency_key: input.idempotencyKey,
        customer_name: input.customer.name,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone,
        ship_city: input.customer.city,
        ship_region: input.customer.region,
        ship_postal_code: input.customer.postalCode,
        ship_country: input.customer.country,
        note: input.note,
        subtotal_paise: input.subtotal,
        has_enquiry_items: input.hasEnquiryItems,
        shipping_estimate: input.shippingEstimate,
        items: input.lines,
      };
      const res = await this.db.rpc("create_order_request", { p_order: payload, p_notify: notify });
      if (res.error) {
        // Astronomically rare reference collision → retry with a fresh reference.
        if (/order_requests_reference_key|order_requests_public_token_key/.test(res.error.message)) continue;
        throw new Error(`Supabase: ${res.error.message}`);
      }
      const { id, created } = res.data as { id: string; created: boolean };
      const order = await this.getOrder(id);
      if (!order) throw new Error("Order vanished after insert");
      return { order, created };
    }
    throw new Error("Could not allocate an order reference");
  }

  private async hydrate(r: Row): Promise<OrderRequestRecord> {
    const [items, hist, notes] = await Promise.all([
      this.db.from("order_request_items").select("*").eq("order_id", r.id).order("position"),
      this.db.from("order_status_history").select("*").eq("order_id", r.id).order("created_at"),
      this.db.from("order_notes").select("*").eq("order_id", r.id).order("created_at"),
    ]);
    const lines: PricedLine[] = (must(items) as Row[]).map((i) => ({
      sku: i.sku, productSlug: i.product_slug, productName: i.product_name, optionLabel: i.option_label,
      sizeLabel: i.size_label, colourId: i.colour_id, colourName: i.colour_name, units: i.units,
      sheetsPerUnit: i.sheets_per_unit, unitPrice: i.unit_price_paise, lineTotal: i.line_total_paise === null ? null : Number(i.line_total_paise),
    }));
    return {
      id: r.id, reference: r.reference, publicToken: r.public_token, idempotencyKey: r.idempotency_key, status: r.status,
      customer: { name: r.customer_name, email: r.customer_email, phone: r.customer_phone, city: r.ship_city, region: r.ship_region, postalCode: r.ship_postal_code, country: r.ship_country },
      note: r.note, lines, subtotal: Number(r.subtotal_paise), hasEnquiryItems: r.has_enquiry_items, shippingEstimate: r.shipping_estimate,
      createdAt: r.created_at, updatedAt: r.updated_at,
      history: (must(hist) as Row[]).map((h) => ({ status: h.status, at: h.created_at, note: h.note })),
      internalNotes: (must(notes) as Row[]).map((n) => ({ at: n.created_at, body: n.body })),
    };
  }
  async getOrderByToken(token: string) {
    const r = must(await this.db.from("order_requests").select("*").eq("public_token", token).maybeSingle()) as Row | null;
    return r ? this.hydrate(r) : null;
  }
  async getOrder(id: string) {
    const r = must(await this.db.from("order_requests").select("*").eq("id", id).maybeSingle()) as Row | null;
    return r ? this.hydrate(r) : null;
  }
  async listOrders(filter?: { status?: OrderStatus }) {
    let q = this.db.from("order_requests").select("*").order("created_at", { ascending: false }).limit(500);
    if (filter?.status) q = q.eq("status", filter.status);
    const rows = must(await q) as Row[];
    return Promise.all(rows.map((r) => this.hydrate(r)));
  }
  async updateOrderStatus(id: string, status: OrderStatus, note: string) {
    must(await this.db.rpc("set_order_status", { p_order_id: id, p_status: status, p_note: note }));
  }
  async addOrderNote(id: string, body: string) {
    must(await this.db.from("order_notes").insert({ order_id: id, body }));
  }

  private toEnquiry = (r: Row): EnquiryRecord => ({
    id: r.id, reference: r.reference, idempotencyKey: r.idempotency_key, kind: r.kind, name: r.name, email: r.email,
    organisation: r.organisation, country: r.country, budget: r.budget, timeline: r.timeline, message: r.message, status: r.status, createdAt: r.created_at,
  });
  async createEnquiry(input: NewEnquiry, notify: { kind: NotificationKind; recipient: string }[]) {
    const res = await this.db.rpc("create_enquiry", {
      p_enquiry: { ...input, idempotency_key: input.idempotencyKey, reference: makeReference("EN") },
      p_notify: notify,
    });
    if (res.error) throw new Error(`Supabase: ${res.error.message}`);
    const { id, created } = res.data as { id: string; created: boolean };
    const enquiry = await this.getEnquiry(id);
    if (!enquiry) throw new Error("Enquiry vanished after insert");
    return { enquiry, created };
  }
  async listEnquiries() {
    return (must(await this.db.from("enquiries").select("*").order("created_at", { ascending: false }).limit(500)) as Row[]).map(this.toEnquiry);
  }
  async getEnquiry(id: string) {
    const r = must(await this.db.from("enquiries").select("*").eq("id", id).maybeSingle()) as Row | null;
    return r ? this.toEnquiry(r) : null;
  }

  async listNotifications(filter?: { status?: NotificationRecord["status"]; orderId?: string; enquiryId?: string }) {
    let q = this.db.from("notification_outbox").select("*").order("created_at", { ascending: false }).limit(500);
    if (filter?.status) q = q.eq("status", filter.status);
    if (filter?.orderId) q = q.eq("order_id", filter.orderId);
    if (filter?.enquiryId) q = q.eq("enquiry_id", filter.enquiryId);
    return (must(await q) as Row[]).map((r) => ({
      id: r.id, kind: r.kind, orderId: r.order_id, enquiryId: r.enquiry_id, recipient: r.recipient, status: r.status,
      attempts: r.attempts, lastError: r.last_error, providerId: r.provider_id, createdAt: r.created_at, updatedAt: r.updated_at,
    }));
  }
  async updateNotification(id: string, patch: Partial<Pick<NotificationRecord, "status" | "attempts" | "lastError" | "providerId">>) {
    const row: Row = {};
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.attempts !== undefined) row.attempts = patch.attempts;
    if (patch.lastError !== undefined) row.last_error = patch.lastError;
    if (patch.providerId !== undefined) row.provider_id = patch.providerId;
    must(await this.db.from("notification_outbox").update(row).eq("id", id));
  }
}
