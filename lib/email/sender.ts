import { promises as fs } from "node:fs";
import path from "node:path";
import { Resend } from "resend";
import type { EmailMessage } from "./templates";

export interface EmailSender {
  readonly kind: "resend" | "dev-file";
  send(msg: EmailMessage, idempotencyKey: string): Promise<{ id: string }>;
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email is not configured (RESEND_API_KEY / EMAIL_FROM missing).");
    this.name = "EmailNotConfiguredError";
  }
}

export interface EmailConfig {
  from: string;
  replyTo: string;
  studioInbox: string;
}

/** Sender & recipient addresses are configuration, never invented in code. */
export function emailConfig(): EmailConfig | null {
  const from = process.env.EMAIL_FROM;
  const studioInbox = process.env.STUDIO_NOTIFY_EMAIL;
  if (!from || !studioInbox) return null;
  return { from, studioInbox, replyTo: process.env.EMAIL_REPLY_TO ?? studioInbox };
}

class ResendSender implements EmailSender {
  readonly kind = "resend" as const;
  private client: Resend;
  constructor(apiKey: string, private from: string) {
    this.client = new Resend(apiKey);
  }
  async send(msg: EmailMessage, idempotencyKey: string) {
    const { data, error } = await this.client.emails.send(
      { from: this.from, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text, replyTo: msg.replyTo },
      { idempotencyKey },
    );
    if (error || !data) throw new Error(`Resend: ${error?.message ?? "no response"}`);
    return { id: data.id };
  }
}

/** Development only: writes each email to .data/mail so it can be opened in a browser. */
class DevFileSender implements EmailSender {
  readonly kind = "dev-file" as const;
  constructor(private dir: string) {}
  async send(msg: EmailMessage, idempotencyKey: string) {
    await fs.mkdir(this.dir, { recursive: true });
    const base = path.join(this.dir, idempotencyKey);
    await fs.writeFile(`${base}.html`, msg.html);
    await fs.writeFile(`${base}.txt`, `To: ${msg.to}\nReply-To: ${msg.replyTo ?? ""}\nSubject: ${msg.subject}\n\n${msg.text}`);
    return { id: `dev-${idempotencyKey}` };
  }
}

let override: EmailSender | null = null;
/** Tests inject a fake sender (e.g. one that fails) through this. */
export function setEmailSenderForTests(s: EmailSender | null) {
  override = s;
}

export function getEmailSender(): EmailSender {
  if (override) return override;
  const key = process.env.RESEND_API_KEY;
  const cfg = emailConfig();
  if (key && cfg) return new ResendSender(key, cfg.from);
  if (process.env.NODE_ENV !== "production" || process.env.NARA_FILE_STORE === "1")
    return new DevFileSender(path.join(process.env.NARA_DATA_DIR ?? path.join(process.cwd(), ".data"), "mail"));
  throw new EmailNotConfiguredError();
}
