import { NextRequest, NextResponse } from "next/server";
import { runPass } from "@/lib/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Scheduled entrypoint. Call this from Vercel Cron, GitHub Actions, or system
 * cron. Must present the CRON_SECRET either as `?key=` or
 * `Authorization: Bearer <secret>`.
 *
 * This is the ONLY path that performs auto sends, and only when
 * config.mode === "auto" and config.paused === false.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  const key = new URL(req.url).searchParams.get("key") || "";
  const provided = auth.replace(/^Bearer\s+/i, "") || key;

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runPass({ trigger: "auto" });
  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
