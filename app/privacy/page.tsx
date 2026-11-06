import { Policy } from "@/components/Policy";
import { identity } from "@/content/identity";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Privacy", description: "What personal information this website collects, why, and how long it is kept.", path: "/privacy" });

export default function PrivacyPage() {
  return (
    <Policy title="Privacy" path="/privacy" updated="6 November 2026">
      <p>This website is run by {identity.person.name} ({identity.studio.name}). It collects as little personal information as possible.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Order requests:</b> your name, email, optional phone number, city/region/postal code and country, your note, and the items you chose.</li>
        <li><b>Enquiries:</b> your name, email, country, optional organisation, budget and timeline, and your message.</li>
        <li><b>Your order sheet</b> is stored only in your own browser until you submit it.</li>
      </ul>
      <p>There are no customer accounts, no advertising trackers and no marketing emails. We never ask for card or bank details on this website.</p>
      <h2>Why</h2>
      <p>Only to reply to you, to confirm and fulfil an order you have asked for, and to keep basic business records.</p>
      <h2>Who processes it</h2>
      <ul>
        <li>Requests are stored in a private database hosted by Supabase.</li>
        <li>Emails about your request are sent through Resend.</li>
        <li>The website is hosted on Vercel.</li>
      </ul>
      <h2>How long</h2>
      <p>Order and enquiry records are kept for as long as needed for the order and for ordinary accounting purposes, then deleted. You can ask for your information to be corrected or deleted at any time.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${identity.contact.email}?subject=Privacy`}>{identity.contact.email}</a></p>
    </Policy>
  );
}
