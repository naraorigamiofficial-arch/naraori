"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { NAV } from "@/lib/nav";
import { useOrderSheet } from "./OrderSheet";

export function SiteHeader() {
  const pathname = usePathname();
  const { count, ready } = useOrderSheet();
  const menu = useRef<HTMLDetailsElement>(null);

  // Close the mobile menu after navigating.
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  const current = (href: string) => (pathname === href || pathname.startsWith(href + "/") ? "page" : undefined);
  const links = (
    <ul className="nav-list">
      {NAV.map((n) => (
        <li key={n.href}>
          <Link href={n.href} aria-current={current(n.href)}>
            {n.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <header className="site-header">
      <div className="frame bar">
        <Link href="/" className="wordmark">
          <b>Nara Origami</b>
          <small>Abhijeet S. Vashistha</small>
        </Link>
        <nav aria-label="Main" className="nav-desktop">
          {links}
        </nav>
        <details className="menu" ref={menu}>
          <summary aria-label="Menu">Menu</summary>
          <nav aria-label="Main (mobile)">{links}</nav>
        </details>
        <Link href="/order-request" className="sheet-link">
          <span className="label">Order sheet</span>
          <span className="count" aria-hidden="true">
            {ready ? count : 0}
          </span>
          <span className="visually-hidden">
            , {ready ? count : 0} item{count === 1 ? "" : "s"}
          </span>
        </Link>
      </div>
    </header>
  );
}
