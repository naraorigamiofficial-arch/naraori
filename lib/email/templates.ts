import { identity, SITE_URL } from "@/content/identity";
import { formatINR, formatUSDCents } from "@/lib/shop/money";
import type { EnquiryRecord, OrderRequestRecord } from "@/lib/store/types";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Accessible, table-based email shell. Paper ground, ink text, one rule line, like the site. */
function shell(title: string, preheader: string, body: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f2eee6;color:#1d1b18;">
<span style="display:none!important;opacity:0;height:0;width:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2eee6;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fbf9f4;border-top:3px solid #7a2e24;">
<tr><td style="padding:28px 32px 8px;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#6b645a;">${esc(identity.studio.name)}</td></tr>
<tr><td style="padding:0 32px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#1d1b18;">${body}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #ddd6c9;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b645a;">${esc(identity.artistName)} · ${esc(identity.person.name)} · <a href="${SITE_URL}" style="color:#7a2e24;">${SITE_URL.replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(o: OrderRequestRecord) {
  const rows = o.lines
    .map(
      (l) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #e6e0d5;">${esc(l.productName)}<br><span style="color:#6b645a;font-size:14px;">${esc(l.optionLabel)} · ${esc(l.colourName)}</span></td>
<td style="padding:10px 8px;border-bottom:1px solid #e6e0d5;text-align:right;white-space:nowrap;">× ${l.units}</td>
<td style="padding:10px 0;border-bottom:1px solid #e6e0d5;text-align:right;white-space:nowrap;">${l.lineTotal === null ? "By enquiry" : formatINR(l.lineTotal)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;margin:16px 0;">
<tr><th align="left" style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b645a;padding-bottom:6px;">Item</th><th align="right" style="font-size:12px;color:#6b645a;">Qty</th><th align="right" style="font-size:12px;color:#6b645a;">Amount</th></tr>
${rows}
<tr><td colspan="2" style="padding:12px 0;"><strong>Subtotal (estimate)</strong></td><td style="padding:12px 0;text-align:right;"><strong>${formatINR(o.subtotal)}</strong></td></tr>
<tr><td colspan="2" style="padding:0 0 12px;color:#6b645a;">Shipping (estimate)</td><td style="text-align:right;color:#6b645a;">${shippingText(o)}</td></tr>
</table>`;
}

export function shippingText(o: Pick<OrderRequestRecord, "shippingEstimate">) {
  const s = o.shippingEstimate;
  if (s.region === "domestic") return s.free ? "Free within India" : formatINR(s.amount);
  return `${formatUSDCents(s.usdCents)} (international, estimate)`;
}

const itemsText = (o: OrderRequestRecord) =>
  o.lines.map((l) => `- ${l.productName}, ${l.optionLabel}, ${l.colourName} × ${l.units}: ${l.lineTotal === null ? "price by enquiry" : formatINR(l.lineTotal)}`).join("\n") +
  `\nSubtotal (estimate): ${formatINR(o.subtotal)}\nShipping (estimate): ${shippingText(o)}`;

const location = (o: OrderRequestRecord) => [o.customer.city, o.customer.region, o.customer.postalCode, o.customer.country].filter(Boolean).join(", ");

export function orderStudioEmail(o: OrderRequestRecord, to: string): EmailMessage {
  const adminUrl = `${SITE_URL}/studio/orders/${o.id}`;
  const html = shell(
    `New order request ${o.reference}`,
    `${o.customer.name} requested ${o.lines.length} item(s)`,
    `<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:16px 0;">New order request <span style="white-space:nowrap">${esc(o.reference)}</span></h1>
<p style="margin:0 0 4px;"><strong>${esc(o.customer.name)}</strong> · <a href="mailto:${esc(o.customer.email)}" style="color:#7a2e24;">${esc(o.customer.email)}</a>${o.customer.phone ? ` · ${esc(o.customer.phone)}` : ""}</p>
<p style="margin:0;color:#6b645a;">Ships to: ${esc(location(o))}</p>
${itemsTable(o)}
${o.hasEnquiryItems ? `<p style="color:#7a2e24;">Includes items priced by enquiry: a quote is needed.</p>` : ""}
${o.note ? `<p style="margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b645a;">Customer note</p><p style="white-space:pre-wrap;margin:0 0 16px;">${esc(o.note)}</p>` : ""}
<p><a href="${adminUrl}" style="display:inline-block;background:#1d1b18;color:#fbf9f4;padding:12px 18px;text-decoration:none;">Open in studio dashboard</a></p>
<p style="font-size:13px;color:#6b645a;">Reply to this email to write to the customer directly.</p>`,
  );
  const text = `New order request ${o.reference}\n\n${o.customer.name} <${o.customer.email}>${o.customer.phone ? ` · ${o.customer.phone}` : ""}\nShips to: ${location(o)}\n\n${itemsText(o)}\n${o.note ? `\nCustomer note:\n${o.note}\n` : ""}\nStudio dashboard: ${adminUrl}\n`;
  return { to, subject: `New order request ${o.reference} from ${o.customer.name}`, html, text, replyTo: o.customer.email };
}

export function orderCustomerEmail(o: OrderRequestRecord, replyTo: string): EmailMessage {
  const html = shell(
    `We received your order request ${o.reference}`,
    `Reference ${o.reference}. Nothing has been charged.`,
    `<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:16px 0;">Thank you, ${esc(o.customer.name.split(" ")[0])}.</h1>
<p>We have received your paper order request. Your reference is <strong style="white-space:nowrap">${esc(o.reference)}</strong>.</p>
<p style="background:#f2eee6;padding:14px 16px;border-left:3px solid #7a2e24;margin:16px 0;"><strong>This is not a confirmed purchase.</strong> Availability, the final total (including shipping) and payment details have not been confirmed yet, and nothing has been charged.</p>
${itemsTable(o)}
<p><strong>What happens next:</strong> the studio will check availability and write to you at this address with the final total and how to pay. Paper is made by hand, so please allow a few days for a reply.</p>
<p>Questions or changes? Simply reply to this email and mention ${esc(o.reference)}.</p>`,
  );
  const text = `Thank you. We received your order request.\nReference: ${o.reference}\n\nTHIS IS NOT A CONFIRMED PURCHASE. Availability, the final total (including shipping) and payment details have not been confirmed yet, and nothing has been charged.\n\n${itemsText(o)}\n\nWhat happens next: the studio will check availability and write to you with the final total and how to pay.\nQuestions? Reply to this email and mention ${o.reference}.\n\n${identity.studio.name}, ${SITE_URL}\n`;
  return { to: o.customer.email, subject: `Order request received: ${o.reference}`, html, text, replyTo };
}

const KIND_LABEL: Record<string, string> = {
  commission: "Commission", acquisition: "Acquiring an existing work", collaboration: "Collaboration / brand", press: "Press / media", general: "General",
};

export function enquiryStudioEmail(e: EnquiryRecord, to: string): EmailMessage {
  const rows = [["Type", KIND_LABEL[e.kind] ?? e.kind], ["From", `${e.name} <${e.email}>`], ["Organisation", e.organisation], ["Country", e.country], ["Budget", e.budget], ["Timeline", e.timeline]].filter(([, v]) => v);
  const html = shell(
    `New enquiry ${e.reference}`,
    `${KIND_LABEL[e.kind]} enquiry from ${e.name}`,
    `<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:16px 0;">${esc(KIND_LABEL[e.kind] ?? "Enquiry")}: ${esc(e.reference)}</h1>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;">${rows.map(([k, v]) => `<tr><td style="padding:3px 16px 3px 0;color:#6b645a;">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
<p style="white-space:pre-wrap;margin-top:16px;">${esc(e.message)}</p>
<p><a href="${SITE_URL}/studio/enquiries" style="color:#7a2e24;">Studio dashboard</a></p>`,
  );
  const text = `${KIND_LABEL[e.kind]} enquiry ${e.reference}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${e.message}\n`;
  return { to, subject: `${KIND_LABEL[e.kind]} enquiry ${e.reference} from ${e.name}`, html, text, replyTo: e.email };
}

export function enquiryCustomerEmail(e: EnquiryRecord, replyTo: string): EmailMessage {
  const html = shell(
    `Your enquiry ${e.reference}`,
    "Thank you for writing to Nara Origami.",
    `<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:16px 0;">Thank you for writing.</h1>
<p>Your message has reached the studio of ${esc(identity.person.name)}. Your reference is <strong>${esc(e.reference)}</strong>.</p>
<p>Every enquiry is read personally. Because each project is considered individually, a reply can take a little time; it does not mean an enquiry has been accepted or declined.</p>
<p>You can reply to this email to add anything further.</p>`,
  );
  const text = `Thank you for writing to Nara Origami.\nReference: ${e.reference}\n\nEvery enquiry is read personally. A reply can take a little time; it does not mean an enquiry has been accepted or declined.\nYou can reply to this email to add anything further.\n`;
  return { to: e.email, subject: `We received your enquiry: ${e.reference}`, html, text, replyTo };
}
