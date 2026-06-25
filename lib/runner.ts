import { analyzeComments, eligibleForDm, renderMessage } from "./analysis";
import { dataSource, getProvider } from "./provider";
import {
  appendLedger,
  appendRun,
  getConfig,
  getDmedCommentIds,
} from "./store";
import type { AnalyzedComment, LedgerEntry, Reel, RunResult } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function nowIso() {
  return new Date().toISOString();
}

/**
 * Run a full DM pass over the watched reels (or the most recent reel).
 *
 * Safety rails enforced here:
 *   - global pause / manual-mode kill switch
 *   - per-run cap (maxDmsPerRun)
 *   - throttle between sends (dmDelaySeconds)
 *   - permanent dedup via the ledger (never DM the same comment twice)
 */
export async function runPass(opts: {
  /** "auto" = scheduled/cron, "manual" = triggered from UI. */
  trigger: "auto" | "manual";
  /** Force a dry run (analyze + log, never send) regardless of config. */
  dryRun?: boolean;
}): Promise<RunResult> {
  const startedAt = nowIso();
  const config = await getConfig();
  const provider = getProvider();
  const isMock = dataSource() === "mock";

  const blockedByMode = opts.trigger === "auto" && config.mode !== "auto";
  const dryRun = !!opts.dryRun || isMock || config.paused || blockedByMode;

  const dmed = await getDmedCommentIds();

  // Resolve which reels to scan.
  let reels: Reel[];
  if (config.watchedReelIds.length > 0) {
    const all = await provider.listReels(50);
    reels = all.filter((r) => config.watchedReelIds.includes(r.id));
  } else {
    const all = await provider.listReels(1);
    reels = all.slice(0, 1);
  }

  // Gather eligible candidates across reels.
  const candidates: { reelId: string; comment: AnalyzedComment }[] = [];
  for (const reel of reels) {
    const comments = await provider.getComments(reel.id);
    const analyzed = analyzeComments(comments, config, dmed);
    for (const c of eligibleForDm(analyzed)) {
      candidates.push({ reelId: reel.id, comment: c });
    }
  }

  const details: LedgerEntry[] = [];
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const { reelId, comment } of candidates) {
    if (sent >= config.maxDmsPerRun) {
      skipped++;
      continue;
    }

    const message = renderMessage(config.message, comment.username);
    const via: LedgerEntry["via"] = dryRun ? "dry_run" : "live";

    if (dryRun) {
      details.push({
        commentId: comment.id,
        username: comment.username,
        reelId,
        message,
        sentAt: nowIso(),
        via,
        ok: true,
      });
      // dry runs do not write to the dedup ledger, so the candidate stays
      // visible until a real send happens.
      sent++;
      continue;
    }

    try {
      await provider.sendDm(comment, message);
      const entry: LedgerEntry = {
        commentId: comment.id,
        username: comment.username,
        reelId,
        message,
        sentAt: nowIso(),
        via: "live",
        ok: true,
      };
      details.push(entry);
      await appendLedger([entry]); // persist immediately for crash-safe dedup
      sent++;
    } catch (e: any) {
      const entry: LedgerEntry = {
        commentId: comment.id,
        username: comment.username,
        reelId,
        message,
        sentAt: nowIso(),
        via: "live",
        ok: false,
        error: e?.message || String(e),
      };
      details.push(entry);
      await appendLedger([entry]);
      errors++;
    }

    if (config.dmDelaySeconds > 0 && sent < candidates.length) {
      await sleep(config.dmDelaySeconds * 1000);
    }
  }

  const result: RunResult = {
    startedAt,
    finishedAt: nowIso(),
    source: dryRun ? `${provider.name} (dry run)` : provider.name,
    reelsScanned: reels.length,
    candidates: candidates.length,
    sent,
    skipped,
    errors,
    paused: config.paused || blockedByMode,
    details,
  };

  await appendRun(result);
  return result;
}
