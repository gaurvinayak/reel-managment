// Background service worker: orchestrates a run.
// It talks to the backend (the "brain": analysis + dedup ledger + config) and
// asks the content script to do the in-page work (scrape + send) using the
// user's own logged-in Instagram session.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function send(tabId, payload) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, payload, (resp) => {
      if (chrome.runtime.lastError) {
        resolve({ error: chrome.runtime.lastError.message });
      } else {
        resolve(resp || {});
      }
    });
  });
}

async function api(backend, token, path, body) {
  const res = await fetch(`${backend}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "x-extension-token": token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `${path} -> HTTP ${res.status}`);
  }
  return json;
}

async function runPass({ tabId, backend, token }) {
  const lines = [];
  const log = (m) => lines.push(m);

  // 1. Scrape comments from the page.
  const scrape = await send(tabId, { type: "SCRAPE" });
  if (scrape.error) throw new Error("Scrape failed: " + scrape.error);
  const comments = scrape.comments || [];
  const reelId = scrape.reelId || "web";
  log(`Found ${comments.length} comment(s) on this reel.`);
  if (comments.length === 0) {
    return { lines, sent: 0, failed: 0, eligible: 0 };
  }

  // 2. Ask the backend who is eligible (applies analysis + permanent dedup).
  const analysis = await api(backend, token, "/api/extension/analyze", {
    reelId,
    comments,
  });
  if (analysis.paused) {
    log("Sending is paused in the backend (kill switch). Nothing sent.");
    return { lines, sent: 0, failed: 0, eligible: 0 };
  }
  const eligible = analysis.eligible || [];
  const delay = (analysis.dmDelaySeconds || 8) * 1000;
  log(`${eligible.length} commenter(s) eligible for a DM.`);

  // 3. Send each DM through the page, throttled.
  const entries = [];
  let sent = 0;
  let failed = 0;
  for (const e of eligible) {
    const result = await send(tabId, {
      type: "SEND_DM",
      username: e.username,
      message: e.message,
    });
    const ok = !!result.ok;
    if (ok) {
      sent++;
      log(`✓ DMed @${e.username}`);
    } else {
      failed++;
      log(`✗ @${e.username}: ${result.error || "failed"}`);
    }
    entries.push({
      commentId: e.commentId,
      username: e.username,
      message: e.message,
      ok,
      error: result.error,
    });
    await sleep(delay);
  }

  // 4. Report back so the ledger records sends and dedups future runs.
  await api(backend, token, "/api/extension/report", { reelId, entries });
  log("Reported results to backend ledger.");

  return { lines, sent, failed, eligible: eligible.length };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "RUN_PASS") {
    runPass(msg)
      .then((r) => sendResponse(r))
      .catch((e) => sendResponse({ error: e.message }));
    return true; // async response
  }
});
