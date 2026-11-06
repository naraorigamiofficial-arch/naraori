import { NextResponse, type NextRequest } from "next/server";
import { submitOrderRequest } from "@/lib/orders/service";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limit = rateLimit(`order:${clientIp(req.headers)}`, 8, 10 * 60_000);
  if (!limit.ok)
    return NextResponse.json({ ok: false, error: "Too many requests. Please wait a few minutes and try again." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ ok: false, error: "Unsupported request." }, { status: 415 });
  const raw = await req.text();
  if (raw.length > 32_000) return NextResponse.json({ ok: false, error: "Request too large." }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  try {
    const result = await submitOrderRequest(body);
    if (!result.ok) return NextResponse.json(result, { status: result.status });
    // Only what the confirmation page needs, no personal data echoed back.
    return NextResponse.json({ ok: true, reference: result.reference, token: result.token, duplicate: result.duplicate, emails: result.emails }, { status: result.duplicate ? 200 : 201 });
  } catch (e) {
    console.error("[order-requests] unexpected error:", (e as Error).message);
    return NextResponse.json({ ok: false, error: "Your request could not be saved. Nothing was submitted. Please try again, or email the studio." }, { status: 500 });
  }
}
