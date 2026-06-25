import { NextRequest, NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/store";
import { dataSource } from "@/lib/provider";
import type { AppConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getConfig();
  return NextResponse.json({ config, dataSource: dataSource() });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<AppConfig>;
  // Whitelist editable fields.
  const patch: Partial<AppConfig> = {};
  if (typeof body.message === "string") patch.message = body.message;
  if (typeof body.paused === "boolean") patch.paused = body.paused;
  if (body.mode === "manual" || body.mode === "auto") patch.mode = body.mode;
  if (typeof body.maxDmsPerRun === "number")
    patch.maxDmsPerRun = Math.max(1, Math.min(200, body.maxDmsPerRun));
  if (typeof body.dmDelaySeconds === "number")
    patch.dmDelaySeconds = Math.max(0, body.dmDelaySeconds);
  if (Array.isArray(body.watchedReelIds))
    patch.watchedReelIds = body.watchedReelIds.filter(
      (x): x is string => typeof x === "string"
    );
  if (Array.isArray(body.askedToDmPhrases))
    patch.askedToDmPhrases = body.askedToDmPhrases.filter(
      (x): x is string => typeof x === "string"
    );

  const config = await saveConfig(patch);
  return NextResponse.json({ config });
}
