import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatINR } from "@/lib/shop/money";
import { ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/orders/status";
import { getStore } from "@/lib/store";
import { retryNotification } from "./actions";

export default async function StudioHome(props: PageProps<"/studio">) {
  await requireAdmin();
  const store = getStore();
  if (!store) return <p className="notice">Storage is not configured. See DEPLOYMENT.md.</p>;
  const sp = await props.searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const [orders, all, failed] = await Promise.all([store.listOrders({ status }), store.listOrders(), store.listNotifications({ status: "failed" })]);
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, all.filter((o) => o.status === s).length]));
  return (
    <>
      <h1 className="title-2">Order requests</h1>
      {failed.length > 0 && (
        <section className="notice warn" aria-labelledby="failed-title" style={{ margin: "1.5rem 0" }}>
          <h2 id="failed-title" className="label">{failed.length} email{failed.length === 1 ? "" : "s"} not delivered</h2>
          <p className="muted">The requests themselves are safe. Retry once email is configured, or reply manually.</p>
          <ul className="plain">
            {failed.map((n) => (
              <li key={n.id}>
                <span className="mono">{n.kind}</span> to {n.recipient}, {n.attempts} attempt(s): <span className="muted">{n.lastError}</span>{" "}
                {n.orderId && <Link href={`/studio/orders/${n.orderId}`}>open</Link>}
                <form action={retryNotification} style={{ display: "inline" }}><input type="hidden" name="id" value={n.id} /> <button className="btn btn-quiet" type="submit">Retry</button></form>
              </li>
            ))}
          </ul>
        </section>
      )}
      <nav className="chip-row" aria-label="Filter by status" style={{ margin: "1.5rem 0" }}>
        <Link className="chip" href="/studio" aria-current={!status ? "true" : undefined}>All ({all.length})</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} className="chip" href={`/studio?status=${s}`} aria-current={status === s ? "true" : undefined}>{STATUS_LABEL[s]} ({counts[s]})</Link>
        ))}
      </nav>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Reference</th><th>Received</th><th>Customer</th><th>Ships to</th><th className="num">Items</th><th className="num">Subtotal</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/studio/orders/${o.id}`}>{o.reference}</Link></td>
                <td>{new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td>{o.customer.name}<br /><span className="muted">{o.customer.email}</span></td>
                <td>{o.customer.city}, {o.customer.country}</td>
                <td className="num">{o.lines.length}</td>
                <td className="num">{formatINR(o.subtotal)}{o.hasEnquiryItems ? " +" : ""}</td>
                <td><span className="tag">{STATUS_LABEL[o.status]}</span></td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={7} className="muted">No requests.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
