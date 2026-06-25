# 🎬 Reel DM Manager

A small tool with a UI that watches your Instagram **reel comments** and
**DMs the commenters you haven't replied to** (or asked to DM) with a
predefined message — automatically, on a schedule, while never messaging the
same person twice.

> **The honest version of "auto-DM commenters."** The only way to do this
> without risking your account is Meta's official **Instagram Graph API** and
> its **Private Replies** feature, which lets a Business/Creator account send
> one DM in reply to a comment within 7 days. This app is built around that.
> A best-effort **Chrome-extension** fallback (your own logged-in session) is
> included for when you don't have API access, and a **mock mode** lets you run
> the whole UI with zero setup.

## What it does

For each watched reel, on every pass it:

1. Pulls the comments.
2. Flags each commenter as **Will DM / Replied / Already DMed / You**:
   - *Will DM* = you haven't replied **and** haven't already DMed them.
   - *Replied* = you replied, or your reply asked them to DM (configurable
     phrases) → skipped.
   - *Already DMed* = present in the permanent dedup ledger → skipped.
3. Sends your predefined message to everyone *Will DM*, throttled and capped.

### Built-in safety rails (because auto-DMing gets accounts flagged)

- **Permanent dedup ledger** (`data/ledger.json`) — a person is never DMed twice.
- **Per-run cap** (`maxDmsPerRun`) and **throttle** (`dmDelaySeconds`).
- **Global pause / kill switch** and a **Manual vs Auto** mode.
- Mock mode and "Preview (dry run)" never send anything real.

## Three ways to run it

| Mode | Setup | Sends real DMs? | Notes |
|---|---|---|---|
| **Mock** | none | no | Demo data, dry runs. Great for trying the UI. |
| **Graph API** | Meta app + Business account | yes | Supported, stable, ToS-compliant. |
| **Chrome extension** | load `extension/` | yes | Best-effort, uses your session, fragile selectors. |

## Quick start (mock mode)

```bash
npm install
cp .env.example .env.local   # DATA_SOURCE=mock by default
npm run dev
# open http://localhost:3000
```

You'll see demo reels; click one to see how comments are classified, and use
**Preview (dry run)** / **Run now** on the dashboard.

## Going live with the Instagram Graph API

1. **Account:** convert your Instagram account to **Business or Creator** and
   link it to a Facebook Page.
2. **Meta app:** create an app at <https://developers.facebook.com>, add the
   *Instagram* product, and request these permissions:
   `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`,
   `pages_manage_metadata`, `pages_read_engagement`. (Production use requires
   Meta **App Review**; you can test with your own account beforehand.)
3. **Token:** generate a **long-lived access token** for the connected
   IG/Page.
4. Set in `.env.local`:
   ```bash
   DATA_SOURCE=graph
   IG_ACCESS_TOKEN=...        # long-lived token
   IG_USER_ID=               # optional; auto-detected via /me
   ```
5. Restart. The dashboard now shows your real reels and comments.

> Private Replies can only be sent **once per comment, within 7 days** of the
> comment — so run the schedule at least every couple of days.

## Scheduling (Auto mode)

Auto sends happen **only** when Settings → Mode = **Auto** and Pause is off, and
only via the protected cron endpoint.

- **Vercel:** `vercel.json` already defines a cron hitting `/api/cron`. Set a
  `CRON_SECRET` env var — Vercel sends it as a Bearer token automatically.
- **System cron / GitHub Actions:**
  ```bash
  curl -X POST "https://YOUR_APP/api/cron?key=$CRON_SECRET"
  ```
- **Bundled worker (self-host):**
  ```bash
  APP_URL=http://localhost:3000 CRON_SECRET=... CRON_EXPR="*/30 * * * *" npm run worker
  ```

## Chrome extension

See [`extension/README.md`](extension/README.md). In short: load the unpacked
`extension/` folder, enter your backend URL + `EXTENSION_TOKEN`, open your reel,
and click **Scan this reel & send DMs**. The backend still does the analysis and
dedup; the extension just does the in-page scraping and sending.

## Configuration reference

All behaviour is editable live in **Settings** (stored in `data/config.json`);
`.env` provides the defaults. See [`.env.example`](.env.example).

## Project layout

```
app/                 Next.js App Router (UI pages + API routes)
  api/reels          list reels / classified comments
  api/run            manual DM pass
  api/cron           scheduled DM pass (secret-protected)
  api/extension/*    endpoints the Chrome extension calls
lib/                 provider abstraction, Graph API client, mock data,
                     analysis, dedup store, run engine
extension/           Manifest V3 Chrome extension (companion)
scripts/scheduler.mjs  optional self-host cron worker
data/                JSON store: config, ledger, run history (gitignored)
```

## Responsible use

This tool is for creators replying to people who engaged with their own posts.
Keep volumes modest, only message people who commented on *your* content, honor
opt-outs, and follow Instagram's
[Platform Terms](https://developers.facebook.com/terms/) and Community
Guidelines. Bulk/spammy DMing risks your account regardless of the method.