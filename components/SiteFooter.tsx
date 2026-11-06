import Link from "next/link";
import { identity } from "@/content/identity";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="frame footer-grid">
        <div>
          <p className="title-3" style={{ marginBottom: "0.5rem" }}>
            {identity.artistName}
          </p>
          <p className="muted" style={{ maxWidth: "38ch" }}>
            Original origami sculpture by {identity.person.name}, and hand-treated double-tissue paper from the {identity.studio.name} studio, {identity.contact.location}.
          </p>
          <p>
            <a href={`mailto:${identity.contact.email}`}>{identity.contact.email}</a>
          </p>
        </div>
        <div>
          <h2>Explore</h2>
          <ul>
            <li><Link href="/artworks">Artwork archive</Link></li>
            <li><Link href="/projects">In the studio</Link></li>
            <li><Link href="/learn">Learn origami design</Link></li>
            <li><Link href="/journal">Journal</Link></li>
            <li><Link href="/search">Search</Link></li>
          </ul>
        </div>
        <div>
          <h2>Paper</h2>
          <ul>
            <li><Link href="/shop">Paper Atlas</Link></li>
            <li><Link href="/order-request">Order sheet</Link></li>
            <li><Link href="/shipping">Shipping &amp; ordering</Link></li>
            <li><Link href="/terms">Ordering terms</Link></li>
          </ul>
        </div>
        <div>
          <h2>Studio</h2>
          <ul>
            <li><Link href="/about">About the artist</Link></li>
            <li><Link href="/commissions">Commissions</Link></li>
            <li><Link href="/press">Press</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/accessibility">Accessibility</Link></li>
          </ul>
        </div>
      </div>
      <div className="frame" style={{ marginTop: "2.5rem" }}>
        <hr className="crease" />
        <p className="meta" style={{ marginTop: "1rem" }}>
          © {new Date().getFullYear()} {identity.person.name} · {identity.studio.name}. All artwork and photographs are the artist’s own. No AI-generated imagery is used on this site.
        </p>
      </div>
    </footer>
  );
}
