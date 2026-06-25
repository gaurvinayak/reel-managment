"use client";

import { useEffect, useState } from "react";
import type { AppConfig } from "@/lib/types";

export default function Settings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [source, setSource] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => {
        setConfig(j.config);
        setSource(j.dataSource);
      });
  }, []);

  function update<K extends keyof AppConfig>(key: K, value: AppConfig[K]) {
    if (!config) return;
    setConfig({ ...config, [key]: value });
    setSaved(false);
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    const r = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const j = await r.json();
    setConfig(j.config);
    setSaving(false);
    setSaved(true);
  }

  if (!config) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h1>Settings</h1>
      <p className="sub">
        Data source: <strong>{source}</strong>. Settings are stored on the
        server (the <code>data/</code> folder) and shared by the scheduler and
        the Chrome extension.
      </p>

      {config.mode === "auto" && !config.paused && (
        <div className="banner warn">
          ⚠️ Auto mode is ON. Scheduled runs will send real DMs (when in live /
          extension mode). Auto-DMing carries Instagram spam-detection risk —
          keep the per-run cap low and the throttle high.
        </div>
      )}

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Message</h2>
        <div className="field">
          <label>
            Predefined DM message — <code>{"{username}"}</code> is replaced with
            the commenter&apos;s handle.
          </label>
          <textarea
            value={config.message}
            onChange={(e) => update("message", e.target.value)}
          />
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Sending behaviour</h2>
        <div className="field">
          <label>Mode</label>
          <select
            value={config.mode}
            onChange={(e) =>
              update("mode", e.target.value as AppConfig["mode"])
            }
          >
            <option value="manual">
              Manual — only send when I click &quot;Run now&quot;
            </option>
            <option value="auto">
              Auto — scheduled runs may send automatically
            </option>
          </select>
        </div>

        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={config.paused}
              onChange={(e) => update("paused", e.target.checked)}
              style={{ width: "auto", marginRight: 8 }}
            />
            Pause all sending (global kill switch)
          </label>
        </div>

        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label>Max DMs per run</label>
            <input
              type="number"
              value={config.maxDmsPerRun}
              onChange={(e) =>
                update("maxDmsPerRun", Number(e.target.value))
              }
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Delay between DMs (seconds)</label>
            <input
              type="number"
              value={config.dmDelaySeconds}
              onChange={(e) =>
                update("dmDelaySeconds", Number(e.target.value))
              }
            />
          </div>
        </div>

        <div className="field">
          <label>
            Reels to watch in auto mode — comma-separated media IDs. Leave blank
            to watch only your most recent reel.
          </label>
          <input
            type="text"
            value={config.watchedReelIds.join(", ")}
            onChange={(e) =>
              update(
                "watchedReelIds",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
          />
        </div>

        <div className="field">
          <label>
            &quot;Asked them to DM&quot; phrases — if your reply contains any of
            these, the comment counts as handled (won&apos;t be DMed).
          </label>
          <input
            type="text"
            value={config.askedToDmPhrases.join(", ")}
            onChange={(e) =>
              update(
                "askedToDmPhrases",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
          />
        </div>
      </div>

      <div className="row">
        <button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="badge green">Saved</span>}
      </div>

      <div className="banner info" style={{ marginTop: 20 }}>
        <strong>Scheduling:</strong> point a cron at{" "}
        <code>/api/cron?key=$CRON_SECRET</code> (Vercel Cron, GitHub Actions, or
        the bundled <code>npm run worker</code>). It only sends when Mode = Auto
        and Pause is off. <strong>Chrome extension:</strong> set the backend URL
        and <code>EXTENSION_TOKEN</code> in the extension popup — see the
        README.
      </div>
    </div>
  );
}
