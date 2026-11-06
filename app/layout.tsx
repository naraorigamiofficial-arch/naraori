import type { Metadata, Viewport } from "next";
import "./globals.css";
import { display, mono, text } from "./fonts";
import { identity, SITE_URL } from "@/content/identity";
import { JsonLd } from "@/components/JsonLd";
import { OrderSheetProvider } from "@/components/OrderSheet";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ZoomController } from "@/components/ZoomController";
import { graph, personLd, sioaLd, studioLd, websiteLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${identity.artistName} | Origami sculpture by ${identity.person.name}`,
    template: `%s | ${identity.artistName}`,
  },
  description: `${identity.person.name} (${identity.artistName}) is an Indian origami artist designing complex original paper sculptures from a single sheet. Artwork archive, origami design lessons and hand-treated double-tissue paper.`,
  applicationName: identity.artistName,
  authors: [{ name: identity.person.name, url: `${SITE_URL}/about` }],
  creator: identity.person.name,
  publisher: identity.studio.name,
  formatDetection: { telephone: false, email: false, address: false },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = { themeColor: "#f3efe7", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${text.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <OrderSheetProvider>
          <div className="edge-rail" aria-hidden="true">
            <span>
              {identity.person.name} · {identity.artistName}
            </span>
          </div>
          <SiteHeader />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
          <ZoomController />
        </OrderSheetProvider>
        <JsonLd data={graph(websiteLd(), personLd(), studioLd(), sioaLd())} />
      </body>
    </html>
  );
}
