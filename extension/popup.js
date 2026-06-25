const $ = (id) => document.getElementById(id);
const log = (msg) => {
  $("log").textContent += (msg + "\n");
  $("log").scrollTop = $("log").scrollHeight;
};

async function load() {
  const { backend, token } = await chrome.storage.local.get([
    "backend",
    "token",
  ]);
  if (backend) $("backend").value = backend;
  if (token) $("token").value = token;
}
load();

$("save").addEventListener("click", async () => {
  await chrome.storage.local.set({
    backend: $("backend").value.trim().replace(/\/$/, ""),
    token: $("token").value.trim(),
  });
  log("Connection saved.");
});

$("run").addEventListener("click", async () => {
  $("log").textContent = "";
  const backend = $("backend").value.trim().replace(/\/$/, "");
  const token = $("token").value.trim();
  if (!backend || !token) {
    log("Set backend URL and token first.");
    return;
  }
  await chrome.storage.local.set({ backend, token });

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!tab.url || !tab.url.includes("instagram.com")) {
    log("Open the reel on instagram.com first, then click Run.");
    return;
  }

  log("Scanning comments on this page…");
  // The content script does the page work; the background worker does the
  // authenticated backend calls. Kick it off via the background worker.
  chrome.runtime.sendMessage(
    { type: "RUN_PASS", tabId: tab.id, backend, token },
    (resp) => {
      if (chrome.runtime.lastError) {
        log("Error: " + chrome.runtime.lastError.message);
        return;
      }
      if (!resp) {
        log("No response from worker.");
        return;
      }
      if (resp.error) {
        log("Error: " + resp.error);
        return;
      }
      (resp.lines || []).forEach(log);
      log(
        `Done. ${resp.sent} sent, ${resp.failed} failed, ${resp.eligible} eligible.`
      );
    }
  );
});
