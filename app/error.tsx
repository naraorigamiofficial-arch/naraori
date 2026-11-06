"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="frame section">
      <span className="eyebrow">Something went wrong</span>
      <h1 className="title-2">This page could not be shown.</h1>
      <p className="lede" style={{ marginTop: "1rem" }}>
        Nothing you entered has been lost from your order sheet. You can try again, or go back to the homepage.
      </p>
      <p style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
        <button className="btn" type="button" onClick={reset}>Try again</button>
        <Link className="btn btn-quiet" href="/">Homepage</Link>
      </p>
    </div>
  );
}
