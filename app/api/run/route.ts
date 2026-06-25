import { NextRequest, NextResponse } from "next/server";
import { runPass } from "@/lib/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Manual run triggered from the dashboard. Honours pause + mock dry-run. */
export async function POST(req: NextRequest) {
  let dryRun = false;
  try {
    const body = await req.json();
    dryRun = !!body?.dryRun;
  } catch {
    // no body is fine
  }
  try {
    const result = await runPass({ trigger: "manual", dryRun });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Run failed" },
      { status: 500 }
    );
  }
}
