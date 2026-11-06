import type { Catalogue } from "@/lib/shop/catalogue";
import type { PricedRequest } from "@/lib/shop/pricing";
import type { Availability, Paise } from "@/lib/shop/types";
import type { OrderStatus } from "@/lib/orders/status";

export interface Customer {
  name: string;
  email: string;
  phone: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface OrderRequestRecord extends PricedRequest {
  id: string;
  reference: string;
  /** Unguessable token for the confirmation URL. Not the reference. */
  publicToken: string;
  idempotencyKey: string;
  status: OrderStatus;
  customer: Customer;
  note: string;
  createdAt: string;
  updatedAt: string;
  history: { status: OrderStatus; at: string; note: string }[];
  internalNotes: { at: string; body: string }[];
}

export type NewOrderRequest = Omit<OrderRequestRecord, "id" | "reference" | "publicToken" | "status" | "createdAt" | "updatedAt" | "history" | "internalNotes">;

export interface EnquiryRecord {
  id: string;
  reference: string;
  idempotencyKey: string;
  kind: string;
  name: string;
  email: string;
  organisation: string;
  country: string;
  budget: string;
  timeline: string;
  message: string;
  status: "new" | "replied" | "closed";
  createdAt: string;
}
export type NewEnquiry = Omit<EnquiryRecord, "id" | "reference" | "status" | "createdAt">;

export type NotificationKind = "order_studio" | "order_customer" | "enquiry_studio" | "enquiry_customer";

export interface NotificationRecord {
  id: string;
  kind: NotificationKind;
  orderId: string | null;
  enquiryId: string | null;
  recipient: string;
  status: "pending" | "sent" | "failed";
  attempts: number;
  lastError: string | null;
  providerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OptionPatch {
  unitPrice?: Paise;
  minUnits?: number;
  maxUnits?: number;
  availability?: Availability;
}

export interface Store {
  readonly kind: "supabase" | "file";
  getCatalogue(): Promise<Catalogue>;
  updateOption(sku: string, patch: OptionPatch): Promise<void>;
  setProductPublished(slug: string, published: boolean): Promise<void>;

  /** Atomic + idempotent: the same idempotencyKey always returns the same record. */
  createOrderRequest(input: NewOrderRequest, notify: { kind: NotificationKind; recipient: string }[]): Promise<{ order: OrderRequestRecord; created: boolean }>;
  getOrderByToken(token: string): Promise<OrderRequestRecord | null>;
  getOrder(id: string): Promise<OrderRequestRecord | null>;
  listOrders(filter?: { status?: OrderStatus }): Promise<OrderRequestRecord[]>;
  updateOrderStatus(id: string, status: OrderStatus, note: string): Promise<void>;
  addOrderNote(id: string, body: string): Promise<void>;

  createEnquiry(input: NewEnquiry, notify: { kind: NotificationKind; recipient: string }[]): Promise<{ enquiry: EnquiryRecord; created: boolean }>;
  listEnquiries(): Promise<EnquiryRecord[]>;
  getEnquiry(id: string): Promise<EnquiryRecord | null>;

  listNotifications(filter?: { status?: NotificationRecord["status"]; orderId?: string; enquiryId?: string }): Promise<NotificationRecord[]>;
  updateNotification(id: string, patch: Partial<Pick<NotificationRecord, "status" | "attempts" | "lastError" | "providerId">>): Promise<void>;
}

export class StoreNotConfiguredError extends Error {
  constructor() {
    super("Order storage is not configured.");
    this.name = "StoreNotConfiguredError";
  }
}
