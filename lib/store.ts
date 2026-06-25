import { promises as fs } from "fs";
import path from "path";
import type { AppConfig, LedgerEntry, RunResult } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "config.json");
const LEDGER_PATH = path.join(DATA_DIR, "ledger.json");
const RUNS_PATH = path.join(DATA_DIR, "runs.json");

export function defaultConfig(): AppConfig {
  return {
    message:
      process.env.DEFAULT_DM_MESSAGE ||
      "Hey {username}! Thanks so much for commenting 🙏 Check your DMs for the link!",
    paused: false,
    mode: "manual",
    maxDmsPerRun: Number(process.env.MAX_DMS_PER_RUN || 20),
    dmDelaySeconds: Number(process.env.DM_DELAY_SECONDS || 8),
    watchedReelIds: [],
    askedToDmPhrases: ["dm me", "check your dm", "dms", "sent you", "check dm", "inbox"],
  };
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function getConfig(): Promise<AppConfig> {
  const stored = await readJson<Partial<AppConfig> | null>(CONFIG_PATH, null);
  return { ...defaultConfig(), ...(stored || {}) };
}

export async function saveConfig(patch: Partial<AppConfig>): Promise<AppConfig> {
  const current = await getConfig();
  const next = { ...current, ...patch };
  await writeJson(CONFIG_PATH, next);
  return next;
}

export async function getLedger(): Promise<LedgerEntry[]> {
  return readJson<LedgerEntry[]>(LEDGER_PATH, []);
}

/** Returns the set of comment ids we have already successfully DMed. */
export async function getDmedCommentIds(): Promise<Set<string>> {
  const ledger = await getLedger();
  return new Set(ledger.filter((e) => e.ok).map((e) => e.commentId));
}

export async function appendLedger(entries: LedgerEntry[]): Promise<void> {
  if (!entries.length) return;
  const ledger = await getLedger();
  ledger.push(...entries);
  await writeJson(LEDGER_PATH, ledger);
}

export async function getRuns(): Promise<RunResult[]> {
  return readJson<RunResult[]>(RUNS_PATH, []);
}

export async function appendRun(run: RunResult): Promise<void> {
  const runs = await getRuns();
  runs.unshift(run);
  // keep last 50
  await writeJson(RUNS_PATH, runs.slice(0, 50));
}
