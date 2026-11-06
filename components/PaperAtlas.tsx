"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { formatINR } from "@/lib/shop/money";
import type { Colour, Product } from "@/lib/shop/types";
import { useOrderSheet } from "./OrderSheet";
import { SheetDiagram } from "./SheetDiagram";

type Use = "all" | "learning" | "intermediate" | "complex" | "mega";
const USES: { id: Use; label: string; test: (p: Product) => boolean }[] = [
  { id: "all", label: "Everything", test: () => true },
  { id: "learning", label: "Learning & practice", test: (p) => p.group === "starter" },
  { id: "intermediate", label: "Intermediate models", test: (p) => p.sizeCm === 50 || p.sizeCm === 37.5 },
  { id: "complex", label: "Complex models", test: (p) => p.sizeCm === 70 || p.sizeCm === 100 },
  { id: "mega", label: "Mega-projects & custom", test: (p) => p.group === "large" || p.group === "custom" },
];

const perSheet = (p: Product) => {
  if (p.pricing === "enquiry") return null;
  return Math.min(...p.options.filter((o) => o.availability !== "unavailable").map((o) => o.unitPrice / o.sheetsPerUnit));
};

export function PaperAtlas({ products, colours, initialSlug }: { products: Product[]; colours: Colour[]; initialSlug?: string }) {
  const uid = useId();
  const sheet = useOrderSheet();
  const [use, setUse] = useState<Use>("all");
  const [slug, setSlug] = useState(initialSlug ?? products.find((p) => p.sizeCm === 50)?.slug ?? products[0].slug);
  const product = products.find((p) => p.slug === slug)!;
  const options = product.options.filter((o) => o.availability !== "unavailable");
  const [sku, setSku] = useState<string | undefined>(options[0]?.sku);
  const option = options.find((o) => o.sku === sku) ?? options[0];
  const [colourId, setColourId] = useState<string | null>(null);
  const [units, setUnits] = useState(option?.minUnits ?? 1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const visible = useMemo(() => products.filter(USES.find((u) => u.id === use)!.test), [products, use]);
  const diagramSheets = products.filter((p) => p.sizeCm && p.group !== "custom").map((p) => ({ cm: p.sizeCm!, label: `${p.sizeCm} cm` }));
  const enquiry = product.pricing === "enquiry" || option?.availability === "by_enquiry";
  const lineTotal = !enquiry && option ? option.unitPrice * units : null;
  const productColours = colours.filter((c) => product.colourIds.includes(c.id));

  function choose(p: Product) {
    setSlug(p.slug);
    const first = p.options.find((o) => o.availability !== "unavailable");
    setSku(first?.sku);
    setUnits(first?.minUnits ?? 1);
    setMessage("");
    setError("");
  }
  function chooseOption(nextSku: string) {
    const o = options.find((x) => x.sku === nextSku)!;
    setSku(o.sku);
    setUnits((u) => Math.min(o.maxUnits, Math.max(o.minUnits, u)));
  }
  function add() {
    if (!option) return;
    if (!colourId) {
      setError("Choose a colour first.");
      document.getElementById(`${uid}-colours`)?.querySelector("input")?.focus();
      return;
    }
    if (units < option.minUnits) {
      setError(`The minimum for this size is ${option.minUnits}.`);
      return;
    }
    sheet.add({ sku: option.sku, colourId, units });
    setError("");
    const c = colours.find((x) => x.id === colourId)!;
    setMessage(`Added ${units} × ${product.shortName} ${option.label.toLowerCase()} in ${c.name} to your order sheet.`);
  }

  return (
    <div className="atlas">
      <div className="atlas-board">
        <fieldset className="atlas-uses">
          <legend className="eyebrow">What are you folding?</legend>
          <div className="chip-row">
            {USES.map((u) => (
              <label key={u.id} className="chip-radio">
                <input type="radio" name={`${uid}-use`} value={u.id} checked={use === u.id} onChange={() => setUse(u.id)} />
                <span>{u.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <figure className="atlas-figure">
          <SheetDiagram sheets={diagramSheets} selectedCm={product.sizeCm} />
          <figcaption className="meta">
            Sheets drawn in true proportion to each other and to an A4 page, not actual size on your screen.
            {product.group === "large" && " Made-to-order sheets from 200 cm to 600 cm are larger than this board."}
          </figcaption>
        </figure>

        <fieldset className="atlas-sizes">
          <legend className="eyebrow">Sheet size</legend>
          <ul>
            {visible.map((p) => {
              const ps = perSheet(p);
              const min = p.options[0];
              return (
                <li key={p.slug}>
                  <label className={`size-row${p.slug === slug ? " is-selected" : ""}`}>
                    <input type="radio" name={`${uid}-size`} value={p.slug} checked={p.slug === slug} onChange={() => choose(p)} />
                    <span className="size-name">{p.shortName}</span>
                    <span className="size-price">{ps === null ? "By enquiry" : `from ${formatINR(ps)} / sheet`}</span>
                    <span className="size-moq mono">
                      {p.pricing === "enquiry" ? "Made to order" : p.options.length > 1 ? `${p.options.length} pack sizes` : `Minimum ${min.minUnits} sheets`}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      </div>

      <section className="atlas-panel" aria-labelledby={`${uid}-ptitle`} aria-live="off">
        <span className="eyebrow">Specimen</span>
        <h2 id={`${uid}-ptitle`} className="title-3">{product.name}</h2>
        <p className="muted">{product.summary}</p>
        <dl className="ledger compact">
          <div><dt>Size</dt><dd>{product.sizeLabel}</dd></div>
          <div><dt>Construction</dt><dd>{product.construction}</dd></div>
          <div><dt>Treatment</dt><dd>{product.treatment}</dd></div>
          <div><dt>Approx. GSM</dt><dd className={product.gsm ? undefined : "unknown"}>{product.gsm ?? "Not yet measured"}</dd></div>
        </dl>

        {options.length > 1 && (
          <fieldset className="atlas-field">
            <legend className="label">{product.pricing === "enquiry" ? "Type" : "Pack"}</legend>
            <div className="option-list">
              {options.map((o) => (
                <label key={o.sku} className="option-row">
                  <input type="radio" name={`${uid}-opt`} value={o.sku} checked={o.sku === option?.sku} onChange={() => chooseOption(o.sku)} />
                  <span>{o.label}</span>
                  {product.pricing === "fixed" && <span className="mono">{formatINR(o.unitPrice)}</span>}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="atlas-field" id={`${uid}-colours`}>
          <legend className="label">Colour <span className="muted">(same price for every colour)</span></legend>
          <div className="swatches">
            {productColours.map((c) => (
              <label key={c.id} className="swatch">
                <input type="radio" name={`${uid}-colour`} value={c.id} checked={colourId === c.id} onChange={() => { setColourId(c.id); setError(""); }} />
                <span className="swatch-chip" style={{ background: c.hex }} aria-hidden="true" />
                <span className="swatch-name">{c.name}</span>
              </label>
            ))}
          </div>
          <p className="hint">Swatches are approximate; hand-treated batches vary slightly.</p>
        </fieldset>

        {option && (
          <div className="atlas-field">
            <label className="label" htmlFor={`${uid}-qty`}>
              Quantity <span className="muted">({option.sheetsPerUnit > 1 ? "packs" : "sheets"}; minimum {option.minUnits}, maximum {option.maxUnits})</span>
            </label>
            <div className="stepper">
              <button type="button" onClick={() => setUnits((u) => Math.max(option.minUnits, u - 1))} disabled={units <= option.minUnits} aria-label="Decrease quantity">−</button>
              <input
                id={`${uid}-qty`}
                className="input"
                type="number"
                inputMode="numeric"
                min={option.minUnits}
                max={option.maxUnits}
                value={units}
                onChange={(e) => setUnits(Math.min(option.maxUnits, Math.max(0, Math.floor(Number(e.target.value) || 0))))}
                onBlur={() => setUnits((u) => Math.max(option.minUnits, u))}
                aria-describedby={`${uid}-total`}
              />
              <button type="button" onClick={() => setUnits((u) => Math.min(option.maxUnits, u + 1))} disabled={units >= option.maxUnits} aria-label="Increase quantity">+</button>
            </div>
          </div>
        )}

        <p className="atlas-total" id={`${uid}-total`}>
          {lineTotal !== null ? (
            <>
              <span className="mono">Subtotal</span> <b>{formatINR(lineTotal)}</b>{" "}
              <span className="mono">{units * (option?.sheetsPerUnit ?? 1)} sheets</span>
            </>
          ) : (
            <span className="mono">Price confirmed by the studio after you submit the request.</span>
          )}
        </p>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button type="button" className="btn btn-block" onClick={add} disabled={!sheet.ready}>
          {enquiry ? "Add to order sheet as an enquiry" : "Add to order sheet"}
        </button>
        <p role="status" className="atlas-status">
          {message && (
            <>
              {message} <Link href="/order-request">Review order sheet →</Link>
            </>
          )}
        </p>
        <p className="meta">
          <Link href={`/shop/${product.slug}`}>Full details, packing and limitations for {product.shortName}</Link>
        </p>
      </section>
    </div>
  );
}
