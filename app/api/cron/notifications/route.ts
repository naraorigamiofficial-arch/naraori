import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { retryPending } from "@/lib/notifications";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Retries unsent emails. Called by Vercel Cron with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) return NextResponse.json({ ok: false }, { status: 401 });
  const store = getStore();
  if (!store) return NextResponse.json({ ok: false, error: "store not configured" }, { status: 503 });
  return NextResponse.json({ ok: true, ...(await retryPending(store)) });
}
