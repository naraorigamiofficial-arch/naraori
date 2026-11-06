import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/studio.css";
import { isAdmin } from "@/lib/auth";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Studio", robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <div className="frame studio">
      {admin && (
        <nav className="studio-nav" aria-label="Studio">
          <span className="eyebrow">Studio dashboard</span>
          <Link href="/studio">Order requests</Link>
          <Link href="/studio/enquiries">Enquiries</Link>
          <Link href="/studio/catalogue">Catalogue &amp; prices</Link>
          <a href="/studio/export">Export CSV</a>
          <form action={logout}><button className="btn btn-quiet" type="submit">Sign out</button></form>
        </nav>
      )}
      {children}
    </div>
  );
}
