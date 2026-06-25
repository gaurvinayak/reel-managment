# Reel DM Manager — Chrome extension (companion)

A best-effort fallback for when you don't have Instagram Graph API access. It
reads comments on a reel and sends DMs **through your own logged-in Instagram
session** in the browser. The backend Next.js app remains the "brain": it holds
your predefined message, decides who is eligible, and keeps the permanent dedup
ledger so nobody is messaged twice.

## Install (unpacked)

1. Run the backend app (`npm run dev`) and set `EXTENSION_TOKEN` in `.env.local`.
2. Open `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and select this `extension/` folder.
4. Click the extension icon → enter your **Backend URL** (e.g.
   `http://localhost:3000`) and the same **EXTENSION_TOKEN**, then **Save**.

## Use

1. Open your reel on `instagram.com` and open its comments.
2. Click the extension → **Scan this reel & send DMs**.
3. It scrapes comments, asks the backend who's eligible (skipping anyone you've
   replied to or already DMed), sends the DMs through your session, and reports
   results back to the ledger.

## Important limitations

- Instagram's web markup is obfuscated and changes frequently. If scraping or
  sending stops working, update the selectors/heuristics in **`content.js`** —
  everything fragile is isolated there.
- The web path dedups **per username** (it can't see Graph comment IDs), and it
  can't reliably detect threaded replies, so it's less precise than the Graph
  API path about "already replied". The Graph API is the supported, stable
  integration.
- Sending automated DMs through the web session carries the highest
  account-flagging risk. Keep `MAX_DMS_PER_RUN` low and `DM_DELAY_SECONDS` high.
