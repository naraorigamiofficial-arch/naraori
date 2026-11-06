import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Our CSS is small (~30 KB), so inlining it removes render-blocking requests (better LCP on slow mobile).
  experimental: { inlineCss: true },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 82, 90],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Private areas must never be indexed, even if a link leaks.
      { source: "/studio/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/order-request/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
  async redirects() {
    // Legacy static-site URLs (GitHub Pages) → new permanent routes. See SEO_IMPLEMENTATION.md.
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/Catalog/catalog.html", destination: "/shop", permanent: true },
      { source: "/Catalog", destination: "/shop", permanent: true },
      { source: "/catalog", destination: "/shop", permanent: true },
      { source: "/papers", destination: "/shop", permanent: true },
      { source: "/gallery", destination: "/artworks", permanent: true },
      { source: "/imgs/ram.webp", destination: "/media/artworks/maryada-purushottam.webp", permanent: true },
      { source: "/imgs/AG.webp", destination: "/media/artworks/agniv-the-monk-of-fire.webp", permanent: true },
      { source: "/imgs/hr.webp", destination: "/media/artworks/sunstriker.webp", permanent: true },
      { source: "/imgs/wkkk.webp", destination: "/media/artworks/sun-wukong-the-monkey-king.webp", permanent: true },
      { source: "/imgs/me.webp", destination: "/media/studio/abhijeet-s-vashistha-portrait.webp", permanent: true },
      { source: "/imgs/s:n.jpg", destination: "/media/process/sun-wukong-step-:n.jpg", permanent: true },
    ];
  },
};

export default nextConfig;
