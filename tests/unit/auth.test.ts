import { scryptSync } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("redirect"); } }));

beforeAll(() => {
  process.env.STUDIO_SESSION_SECRET = "x".repeat(40);
  const salt = Buffer.from("00112233445566778899aabbccddeeff", "hex");
  process.env.STUDIO_ADMIN_PASSWORD_HASH = `scrypt:${salt.toString("hex")}:${scryptSync("correct horse battery", salt, 64).toString("hex")}`;
});

describe("studio auth", async () => {
  const auth = await import("@/lib/auth");
  it("verifies the right password only", () => {
    expect(auth.verifyPassword("correct horse battery")).toBe(true);
    expect(auth.verifyPassword("wrong")).toBe(false);
    expect(auth.verifyPassword("")).toBe(false);
  });
  it("accepts a fresh signed session, rejects tampered or expired ones", () => {
    const v = auth.createSessionValue();
    expect(auth.verifySessionValue(v)).toBe(true);
    const [payload, mac] = v.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "studio", exp: Date.now() + 1e12 })).toString("base64url");
    expect(auth.verifySessionValue(`${forged}.${mac}`)).toBe(false);
    expect(auth.verifySessionValue(`${payload}.x${mac.slice(1)}`)).toBe(false);
    expect(auth.verifySessionValue(v, Date.now() + 13 * 3600_000)).toBe(false);
    expect(auth.verifySessionValue(undefined)).toBe(false);
  });
});
