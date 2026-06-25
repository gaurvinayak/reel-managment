// Content script: runs on instagram.com. Does the in-page DOM work — scraping
// comments and sending DMs via the user's own logged-in session.
//
// ⚠️ Instagram's web DOM is obfuscated and changes often. All selectors and
// the scraping/sending heuristics live in this one file so they're easy to
// update when Instagram changes its markup. The supported, stable path is the
// Instagram Graph API (see the app's README); this extension is a best-effort
// fallback for when you don't have API access.

(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Try to read the logged-in user's handle so we can skip our own comments.
  function getSelfUsername() {
    // Instagram exposes the viewer in a few places; try the most stable first.
    try {
      const fromSettings = window?._sharedData?.config?.viewer?.username;
      if (fromSettings) return fromSettings;
    } catch (_) {}
    const profileLink = document.querySelector(
      'a[href^="/"][role="link"] img[alt$="profile picture"]'
    );
    if (profileLink) {
      const alt = profileLink.getAttribute("alt") || "";
      const m = alt.match(/^(.*?)'s profile picture$/);
      if (m) return m[1];
    }
    return null;
  }

  function reelIdFromUrl() {
    const m = location.pathname.match(/\/(reel|p)\/([^/]+)/);
    return m ? `web:${m[2]}` : "web";
  }

  // Scrape visible comments. Returns [{ id, username, text, fromSelf, replies }].
  function scrapeComments() {
    const self = getSelfUsername();
    const seen = new Map();

    // Comment rows usually contain a username link followed by the comment text.
    // We look for username anchors inside the comments region and read the
    // associated text from the same list item / container.
    const anchors = Array.from(
      document.querySelectorAll('a[href^="/"][role="link"]')
    ).filter((a) => {
      const href = a.getAttribute("href") || "";
      // username links look like "/username/" (single path segment)
      return /^\/[^/]+\/$/.test(href) && a.textContent.trim().length > 0;
    });

    for (const a of anchors) {
      const username = a.textContent.trim();
      if (!username) continue;
      // The comment text is typically the nearest sibling/ancestor block that
      // contains a span of text after the username.
      const container =
        a.closest("li") ||
        a.closest('div[role="button"]') ||
        a.parentElement?.parentElement;
      if (!container) continue;
      const fullText = (container.innerText || "").trim();
      // Strip the leading username and common UI words.
      let text = fullText.replace(username, "").trim();
      text = text
        .split("\n")
        .filter(
          (l) =>
            l &&
            !/^(Reply|Like|View replies|\d+[hwdm]|See translation)$/i.test(
              l.trim()
            )
        )
        .join(" ")
        .trim();
      if (!text) continue;

      const key = `${username}::${text}`;
      if (seen.has(key)) continue;
      seen.set(key, {
        // Dedup per-username so we never DM the same person twice from the web.
        id: `web:${username}`,
        username,
        text,
        fromSelf: self ? username === self : false,
        replies: [],
      });
    }

    return Array.from(seen.values());
  }

  // Best-effort DM send: open the user's profile, click "Message", type and send.
  // Returns { ok } or { ok:false, error }.
  async function sendDm(username, message) {
    try {
      // Open the DM composer for this user in the same tab via the message UI.
      // We navigate to the profile, then look for the Message button.
      // (Kept simple + documented; adjust selectors if Instagram changes them.)
      const composerReady = await openDirectComposer(username);
      if (!composerReady) {
        return {
          ok: false,
          error:
            "Could not open DM composer (selector drift?). Update content.js.",
        };
      }

      const box = document.querySelector(
        'div[role="textbox"][contenteditable="true"], textarea[placeholder*="Message"]'
      );
      if (!box) return { ok: false, error: "Message box not found." };

      box.focus();
      document.execCommand("insertText", false, message);
      box.dispatchEvent(new InputEvent("input", { bubbles: true }));
      await sleep(400);

      // Press Enter to send.
      box.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
        })
      );
      await sleep(600);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async function openDirectComposer(username) {
    // Navigate to the direct message thread for this user.
    // Instagram supports /direct/new/ ; full automation of recipient selection
    // is fragile, so we open the profile and click "Message".
    try {
      window.location.assign(`https://www.instagram.com/${username}/`);
    } catch (_) {}
    // Wait for profile to load and the Message button to appear.
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      const btn = Array.from(document.querySelectorAll("div,button,a")).find(
        (el) => el.textContent.trim() === "Message"
      );
      if (btn) {
        btn.click();
        await sleep(1500);
        return true;
      }
    }
    return false;
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "SCRAPE") {
      try {
        sendResponse({
          reelId: reelIdFromUrl(),
          comments: scrapeComments(),
        });
      } catch (e) {
        sendResponse({ error: e.message });
      }
      return true;
    }
    if (msg.type === "SEND_DM") {
      sendDm(msg.username, msg.message).then(sendResponse);
      return true;
    }
  });
})();
