import { NextRequest, NextResponse } from "next/server";
import { getConfig } from "@/lib/store";
import { extensionAuthorized } from "@/lib/extauth";

export const dynamic = "force-dynamic";

/** The extension fetches behaviour config (message, throttle, etc). */
export async function GET(req: NextRequest) {
  if (!extensionAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const config = await getConfig();
  return NextResponse.json({
    message: config.message,
    paused: config.paused,
    mode: config.mode,
    maxDmsPerRun: config.maxDmsPerRun,
    dmDelaySeconds: config.dmDelaySeconds,
    askedToDmPhrases: config.askedToDmPhrases,
  });
}
