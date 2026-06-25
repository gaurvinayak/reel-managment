# 🎬 Reel DM Manager

A simple app that looks at the comments on your Instagram **reel**, finds the
people you **haven't replied to yet**, and sends each of them a **direct message
(DM)** that you write once — automatically. It never messages the same person
twice.

**No coding needed to try it.** Follow the steps below exactly and you'll have
it running on your own computer.

---

## 🧠 First, the important part (please read)

Instagram does **not** allow random tools to log into your account and blast out
DMs — doing that gets accounts banned. So this app gives you three options:

| Option | What it is | Do you need it to start? |
|---|---|---|
| 🟢 **Try-it (Demo) mode** | The app runs with fake example data so you can click around and see how it works. **Sends nothing.** | ✅ Start here — zero setup. |
| 🔵 **Official Instagram mode** | The real, account-safe way. Uses Instagram's own approved system to DM people who commented. Needs a one-time setup with Meta (Instagram's parent company). | Later, when you're ready to go live. |
| 🟠 **Chrome extension mode** | A backup that works through your own browser while you're logged into Instagram. | Optional. |

👉 **Everyone should start with Demo mode** (the next section). It takes about 10
minutes and proves everything works before you touch any Instagram settings.

---

## ✅ Part 1 — Get the Demo running (start here)

### Step 1: Install Node.js (one time)

Node.js is the free engine this app runs on.

1. Go to **<https://nodejs.org>**
2. Click the big button that says **"LTS"** (the recommended version).
3. Open the downloaded file and click **Next → Next → Install** like any normal
   program. Accept the defaults.

> 💡 Not sure if you already have it? Skip ahead to Step 3 and run
> `node --version`. If it prints a number like `v20.x.x`, you're set.

### Step 2: Get the app's files onto your computer

If you're reading this on GitHub:

1. Click the green **`<> Code`** button near the top of the page.
2. Click **Download ZIP**.
3. Find the downloaded ZIP file (usually in your **Downloads** folder) and
   **unzip it** (double-click it on Mac, or right-click → *Extract All* on
   Windows).
4. You'll now have a folder named something like `reel-managment`. Remember
   where it is.

### Step 3: Open a Terminal in that folder

The Terminal is a window where you type commands. Don't worry — you'll only
copy-paste a few.

- **On Windows:** open the `reel-managment` folder, click the address bar at the
  top, type `cmd`, and press **Enter**. A black window opens — that's the
  Terminal, already pointed at the right folder.
- **On Mac:** open the **Terminal** app (press `Cmd + Space`, type "Terminal",
  press Enter). Then type `cd ` (with a space), drag the `reel-managment` folder
  onto the window, and press **Enter**.

### Step 4: Install the app (one time)

Copy this line, paste it into the Terminal, and press **Enter**:

```
npm install
```

It will print a lot of text for a minute or two. That's normal. Wait until it
finishes and you can type again.

### Step 5: Create your settings file

This makes a copy of the example settings. Paste the line for your computer:

- **Windows:**
  ```
  copy .env.example .env.local
  ```
- **Mac:**
  ```
  cp .env.example .env.local
  ```

(It starts in safe Demo mode automatically — nothing gets sent.)

### Step 6: Start the app

Paste this and press **Enter**:

```
npm run dev
```

When it says something like **"Ready"** and shows
`http://localhost:3000`, the app is running. 🎉

### Step 7: Open it in your browser

Open your web browser (Chrome, Safari, Edge…) and go to:

**<http://localhost:3000>**

You'll see the dashboard with example reels. Click a reel to see how the app
labels each comment:

- 🟡 **Will DM** — you haven't replied to this person, so they'd get your message.
- 🟢 **Replied** — you already answered (or told them to DM), so they're skipped.
- 🟢 **DMed** — already messaged before, skipped forever.
- ⚪ **You** — your own comment, ignored.

Click **"Preview (dry run)"** to see who *would* be messaged — safely, sending
nothing.

> 🛑 **To stop the app:** click the Terminal window and press `Ctrl + C`.
> **To start it again later:** open the Terminal in the folder (Step 3) and run
> `npm run dev` again.

---

## ✍️ Part 2 — Write your message and choose how it sends

1. In the app, click **Settings** (top right).
2. **Message box:** type the DM you want to send. You can use `{username}` and it
   will be swapped for each person's handle. Example:
   > Hey {username}! Thanks for commenting 🙏 Here's the link you asked for: …
3. **Mode:**
   - **Manual** = nothing sends unless *you* click "Run now". (Safest.)
   - **Auto** = the app sends on a schedule by itself.
