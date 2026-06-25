import type { Comment, Provider, Reel } from "./types";

/**
 * Mock provider: realistic fake data so the whole UI and run logic work with
 * no Instagram account. DMs are NOT sent anywhere; runner records them as
 * dry_run when DATA_SOURCE=mock.
 */
const SELF = { id: "self_0", username: "you" };

const REELS: Reel[] = [
  {
    id: "reel_1",
    caption: "5 dopamine-detox habits that actually changed my life 🧠 (full guide in comments)",
    permalink: "https://instagram.com/reel/reel_1",
    timestamp: "2026-06-24T09:00:00Z",
    commentsCount: 6,
    mediaProductType: "REELS",
  },
  {
    id: "reel_2",
    caption: "POV: you finally deleted the apps stealing your focus 📵",
    permalink: "https://instagram.com/reel/reel_2",
    timestamp: "2026-06-22T14:30:00Z",
    commentsCount: 3,
    mediaProductType: "REELS",
  },
];

const COMMENTS: Record<string, Comment[]> = {
  reel_1: [
    {
      id: "c1",
      username: "focus_seeker",
      userId: "u1",
      text: "This is gold! Where's the guide?",
      timestamp: "2026-06-24T09:05:00Z",
      fromSelf: false,
      replies: [],
    },
    {
      id: "c2",
      username: "calm.mornings",
      userId: "u2",
      text: "Need the link please 🙏",
      timestamp: "2026-06-24T09:12:00Z",
      fromSelf: false,
      replies: [
        {
          id: "r2",
          username: "you",
          text: "Just sent it to your DMs! 💌",
          fromSelf: true,
          timestamp: "2026-06-24T09:20:00Z",
        },
      ],
    },
    {
      id: "c3",
      username: "deepwork_dan",
      userId: "u3",
      text: "Can you share more on habit #3?",
      timestamp: "2026-06-24T10:00:00Z",
      fromSelf: false,
      replies: [],
    },
    {
      id: "c4",
      username: "you",
      userId: "self_0",
      text: "Thanks everyone — DM me the word GUIDE and I'll send it!",
      timestamp: "2026-06-24T10:05:00Z",
      fromSelf: true,
      replies: [],
    },
    {
      id: "c5",
      username: "mindful.maya",
      userId: "u5",
      text: "Saving this 🔥 guide?",
      timestamp: "2026-06-24T11:00:00Z",
      fromSelf: false,
      replies: [
        {
          id: "r5",
          username: "you",
          text: "DM me and I'll send it over!",
          fromSelf: true,
          timestamp: "2026-06-24T11:10:00Z",
        },
      ],
    },
    {
      id: "c6",
      username: "rahul_codes",
      userId: "u6",
      text: "Link? 👀",
      timestamp: "2026-06-24T12:30:00Z",
      fromSelf: false,
      replies: [],
    },
  ],
  reel_2: [
    {
      id: "c7",
      username: "offline_olivia",
      userId: "u7",
      text: "How did you stay consistent?",
      timestamp: "2026-06-22T15:00:00Z",
      fromSelf: false,
      replies: [],
    },
    {
      id: "c8",
      username: "screen_free_sam",
      userId: "u8",
      text: "Needed this today ❤️",
      timestamp: "2026-06-22T15:30:00Z",
      fromSelf: false,
      replies: [],
    },
    {
      id: "c9",
      username: "you",
      userId: "self_0",
      text: "Glad it helped! 🙌",
      timestamp: "2026-06-22T16:00:00Z",
      fromSelf: true,
      replies: [],
    },
  ],
};

export class MockProvider implements Provider {
  name = "Mock (demo data)";

  async getSelf() {
    return SELF;
  }

  async listReels(): Promise<Reel[]> {
    return REELS;
  }

  async getComments(reelId: string): Promise<Comment[]> {
    return JSON.parse(JSON.stringify(COMMENTS[reelId] || []));
  }

  async sendDm(): Promise<void> {
    // No-op in mock mode; runner records these as dry_run.
    return;
  }
}
