import { NextRequest, NextResponse } from "next/server";
import { analyzeComments, renderMessage } from "@/lib/analysis";
import { getConfig, getDmedCommentIds } from "@/lib/store";
import { extensionAuthorized } from "@/lib/extauth";
import type { Comment } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The extension scrapes comments from the Instagram web page and posts them
 * here. The backend (the "brain") decides who is eligible for a DM, applying
 * the same analysis + permanent dedup ledger used by the Graph API path.
 *
 * Body: { reelId, comments: Comment[] }
 * Returns: { eligible: [{ commentId, username, message }] }
 */
export async function POST(req: NextRequest) {
  if (!extensionAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const reelId: string = body?.reelId || "web";
  const incoming: Comment[] = Array.isArray(body?.comments) ? body.comments : [];

  const [config, dmed] = await Promise.all([getConfig(), getDmedCommentIds()]);

  if (config.paused) {
    return NextResponse.json({ eligible: [], paused: true });
  }

  const analyzed = analyzeComments(incoming, config, dmed);
  const eligible = analyzed
    .filter((c) => c.status === "unanswered")
    .slice(0, config.maxDmsPerRun)
    .map((c) => ({
      commentId: c.id,
      username: c.username,
      message: renderMessage(config.message, c.username),
    }));

  return NextResponse.json({
    eligible,
    reelId,
    dmDelaySeconds: config.dmDelaySeconds,
    paused: false,
  });
}