4. **Pause switch:** a big stop button. When on, nothing is ever sent.
5. **Max DMs per run** and **Delay between DMs:** keep these gentle (e.g. 20 and
   8 seconds). Sending too fast is what makes Instagram suspicious.
6. Click **Save**.

In Demo mode, "Run now" still sends nothing real — it just shows you what would
happen. To actually send messages, set up one of the two modes below.

---

## 🔵 Part 3 — Going live the official, account-safe way

This is the recommended way to send real DMs. It's a one-time setup with Meta
(Instagram's owner). It takes a bit of patience but keeps your account safe.

**What you need first:**
- Your Instagram must be a **Business** or **Creator** account (free to switch
  in the Instagram app: *Settings → Account type and tools*).
- It must be **linked to a Facebook Page** (also free).

**Then:**
1. Go to **<https://developers.facebook.com>** and create a free developer
   account if you don't have one.
2. Create a new **App**, and add the **Instagram** product to it.
3. Ask for these permissions (the page lists them as checkboxes):
   `instagram_basic`, `instagram_manage_comments`,
   `instagram_manage_messages`, `pages_manage_metadata`,
   `pages_read_engagement`.
4. Generate a **long-lived access token** (a long password-like code).
5. Open your `.env.local` file (in the app folder) with any text editor —
   Notepad on Windows, TextEdit on Mac — and change these lines:
   ```
   DATA_SOURCE=graph
   IG_ACCESS_TOKEN=paste-your-long-token-here
   ```
6. Save the file, stop the app (`Ctrl + C`), and start it again (`npm run dev`).

The dashboard will now show your **real** reels and comments. Use "Preview (dry
run)" first to double-check, then "Run now" to send for real.

> ℹ️ Instagram only lets you DM a commenter **once, within 7 days** of their
> comment. So if you turn on Auto mode, run it at least every couple of days.
> Meta also requires an "App Review" before this works for the public, but you
> can test it on your own account right away.

---

## 🟠 Part 4 — The Chrome extension (optional backup)

If the official setup is too much, there's a browser extension that works while
you're logged into Instagram yourself. Full instructions are in the
[`extension/`](extension/) folder's README. In short: open
`chrome://extensions` in Chrome, turn on **Developer mode**, click **Load
unpacked**, and pick the `extension` folder. Then enter the app's web address
and the `EXTENSION_TOKEN` from your `.env.local` file.

> ⚠️ This method is more fragile and a little riskier for your account than the
> official way — use it gently and only on your own reels.

---

## 🛟 If something goes wrong

| Problem | Fix |
|---|---|
| `npm` is not recognized / command not found | Node.js isn't installed (or you need to close and reopen the Terminal). Redo Part 1, Step 1. |
| The browser page won't open | Make sure the Terminal still shows the app running and says `localhost:3000`. If you closed it, run `npm run dev` again. |
| "Port 3000 already in use" | The app is already running in another window, or run `npm run dev -- -p 3001` and open `localhost:3001`. |
| I want to start over | In Settings, turn on **Pause**. To wipe history, delete the files inside the `data/` folder. |

You can't accidentally spam anyone while in **Demo mode** or while **Pause** is
on, or by using **Preview (dry run)** — those never send real messages.

---

## 🙏 Please use this responsibly

This tool is meant for creators replying to people who commented on **their
own** posts. Only message people who engaged with your content, keep the volume
modest, respect anyone who asks you to stop, and follow Instagram's rules.
Mass or spammy DMing can get your account restricted no matter which method you
use.

---

<details>
<summary>🧑‍💻 Technical notes (for developers)</summary>

Built with Next.js (App Router). Architecture:

```
app/                 UI pages + API routes
  api/reels          list reels / classified comments
  api/run            manual DM pass
  api/cron           scheduled DM pass (secret-protected)
  api/extension/*    endpoints the Chrome extension calls
lib/                 provider abstraction (Graph API + mock), analysis,
                     dedup store, run engine
extension/           Manifest V3 Chrome extension (companion)
scripts/scheduler.mjs  optional self-host node-cron worker
data/                JSON store: config, ledger, run history (gitignored)
```

- `DATA_SOURCE=mock|graph` switches the provider.
- Scheduling: `vercel.json` cron hits `/api/cron`; or `npm run worker`; or any
  `curl -X POST "$APP_URL/api/cron?key=$CRON_SECRET"`.
- Safety: permanent dedup ledger, per-run cap, throttle, global pause,
  manual/auto mode. See `.env.example` for all settings.
- Build: `npm run build`. Dev: `npm run dev`. Deploy easily on Vercel.

</details>
