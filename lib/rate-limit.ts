import { createHash } from "node:crypto";

/**
 * Small fixed-window limiter. In-memory, so on serverless hosting each instance counts
 * separately, it stops casual abuse; the honeypot, timing check and idempotency keys
 * cover the rest. (See PROJECT_DECISIONS.md for the upgrade path.)
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const k = createHash("sha256").update(key).digest("hex");
  const b = buckets.get(k);
  if (!b || b.resetAt <= now) {
    buckets.set(k, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) for (const [kk, v] of buckets) if (v.resetAt <= now) buckets.delete(kk);
    return { ok: true, retryAfter: 0 };
  }
  b.count++;
  return b.count > limit ? { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) } : { ok: true, retryAfter: 0 };
}

export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
