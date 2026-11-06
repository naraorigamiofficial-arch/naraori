import { randomBytes, randomUUID } from "node:crypto";

// Crockford-style alphabet: no I, L, O, U, easy to read aloud and type.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function shortCode(len = 5) {
  const bytes = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % 32];
  return s;
}

/** Human reference, e.g. NO-2611-7KQ3M. Shown in emails; NOT used as a URL secret. */
export function makeReference(prefix: "NO" | "EN", d = new Date()) {
  const yy = String(d.getUTCFullYear()).slice(2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${prefix}-${yy}${mm}-${shortCode(5)}`;
}

/** 128-bit URL-safe secret for confirmation pages. */
export const makePublicToken = () => randomBytes(16).toString("base64url");
export const uuid = () => randomUUID();
