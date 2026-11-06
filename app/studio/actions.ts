"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminConfigured, endSession, requireAdmin, startSession, verifyPassword } from "@/lib/auth";
import { deliver } from "@/lib/notifications";
import { ORDER_STATUSES } from "@/lib/orders/status";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getStore } from "@/lib/store";

const store = () => {
  const s = getStore();
  if (!s) throw new Error("Storage is not configured");
  return s;
};

export async function login(_: { error?: string } | undefined, fd: FormData) {
  if (!adminConfigured()) return { error: "The studio login is not configured yet (see DEPLOYMENT.md)." };
  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}`, 5, 15 * 60_000).ok) return { error: "Too many attempts. Try again in 15 minutes." };
  const password = String(fd.get("password") ?? "");
  if (!verifyPassword(password)) return { error: "That password is not correct." };
  await startSession();
  redirect("/studio");
}

export async function logout() {
  await endSession();
  redirect("/studio/login");
}

export async function updateStatus(fd: FormData) {
  await requireAdmin();
  const { id, status, note } = z.object({ id: z.string().uuid(), status: z.enum(ORDER_STATUSES), note: z.string().max(1000).default("") }).parse(Object.fromEntries(fd));
  await store().updateOrderStatus(id, status, note);
  revalidatePath(`/studio/orders/${id}`);
  revalidatePath("/studio");
}

export async function addNote(fd: FormData) {
  await requireAdmin();
  const { id, body } = z.object({ id: z.string().uuid(), body: z.string().trim().min(1).max(4000) }).parse(Object.fromEntries(fd));
  await store().addOrderNote(id, body);
  revalidatePath(`/studio/orders/${id}`);
}

export async function retryNotification(fd: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(fd.get("id"));
  const s = store();
  const n = (await s.listNotifications()).find((x) => x.id === id);
  if (n) await deliver(s, n);
  revalidatePath("/studio");
  if (n?.orderId) revalidatePath(`/studio/orders/${n.orderId}`);
}

export async function updateOption(fd: FormData) {
  await requireAdmin();
  const v = z
    .object({
      sku: z.string().regex(/^[a-z0-9-]{1,64}$/),
      price: z.coerce.number().min(0).max(1_000_000),
      minUnits: z.coerce.number().int().min(1).max(1000),
      maxUnits: z.coerce.number().int().min(1).max(1000),
      availability: z.enum(["made_to_order", "in_stock", "by_enquiry", "unavailable"]),
    })
    .refine((x) => x.minUnits <= x.maxUnits, "Minimum must not exceed maximum")
    .parse(Object.fromEntries(fd));
  await store().updateOption(v.sku, { unitPrice: Math.round(v.price * 100), minUnits: v.minUnits, maxUnits: v.maxUnits, availability: v.availability });
  revalidatePath("/shop", "layout");
  revalidatePath("/studio/catalogue");
}

export async function setPublished(fd: FormData) {
  await requireAdmin();
  const { slug, published } = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,80}$/), published: z.enum(["true", "false"]) }).parse(Object.fromEntries(fd));
  await store().setProductPublished(slug, published === "true");
  revalidatePath("/shop", "layout");
  revalidatePath("/studio/catalogue");
}
