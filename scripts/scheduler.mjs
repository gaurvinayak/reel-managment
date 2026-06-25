// Standalone scheduler for self-hosting (e.g. on a VPS or a long-running box).
// It simply pings the protected /api/cron endpoint on an interval, so all the
// pause / auto-mode / dedup logic stays in one place (the running Next.js app).
//
// Usage:
//   APP_URL=http://localhost:3000 CRON_SECRET=... CRON_EXPR="*/15 * * * *" npm run worker
//
// On serverless (Vercel) prefer a vercel.json cron hitting /api/cron instead.

import cron from "node-cron";

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const SECRET = process.env.CRON_SECRET || "";
const EXPR = process.env.CRON_EXPR || "*/15 * * * *"; // every 15 min

if (!SECRET) {
  console.error("CRON_SECRET is required.");
  process.exit(1);
}

async function tick() {
  const url = `${APP_URL}/api/cron?key=${encodeURIComponent(SECRET)}`;
  try {
    const res = await fetch(url, { method: "POST" });
    const json = await res.json();
    console.log(
      `[${new Date().toISOString()}] run:`,
      JSON.stringify({
        sent: json.sent,
        candidates: json.candidates,
        errors: json.errors,
        paused: json.paused,
        source: json.source,
      })
    );
  } catch (e) {
    console.error(`[${new Date().toISOString()}] tick failed:`, e.message);
  }
}

console.log(`Scheduler started: "${EXPR}" against ${APP_URL}`);
cron.schedule(EXPR, tick);
