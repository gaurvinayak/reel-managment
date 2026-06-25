"use client";

import { useEffect, useState } from "react";
import type { AnalyzedComment, Reel, RunResult } from "@/lib/types";

const statusBadge: Record<string, { label: string; cls: string }> = {
  unanswered: { label: "Will DM", cls: "yellow" },
  replied: { label: "Replied", cls: "green" },
  own: { label: "You", cls: "" },
  already_dmed: { label: "DMed", cls: "green" },
};

export default function Dashboard() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [self, setSelf] = useState<{ username: string } | null>(null);
  const [source, setSource] = useState<string>("");
  const [selected, setSelected] = useState<Reel | null>(null);
  const [comments, setComments] = useState<AnalyzedComment[]>([]);
  const [eligible, setEligible] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<RunResult | null>(null);

  async function loadReels() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/reels");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setReels(j.reels);
      setSelf(j.self);
      setSource(j.dataSource);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function openReel(reel: Reel) {
    setSelected(reel);
    setComments([]);
    const r = await fetch(`/api/reels/${reel.id}/comments`);
    const j = await r.json();
    if (r.ok) {
      setComments(j.comments);
      setEligible(j.eligible);
    } else {
      setErr(j.error);
    }
  }

  async function runNow(dryRun: boolean) {
    setRunning(true);
    setLastRun(null);
    try {
      const r = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Run failed");
      setLastRun(j);
      if (selected) openReel(selected);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    loadReels();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="sub">
        {self ? `Connected as @${self.username}` : "Not connected"} ·{" "}
        {source === "mock" ? "Mock demo data" : "Live Instagram Graph API"}
      </p>

      {source === "mock" && (
        <div className="banner info">
          <strong>Mock mode.</strong> You&apos;re seeing demo data and no real
          DMs are sent — runs are recorded as dry runs. Set{" "}
          <code>DATA_SOURCE=graph</code> with a token, or use the Chrome
          extension, to go live. See the README.
        </div>
      )}

      {err && <div className="banner warn">⚠️ {err}</div>}

      <div className="panel">
        <div className="row">
          <strong>Run a DM pass</strong>
          <span className="spacer" />
          <button
            className="secondary"
            disabled={running}
            onClick={() => runNow(true)}
          >
            {running ? "Working…" : "Preview (dry run)"}
          </button>
          <button disabled={running} onClick={() => runNow(false)}>
            {running ? "Working…" : "Run now"}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          A pass scans your watched reel(s), finds commenters you haven&apos;t
          replied to or asked to DM, and sends your predefined message — skipping
          anyone already DMed. Configure the message and schedule in Settings.
        </p>
        {lastRun && (
          <div className="banner info" style={{ marginTop: 8 }}>
            Last run via <strong>{lastRun.source}</strong>: {lastRun.candidates}{" "}
            candidate(s), <strong>{lastRun.sent}</strong> sent,{" "}
            {lastRun.errors} error(s), {lastRun.skipped} skipped
            {lastRun.paused ? " — paused/dry (nothing actually sent)" : ""}.
          </div>
        )}
      </div>

      <h2>Your reels</h2>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="grid">
          {reels.map((reel) => (
            <div
              key={reel.id}
              className="reel"
              onClick={() => openReel(reel)}
            >
              <span className="badge">{reel.commentsCount} comments</span>
              <div className="cap">{reel.caption || "(no caption)"}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {reel.timestamp?.slice(0, 10)}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <>
          <h2>
            Comments · {selected.caption?.slice(0, 50) || selected.id}{" "}
            <span className="badge yellow">{eligible} will be DMed</span>
          </h2>
          <div className="panel">
            {comments.length === 0 && (
              <p className="muted">Loading comments…</p>
            )}
            {comments.map((c) => {
              const b = statusBadge[c.status];
              return (
                <div className="comment" key={c.id}>
                  <div className="row">
                    <span className="u">@{c.username}</span>
                    <span className={`badge ${b.cls}`}>{b.label}</span>
                    <span className="spacer" />
                    <span className="muted" style={{ fontSize: 12 }}>
                      {c.reason}
                    </span>
                  </div>
                  <div className="t">{c.text}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
