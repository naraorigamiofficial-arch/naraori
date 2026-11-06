import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";

export default async function EnquiriesPage() {
  await requireAdmin();
  const list = (await getStore()?.listEnquiries()) ?? [];
  return (
    <>
      <h1 className="title-2">Enquiries</h1>
      <ol className="plain" style={{ marginTop: "1.5rem" }}>
        {list.map((e) => (
          <li key={e.id} className="order-form" style={{ marginBottom: "1rem" }}>
            <p className="mono" style={{ margin: 0 }}>{e.reference} · {e.kind} · {new Date(e.createdAt).toLocaleString("en-IN")}</p>
            <p style={{ margin: 0 }}><b>{e.name}</b>, <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: your enquiry ${e.reference}`)}`}>{e.email}</a>{e.organisation && ` · ${e.organisation}`} · {e.country}</p>
            {(e.budget || e.timeline) && <p className="muted" style={{ margin: 0 }}>Budget: {e.budget || "Not given"} · Timeline: {e.timeline || "Not given"}</p>}
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{e.message}</p>
          </li>
        ))}
        {!list.length && <li className="muted">No enquiries yet.</li>}
      </ol>
    </>
  );
}
