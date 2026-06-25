export interface Reel {
  id: string;
  caption: string;
  permalink: string;
  timestamp: string;
  commentsCount: number;
  thumbnailUrl?: string;
  mediaProductType?: string;
}

export interface CommentReply {
  id: string;
  username: string;
  text: string;
  fromSelf: boolean;
  timestamp: string;
}

export interface Comment {
  id: string;
  username: string;
  /** Instagram-scoped user id of the commenter, when available (Graph API). */
  userId?: string;
  text: string;
  timestamp: string;
  fromSelf: boolean;
  replies: CommentReply[];
}

/**
 * The verdict for a single comment after analysis.
 * - "unanswered": no reply from me and not yet DMed -> eligible to DM
 * - "replied": I already replied (made a comment back or asked them to DM)
 * - "own": the comment is mine
 * - "already_dmed": present in the DM ledger, skip
 */
export type CommentStatus = "unanswered" | "replied" | "own" | "already_dmed";

export interface AnalyzedComment extends Comment {
  status: CommentStatus;
  reason: string;
}

export interface AppConfig {
  /** Predefined DM message. {username} is substituted. */
  message: string;
  /** When true, no DMs are ever sent (global kill switch). */
  paused: boolean;
  /** "manual" = list only, "auto" = scheduled runs may send. */
  mode: "manual" | "auto";
  /** Max DMs per run. */
  maxDmsPerRun: number;
  /** Delay between DMs, seconds. */
  dmDelaySeconds: number;
  /** Reel ids to monitor in auto mode. Empty = most recent reel only. */
  watchedReelIds: string[];
  /**
   * Phrases that, if found in my reply to a comment, count as "asked them to DM"
   * and therefore the comment is considered handled.
   */
  askedToDmPhrases: string[];
}

export interface LedgerEntry {
  commentId: string;
  username: string;
  reelId: string;
  message: string;
  sentAt: string;
  /** "live" (Graph API), "extension" (browser), or "dry_run". */
  via: "live" | "extension" | "dry_run";
  ok: boolean;
  error?: string;
}

export interface RunResult {
  startedAt: string;
  finishedAt: string;
  source: string;
  reelsScanned: number;
  candidates: number;
  sent: number;
  skipped: number;
  errors: number;
  paused: boolean;
  details: LedgerEntry[];
}

export interface Provider {
  name: string;
  /** Username of the connected account, for self-detection. */
  getSelf(): Promise<{ id: string; username: string }>;
  listReels(limit?: number): Promise<Reel[]>;
  getComments(reelId: string): Promise<Comment[]>;
  /** Send a DM (private reply) to a comment. */
  sendDm(comment: Comment, message: string): Promise<void>;
}
