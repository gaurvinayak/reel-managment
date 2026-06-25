import { NextRequest, NextResponse } from "next/server";
import { appendLedger, appendRun } from "@/lib/store";
import { extensionAuthorized } from "@/lib/extauth";
import type { LedgerEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The extension reports the DMs it actually sent in the browser. We record
 * them in the dedup ledger so they're never sent again, and log a run.
 *
 * Body: { reelId, entries: [{ commentId, username, ok, error? }] }
 */
export async function POST(req: NextRequest) {
  if (!extensionAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const reelId: string = body?.reelId || "web";
  const incoming: any[] = Array.isArray(body?.entries) ? body.entries : [];
  const now = new Date().toISOString();

  const entries: LedgerEntry[] = incoming.map((e) => ({
    commentId: String(e.commentId),
    username: String(e.username || ""),
    reelId,
    message: String(e.message || ""),
    sentAt: now,
    via: "extension",
    ok: !!e.ok,
    error: e.error ? String(e.error) : undefined,
  }));

  await appendLedger(entries);

  const sent = entries.filter((e) => e.ok).length;
  const errors = entries.length - sent;
  await appendRun({
    startedAt: now,
    finishedAt: now,
    source: "Chrome extension",
    reelsScanned: 1,
    candidates: entries.length,
    sent,
    skipped: 0,
    errors,
    paused: false,
    details: entries,
  });

  return NextResponse.json({ recorded: entries.length, sent, errors });
}
