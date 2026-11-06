import { NextResponse, type NextRequest } from "next/server";
import { submitEnquiry } from "@/lib/orders/service";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limit = rateLimit(`enquiry:${clientIp(req.headers)}`, 5, 10 * 60_000);
  if (!limit.ok) return NextResponse.json({ ok: false, error: "Too many messages. Please wait a few minutes." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  const raw = await req.text();
  if (raw.length > 16_000) return NextResponse.json({ ok: false, error: "Message too long." }, { status: 413 });
  try {
    const result = await submitEnquiry(JSON.parse(raw));
    if (!result.ok) return NextResponse.json(result, { status: result.status });
    return NextResponse.json({ ok: true, reference: result.reference, emails: result.emails }, { status: 201 });
  } catch (e) {
    console.error("[enquiries] error:", (e as Error).message);
    return NextResponse.json({ ok: false, error: "Your message could not be sent. Please try again, or email the studio directly." }, { status: 500 });
  }
}
