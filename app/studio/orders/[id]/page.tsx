import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { shippingText } from "@/lib/email/templates";
import { ORDER_STATUSES, STATUS_LABEL } from "@/lib/orders/status";
import { formatINR } from "@/lib/shop/money";
import { getStore } from "@/lib/store";
import { addNote, retryNotification, updateStatus } from "../../actions";

export default async function OrderDetail(props: PageProps<"/studio/orders/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const store = getStore();
  if (!store || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const o = await store.getOrder(id);
  if (!o) notFound();
  const notes = await store.listNotifications({ orderId: o.id });
  const c = o.customer;
  return (
    <>
      <p><Link href="/studio">← All requests</Link></p>
      <h1 className="title-2">{o.reference} <span className="tag">{STATUS_LABEL[o.status]}</span></h1>
      <div className="studio-grid">
        <section>
          <h2 className="eyebrow">Customer</h2>
          <dl className="ledger">
            <div><dt>Name</dt><dd>{c.name}</dd></div>
            <div><dt>Email</dt><dd><a href={`mailto:${c.email}?subject=${encodeURIComponent(`Your order request ${o.reference}`)}`}>{c.email}</a></dd></div>
            <div><dt>Phone</dt><dd>{c.phone || "None given"}</dd></div>
            <div><dt>Ships to</dt><dd>{[c.city, c.region, c.postalCode, c.country].filter(Boolean).join(", ")}</dd></div>
            <div><dt>Note</dt><dd style={{ whiteSpace: "pre-wrap" }}>{o.note || "None"}</dd></div>
            <div><dt>Received</dt><dd>{new Date(o.createdAt).toLocaleString("en-IN")}</dd></div>
          </dl>
          <h2 className="eyebrow" style={{ marginTop: "2rem" }}>Items (price snapshot at request time)</h2>
          <table>
            <thead><tr><th>Item</th><th>Colour</th><th className="num">Qty</th><th className="num">Unit</th><th className="num">Total</th></tr></thead>
            <tbody>
              {o.lines.map((l) => (
                <tr key={`${l.sku}-${l.colourId}`}>
                  <td>{l.productName}<br /><span className="muted">{l.optionLabel} · {l.sku}</span></td>
                  <td>{l.colourName}</td>
                  <td className="num">{l.units}</td>
                  <td className="num">{l.unitPrice === null ? "Enquiry" : formatINR(l.unitPrice)}</td>
                  <td className="num">{l.lineTotal === null ? "By enquiry" : formatINR(l.lineTotal)}</td>
                </tr>
              ))}
              <tr><td colSpan={4}><b>Subtotal</b></td><td className="num"><b>{formatINR(o.subtotal)}</b></td></tr>
              <tr><td colSpan={4}>Shipping estimate</td><td className="num">{shippingText(o)}</td></tr>
            </tbody>
          </table>
        </section>
        <section>
          <h2 className="eyebrow">Update status</h2>
          <form action={updateStatus} className="order-form">
            <input type="hidden" name="id" value={o.id} />
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" className="select" defaultValue={o.status}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="snote">Reason / note (kept in history)</label><input id="snote" name="note" className="input" /></div>
            <button className="btn" type="submit">Save status</button>
            <p className="meta" style={{ margin: 0 }}>Changing status does not email the customer. Reply to them directly.</p>
          </form>
          <h2 className="eyebrow" style={{ marginTop: "2rem" }}>History</h2>
          <ol className="plain">{o.history.map((h, i) => <li key={i}><span className="mono">{new Date(h.at).toLocaleString("en-IN")}</span>: {STATUS_LABEL[h.status]}{h.note ? `: ${h.note}` : ""}</li>)}</ol>
          <h2 className="eyebrow" style={{ marginTop: "2rem" }}>Internal notes</h2>
          <ol className="plain">{o.internalNotes.map((n, i) => <li key={i}><span className="mono">{new Date(n.at).toLocaleString("en-IN")}</span>: {n.body}</li>)}</ol>
          <form action={addNote} className="order-form" style={{ marginTop: "1rem" }}>
            <input type="hidden" name="id" value={o.id} />
            <label htmlFor="body" className="label">Add a note (never shown to the customer)</label>
            <textarea id="body" name="body" className="textarea" required />
            <button className="btn btn-quiet" type="submit">Add note</button>
          </form>
          <h2 className="eyebrow" style={{ marginTop: "2rem" }}>Emails</h2>
          <ul className="plain">
            {notes.map((n) => (
              <li key={n.id}>
                <span className="mono">{n.kind}</span> → {n.recipient}: <b>{n.status}</b> ({n.attempts} attempt{n.attempts === 1 ? "" : "s"}){n.lastError && <span className="muted">: {n.lastError}</span>}
                {n.status !== "sent" && <form action={retryNotification} style={{ display: "inline" }}><input type="hidden" name="id" value={n.id} /> <button className="btn btn-quiet" type="submit">Retry</button></form>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
