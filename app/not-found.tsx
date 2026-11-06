import Link from "next/link";

export default function NotFound() {
  return (
    <div className="frame section">
      <span className="eyebrow">Error 404 · an unfolded sheet</span>
      <h1 className="title-1" style={{ maxWidth: "16ch" }}>
        This page isn’t in the archive.
      </h1>
      <p className="lede" style={{ marginTop: "1.5rem" }}>
        It may have moved when the site was rebuilt. Try one of these instead:
      </p>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.8rem", marginTop: "1.5rem" }}>
        <li><Link className="link-arrow" href="/artworks">The artwork archive</Link></li>
        <li><Link className="link-arrow" href="/shop">The Paper Atlas</Link></li>
        <li><Link className="link-arrow" href="/learn">Learn origami design</Link></li>
        <li><Link className="link-arrow" href="/search">Search the site</Link></li>
      </ul>
    </div>
  );
}
