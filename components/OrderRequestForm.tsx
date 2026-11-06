"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Catalogue } from "@/lib/shop/catalogue";
import { formatINR, formatUSDCents } from "@/lib/shop/money";
import { PricingError, priceRequest } from "@/lib/shop/pricing";
import { useOrderSheet } from "./OrderSheet";

type Errors = Record<string, string>;

export function OrderRequestForm({ catalogue, countries, available }: { catalogue: Catalogue; countries: { code: string; name: string }[]; available: boolean }) {
  const sheet = useOrderSheet();
  const router = useRouter();
  const [country, setCountry] = useState("IN");
  const [errors, setErrors] = useState<Errors>({});
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  // When the visitor started on the form: the earlier of mount and first interaction
  // (effects can run late while a page transition animates).
  const startedAt = useRef(0);
  const markStart = () => {
    if (!startedAt.current) startedAt.current = Date.now();
  };
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(markStart, []);

  // Display-only estimate. The server recomputes everything from trusted records.
  const estimate = useMemo(() => {
    try {
      return { priced: priceRequest(catalogue, sheet.items, country), issues: [] as { index: number; message: string }[] };
    } catch (e) {
      return { priced: null, issues: e instanceof PricingError ? e.issues : [] };
    }
  }, [catalogue, sheet.items, country]);

  const lookup = (sku: string) => {
    for (const p of catalogue.products) {
      const o = p.options.find((x) => x.sku === sku);
      if (o) return { p, o };
    }
    return null;
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const body = {
      idempotencyKey: sheet.key,
      items: sheet.items,
      customer: {
        name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone"), city: fd.get("city"),
        region: fd.get("region"), postalCode: fd.get("postalCode"), country: fd.get("country"),
      },
      note: fd.get("note"),
      acknowledged: fd.get("acknowledged") === "on",
      website: fd.get("website"),
      startedAt: startedAt.current,
    };
    setBusy(true);
    setFormError("");
    try {
      const res = await fetch("/api/order-requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        const q = new URLSearchParams({ studio: data.emails.studio ? "1" : "0", customer: data.emails.customer ? "1" : "0" });
        sheet.clear();
        router.push(`/order-request/confirmation/${data.token}?${q}`);
        return;
      }
      const fe: Errors = {};
      for (const [k, v] of Object.entries((data.fieldErrors ?? {}) as Errors)) fe[k.replace(/^customer\./, "")] = v;
      setErrors(fe);
      setItemErrors(Object.fromEntries(((data.itemErrors ?? []) as { index: number; message: string }[]).map((i) => [i.index, i.message])));
      setFormError(data.error ?? "Something went wrong. Your order sheet has been kept. Please try again.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } catch {
      setFormError("We could not reach the studio's server. Your order sheet has been kept. Please check your connection and try again.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setBusy(false);
    }
  }

  if (sheet.ready && sheet.items.length === 0) {
    return (
      <div className="notice">
        <p className="lede" style={{ margin: 0 }}>Your order sheet is empty.</p>
        <p style={{ marginTop: "0.75rem" }}><Link className="link-arrow" href="/shop">Choose paper in the Paper Atlas</Link></p>
      </div>
    );
  }

  const err = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `err-${k}` } : {});
  const msg = (k: string) => errors[k] && <span className="field-error" id={`err-${k}`}>{errors[k]}</span>;
  const p = estimate.priced;

  return (
    <div className="order-layout">
      <section aria-labelledby="review-title">
        <h2 id="review-title" className="eyebrow">1 · Review your sheet</h2>
        <ul className="sheet-lines">
          {sheet.items.map((it, i) => {
            const found = lookup(it.sku);
            const colour = catalogue.colours.find((c) => c.id === it.colourId);
            const issue = itemErrors[i] ?? estimate.issues.find((x) => x.index === i)?.message;
            if (!found) {
              return (
                <li key={i} className="sheet-line">
                  <span className="line-name">This item is no longer available.</span>
                  <button className="remove" type="button" onClick={() => sheet.remove(i)}>Remove</button>
                </li>
              );
            }
            const enquiry = found.p.pricing === "enquiry";
            return (
              <li key={i} className="sheet-line">
                <span className="line-name">
                  <b>{found.p.name}</b>
                  <span className="muted">{found.o.label} · {colour?.name ?? "Colour not set"}</span>
                </span>
                <span className="stepper" role="group" aria-label={`Quantity for ${found.p.shortName}`}>
                  <button type="button" onClick={() => sheet.setUnits(i, Math.max(found.o.minUnits, it.units - 1))} disabled={it.units <= found.o.minUnits} aria-label="Decrease">−</button>
                  <input className="input" type="number" min={found.o.minUnits} max={found.o.maxUnits} value={it.units} aria-label="Quantity" onChange={(e) => sheet.setUnits(i, Math.max(1, Math.min(found.o.maxUnits, Math.floor(Number(e.target.value) || 1))))} />
                  <button type="button" onClick={() => sheet.setUnits(i, Math.min(found.o.maxUnits, it.units + 1))} disabled={it.units >= found.o.maxUnits} aria-label="Increase">+</button>
                </span>
                <span className="line-total">
                  {enquiry ? "By enquiry" : formatINR(found.o.unitPrice * it.units)}
                  <br />
                  <button className="remove" type="button" onClick={() => sheet.remove(i)}>Remove</button>
                </span>
                {issue && <span className="field-error line-error" role="alert">{issue}</span>}
              </li>
            );
          })}
        </ul>
        {p && (
          <dl className="totals">
            <dt>Subtotal (estimate)</dt>
            <dd>{formatINR(p.subtotal)}</dd>
            <dt>Shipping (estimate)</dt>
            <dd>{p.shippingEstimate.region === "domestic" ? (p.shippingEstimate.free ? "Free within India" : formatINR(p.shippingEstimate.amount)) : `${formatUSDCents(p.shippingEstimate.usdCents)}, quoted by email`}</dd>
            {p.hasEnquiryItems && (<><dt>Items priced by enquiry</dt><dd>Quoted by email</dd></>)}
            <dt className="grand">Estimated total</dt>
            <dd className="grand">{formatINR(p.subtotal + (p.shippingEstimate.region === "domestic" ? p.shippingEstimate.amount : 0))}{p.shippingEstimate.region === "international" ? " + shipping" : ""}</dd>
          </dl>
        )}
        <p className="meta" style={{ marginTop: "1rem" }}>
          Prices are checked again by the studio&apos;s server when you submit. <Link href="/shop">Add more paper</Link>
        </p>
      </section>

      <form onFocusCapture={markStart} onInputCapture={markStart} className="order-form" onSubmit={onSubmit} noValidate aria-labelledby="details-title">
        <h2 id="details-title" className="eyebrow">2 · Your details</h2>
        {!available && (
          <p className="notice warn" role="status">Online order requests are not switched on yet. Please email the studio with your order sheet.</p>
        )}
        <div ref={errorRef} tabIndex={-1} aria-live="assertive">
          {formError && <p className="notice" role="alert" style={{ margin: 0 }}>{formError}</p>}
        </div>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" className="input" autoComplete="name" required {...err("name")} />
          {msg("name")}
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" autoComplete="email" required {...err("email")} />
          <span className="hint">The studio will reply here with the confirmed total.</span>
          {msg("email")}
        </div>
        <div className="field">
          <label htmlFor="phone">Phone <span className="muted">(optional)</span></label>
          <input id="phone" name="phone" type="tel" className="input" autoComplete="tel" {...err("phone")} />
        </div>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend>Where should it go?</legend>
          <span className="hint">Used for a shipping estimate only. Your full address is asked for once the order is confirmed.</span>
          <div className="row-2" style={{ marginTop: "0.5rem" }}>
            <div className="field">
              <label htmlFor="country">Country</label>
              <select id="country" name="country" className="select" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country" {...err("country")}>
                {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              {msg("country")}
            </div>
            <div className="field">
              <label htmlFor="city">City</label>
              <input id="city" name="city" className="input" autoComplete="address-level2" required {...err("city")} />
              {msg("city")}
            </div>
            <div className="field">
              <label htmlFor="region">State / region <span className="muted">(optional)</span></label>
              <input id="region" name="region" className="input" autoComplete="address-level1" />
            </div>
            <div className="field">
              <label htmlFor="postalCode">PIN / postal code <span className="muted">(optional)</span></label>
              <input id="postalCode" name="postalCode" className="input" autoComplete="postal-code" inputMode="text" />
            </div>
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor="note">Note for the studio <span className="muted">(optional)</span></label>
          <textarea id="note" name="note" className="textarea" maxLength={2000} placeholder="e.g. the model you are planning, a deadline, colour questions" />
        </div>
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="website">Leave this empty</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="ack">
          <label className="check">
            <input type="checkbox" name="acknowledged" required {...err("acknowledged")} />
            <span>
              I understand that this is an order request, not a completed purchase. The studio will contact me by email to confirm availability, the final total and payment details. I have read the <Link href="/terms" target="_blank">ordering terms</Link>.
            </span>
          </label>
          {msg("acknowledged")}
        </div>
        <button className="btn btn-block" type="submit" disabled={busy || !sheet.ready || !available} aria-disabled={busy || !available}>
          {busy ? "Submitting…" : "Submit Order Request"}
        </button>
        <p className="meta" style={{ margin: 0 }}>Nothing is charged. No account needed. See how we handle your details in the <Link href="/privacy">privacy policy</Link>.</p>
      </form>
    </div>
  );
}
