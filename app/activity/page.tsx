"use client";

import { useEffect, useState } from "react";
import type { LedgerEntry, RunResult } from "@/lib/types";

export default function Activity() {
  const [runs, setRuns] = useState<RunResult[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((j) => {
        setRuns(j.runs);
        setLedger(j.ledger);
        setTotal(j.totalDmed);
      });
  }, []);

  return (
    <div>
      <h1>Activity</h1>
      <p className="sub">
        <strong>{total}</strong> DM(s) sent all-time. Every successful send is
        recorded here and in the dedup ledger, so no one is ever messaged twice.
      </p>

      <h2>Recent runs</h2>
      <div className="panel">
        {runs.length === 0 ? (
          <p className="muted">No runs yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Source</th>
                <th>Candidates</th>
                <th>Sent</th>
                <th>Errors</th>
                <th>Paused</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, i) => (
                <tr key={i}>
                  <td>{r.startedAt.replace("T", " ").slice(0, 19)}</td>
                  <td>{r.source}</td>
                  <td>{r.candidates}</td>
                  <td>{r.sent}</td>
                  <td>{r.errors}</td>
                  <td>{r.paused ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2>DM ledger</h2>
      <div className="panel">
        {ledger.length === 0 ? (
          <p className="muted">No DMs recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Via</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((e, i) => (
                <tr key={i}>
                  <td>{e.sentAt.replace("T", " ").slice(0, 19)}</td>
                  <td>@{e.username}</td>
                  <td>{e.via}</td>
                  <td>
                    {e.ok ? (
                      <span className="badge green">sent</span>
                    ) : (
                      <span className="badge red" title={e.error}>
                        failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
