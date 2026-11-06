import type { ReactNode } from "react";
import "@/styles/pages.css";
import { Breadcrumbs } from "./Breadcrumbs";
import { Folio } from "./Folio";

export function Policy({ title, path, updated, children }: { title: string; path: string; updated: string; children: ReactNode }) {
  return (
    <Folio>
      <Breadcrumbs items={[{ name: title, path }]} />
      <article className="frame section-tight">
        <header className="page-head" style={{ borderBottom: "1px solid var(--rule)", paddingBlock: "var(--s-5)", display: "grid", gap: "var(--s-3)" }}>
          <span className="eyebrow">Studio policy</span>
          <h1 className="title-1">{title}</h1>
          <p className="meta">Last updated {updated}</p>
        </header>
        <div className="policy prose">{children}</div>
      </article>
    </Folio>
  );
}
