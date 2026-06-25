import type { Comment, Provider, Reel } from "./types";

/**
 * Instagram Graph API provider.
 *
 * Uses the official Meta Graph API. To send a DM to someone who commented on
 * your reel WITHOUT violating Instagram's automation policy, we use the
 * "Private Replies" feature: POST /{ig-user-id}/messages with
 * recipient.comment_id. This is allowed once per comment, within 7 days.
 *
 * Required token scopes: instagram_basic, instagram_manage_comments,
 * instagram_manage_messages, pages_manage_metadata, pages_read_engagement.
 */
export class GraphApiProvider implements Provider {
  name = "Instagram Graph API";
  private base: string;
  private token: string;
  private userId?: string;
  private selfUsername?: string;

  constructor() {
    const version = process.env.IG_GRAPH_VERSION || "v21.0";
    this.base = `https://graph.facebook.com/${version}`;
    this.token = process.env.IG_ACCESS_TOKEN || "";
    this.userId = process.env.IG_USER_ID || undefined;
    if (!this.token) {
      throw new Error(
        "IG_ACCESS_TOKEN is not set. Set DATA_SOURCE=mock to run without Instagram, or provide a Graph API token."
      );
    }
  }

  private async get(pathAndQuery: string): Promise<any> {
    const sep = pathAndQuery.includes("?") ? "&" : "?";
    const url = `${this.base}/${pathAndQuery}${sep}access_token=${encodeURIComponent(
      this.token
    )}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(
        `Graph API GET ${pathAndQuery} failed: ${json?.error?.message || res.statusText}`
      );
    }
    return json;
  }

  async getSelf(): Promise<{ id: string; username: string }> {
    if (this.userId && this.selfUsername) {
      return { id: this.userId, username: this.selfUsername };
    }
    const me = await this.get(`me?fields=id,username,user_id`);
    // Depending on token type the IG user id is `user_id` or `id`.
    this.userId = this.userId || me.user_id || me.id;
    this.selfUsername = me.username;
    return { id: this.userId!, username: this.selfUsername || "" };
  }

  async listReels(limit = 25): Promise<Reel[]> {
    const { id } = await this.getSelf();
    const fields =
      "id,caption,media_type,media_product_type,permalink,timestamp,comments_count,thumbnail_url,media_url";
    const json = await this.get(`${id}/media?fields=${fields}&limit=${limit}`);
    const items: any[] = json.data || [];
    return items
      .filter(
        (m) =>
          m.media_product_type === "REELS" ||
          m.media_type === "VIDEO" ||
          m.media_product_type === "FEED"
      )
      .map((m) => ({
        id: m.id,
        caption: m.caption || "",
        permalink: m.permalink || "",
        timestamp: m.timestamp || "",
        commentsCount: m.comments_count || 0,
        thumbnailUrl: m.thumbnail_url || m.media_url,
        mediaProductType: m.media_product_type,
      }));
  }

  async getComments(reelId: string): Promise<Comment[]> {
    const self = await this.getSelf();
    const fields =
      "id,text,username,timestamp,from,replies{id,text,username,timestamp,from}";
    const json = await this.get(`${reelId}/comments?fields=${fields}&limit=100`);
    const items: any[] = json.data || [];
    return items.map((c) => {
      const fromSelf =
        c.from?.id === self.id || (c.username && c.username === self.username);
      const replies = (c.replies?.data || []).map((r: any) => ({
        id: r.id,
        username: r.username || "",
        text: r.text || "",
        fromSelf:
          r.from?.id === self.id || (r.username && r.username === self.username),
        timestamp: r.timestamp || "",
      }));
      return {
        id: c.id,
        username: c.username || "",
        userId: c.from?.id,
        text: c.text || "",
        timestamp: c.timestamp || "",
        fromSelf: !!fromSelf,
        replies,
      };
    });
  }

  async sendDm(comment: Comment, message: string): Promise<void> {
    const { id } = await this.getSelf();
    const url = `${this.base}/${id}/messages?access_token=${encodeURIComponent(
      this.token
    )}`;
    const body = {
      recipient: { comment_id: comment.id },
      message: { text: message },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
      throw new Error(
        `Private reply failed for comment ${comment.id}: ${
          json?.error?.message || res.statusText
        }`
      );
    }
  }
}
