import { Policy } from "@/components/Policy";
import { identity } from "@/content/identity";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Accessibility", description: "Accessibility of the Nara Origami website and how to report a problem.", path: "/accessibility" });

export default function AccessibilityPage() {
  return (
    <Policy title="Accessibility" path="/accessibility" updated="6 November 2026">
      <p>This website aims to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA.</p>
      <h2>What we have done</h2>
      <ul>
        <li>Every page can be used with a keyboard, with a visible focus outline and a “skip to content” link.</li>
        <li>Every artwork photograph has a text description; the artwork archive has a plain list view.</li>
        <li>Paper colours are always named in text, never shown by colour alone.</li>
        <li>Page-turn animations are switched off when your device asks for reduced motion.</li>
        <li>All content is readable without JavaScript except the interactive paper selector and forms; orders can always be sent by email instead.</li>
      </ul>
      <h2>Report a problem</h2>
      <p>If something does not work for you, please write to <a href={`mailto:${identity.contact.email}?subject=Accessibility`}>{identity.contact.email}</a>.</p>
    </Policy>
  );
}
