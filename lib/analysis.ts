import type { AnalyzedComment, AppConfig, Comment } from "./types";

/**
 * Decide, for each comment on a reel, whether we should DM the commenter.
 *
 * A commenter is eligible ("unanswered") when ALL are true:
 *   - the comment is not mine
 *   - I have not replied to it (replying = "made a comment back")
 *   - none of my replies "asked them to DM" (covered by the no-reply rule,
 *     but we also treat a reply containing an ask-to-DM phrase as handled)
 *   - I have not already DMed this comment (dedup ledger)
 */
export function analyzeComments(
  comments: Comment[],
  config: AppConfig,
  dmedCommentIds: Set<string>
): AnalyzedComment[] {
  const phrases = config.askedToDmPhrases.map((p) => p.toLowerCase());

  return comments.map((c): AnalyzedComment => {
    if (c.fromSelf) {
      return { ...c, status: "own", reason: "Your own comment" };
    }

    if (dmedCommentIds.has(c.id)) {
      return {
        ...c,
        status: "already_dmed",
        reason: "Already DMed (in ledger)",
      };
    }

    const myReplies = c.replies.filter((r) => r.fromSelf);
    if (myReplies.length > 0) {
      const askedToDm = myReplies.some((r) =>
        phrases.some((p) => r.text.toLowerCase().includes(p))
      );
      return {
        ...c,
        status: "replied",
        reason: askedToDm
          ? "You already asked them to DM"
          : "You already replied",
      };
    }

    return {
      ...c,
      status: "unanswered",
      reason: "No reply from you yet",
    };
  });
}

export function eligibleForDm(analyzed: AnalyzedComment[]): AnalyzedComment[] {
  return analyzed.filter((c) => c.status === "unanswered");
}

export function renderMessage(template: string, username: string): string {
  return template.replaceAll("{username}", username);
}
