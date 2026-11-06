import { isAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // Neutralise spreadsheet formula injection and quote every cell.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET() {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });
  const orders = (await getStore()?.listOrders()) ?? [];
  const rows = [["reference", "created_at", "status", "name", "email", "phone", "city", "region", "postal_code", "country", "sku", "item", "colour", "units", "unit_price_inr", "line_total_inr", "order_subtotal_inr", "note"]];
  for (const o of orders)
    for (const l of o.lines)
      rows.push([o.reference, o.createdAt, o.status, o.customer.name, o.customer.email, o.customer.phone, o.customer.city, o.customer.region, o.customer.postalCode, o.customer.country, l.sku, `${l.productName}, ${l.optionLabel}`, l.colourName, String(l.units), l.unitPrice === null ? "" : (l.unitPrice / 100).toFixed(2), l.lineTotal === null ? "" : (l.lineTotal / 100).toFixed(2), (o.subtotal / 100).toFixed(2), o.note]);
  const csv = rows.map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="nara-order-requests-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
}
