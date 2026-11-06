"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const KINDS = [
  { id: "commission", label: "A new commission" },
  { id: "acquisition", label: "Acquiring an existing work" },
  { id: "collaboration", label: "A brand or institutional collaboration" },
  { id: "press", label: "Press or media" },
  { id: "general", label: "Something else" },
];

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "00000000-0000-4000-8000-000000000001");

export function EnquiryForm({ countries, defaultKind = "commission", about }: { countries: { code: string; name: string }[]; defaultKind?: string; about?: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" | "error"; message?: string; reference?: string }>({ kind: "idle" });
  const key = useRef("");
  // When the visitor started on the form: the earlier of mount and first interaction
  // (effects can run late while a page transition animates).
  const startedAt = useRef(0);
  const markStart = () => {
    if (!startedAt.current) startedAt.current = Date.now();
  };
  const live = useRef<HTMLDivElement>(null);
  useEffect(() => {
    key.current = newKey();
    markStart();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === "busy") return;
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/enquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, idempotencyKey: key.current, startedAt: startedAt.current }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setState({ kind: "done", reference: data.reference, message: data.emails?.customer ? "A copy has been emailed to you." : "Your message is recorded; our confirmation email could not be sent just now, but the studio has your enquiry." });
      } else {
        setErrors(data.fieldErrors ?? {});
        setState({ kind: "error", message: data.error ?? "Your message could not be sent." });
      }
    } catch {
      setState({ kind: "error", message: "We could not reach the server. Please try again." });
    }
    requestAnimationFrame(() => live.current?.focus());
  }

  if (state.kind === "done")
    return (
      <div className="notice ok" ref={live} tabIndex={-1} role="status">
        <p className="lede" style={{ margin: 0 }}>Thank you. Your enquiry has reached the studio.</p>
        <p style={{ margin: "0.75rem 0 0" }}>Reference <strong>{state.reference}</strong>. {state.message} Every enquiry is read personally; a reply can take a little time.</p>
      </div>
    );

  const inv = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `e-${k}` } : {});
  const msg = (k: string) => errors[k] && <span id={`e-${k}`} className="field-error">{errors[k]}</span>;
  return (
    <form onFocusCapture={markStart} onInputCapture={markStart} className="order-form" onSubmit={submit} noValidate>
      <div ref={live} tabIndex={-1} aria-live="assertive">
        {state.kind === "error" && <p className="notice" role="alert" style={{ margin: 0 }}>{state.message}</p>}
      </div>
      <div className="field">
        <label htmlFor="kind">I am writing about</label>
        <select id="kind" name="kind" className="select" defaultValue={defaultKind}>
          {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
      </div>
      <div className="row-2">
        <div className="field"><label htmlFor="e-name-in">Name</label><input id="e-name-in" name="name" className="input" autoComplete="name" required {...inv("name")} />{msg("name")}</div>
        <div className="field"><label htmlFor="e-email-in">Email</label><input id="e-email-in" name="email" type="email" className="input" autoComplete="email" required {...inv("email")} />{msg("email")}</div>
        <div className="field"><label htmlFor="e-org">Organisation <span className="muted">(optional)</span></label><input id="e-org" name="organisation" className="input" autoComplete="organization" /></div>
        <div className="field">
          <label htmlFor="e-country">Country</label>
          <select id="e-country" name="country" className="select" defaultValue="IN">{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select>
        </div>
        <div className="field"><label htmlFor="e-budget">Budget range <span className="muted">(optional)</span></label><input id="e-budget" name="budget" className="input" placeholder="e.g. ₹50,000–1,00,000" /></div>
        <div className="field"><label htmlFor="e-timeline">Timeline <span className="muted">(optional)</span></label><input id="e-timeline" name="timeline" className="input" placeholder="e.g. by March 2027" /></div>
      </div>
      <div className="field">
        <label htmlFor="e-message">Your message</label>
        <textarea id="e-message" name="message" className="textarea" rows={7} required minLength={20} maxLength={4000} defaultValue={about ? `About “${about}”: ` : ""} {...inv("message")} />
        <span className="hint">The subject, the intended setting, and anything that matters to you about the work.</span>
        {msg("message")}
      </div>
      <div className="honeypot" aria-hidden="true"><label htmlFor="e-website">Leave empty</label><input id="e-website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <button className="btn btn-block" type="submit" disabled={state.kind === "busy"}>{state.kind === "busy" ? "Sending…" : "Send enquiry"}</button>
      <p className="meta" style={{ margin: 0 }}>Your details are used only to reply. <Link href="/privacy">Privacy policy</Link>.</p>
    </form>
  );
}
