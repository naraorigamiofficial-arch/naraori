import "server-only";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Studio (admin) authentication.
 * There are no customer accounts on this site, so "logged in" only ever means "the studio owner".
 * - STUDIO_ADMIN_PASSWORD_HASH: "scrypt:<salt-hex>:<hash-hex>" (generate with `npm run studio:password`)
 * - STUDIO_SESSION_SECRET: 32+ random characters used to sign the session cookie.
 */
export const SESSION_COOKIE = "nara_studio";
const SESSION_HOURS = 12;

function secret() {
  const s = process.env.STUDIO_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

export function adminConfigured() {
  return !!(secret() && process.env.STUDIO_ADMIN_PASSWORD_HASH?.startsWith("scrypt:"));
}

export function verifyPassword(password: string, stored = process.env.STUDIO_ADMIN_PASSWORD_HASH ?? "") {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const sign = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("base64url");

export function createSessionValue(now = Date.now()) {
  const key = secret();
  if (!key) throw new Error("STUDIO_SESSION_SECRET not configured");
  const payload = Buffer.from(JSON.stringify({ sub: "studio", exp: now + SESSION_HOURS * 3600_000 })).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

export function verifySessionValue(value: string | undefined, now = Date.now()) {
  const key = secret();
  if (!key || !value) return false;
  const [payload, mac] = value.split(".");
  if (!payload || !mac) return false;
  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.sub === "studio" && typeof data.exp === "number" && data.exp > now;
  } catch {
    return false;
  }
}

export async function isAdmin() {
  return verifySessionValue((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Call at the top of every studio page and server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/studio/login");
}

export async function startSession() {
  (await cookies()).set(SESSION_COOKIE, createSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.NARA_INSECURE_COOKIES !== "1",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
