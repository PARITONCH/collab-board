import { Pool } from "pg";
import * as Y from "yjs";

const connectionString = process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString }) : null;
const timers = new Map<string, NodeJS.Timeout>();
const SAVE_DELAY_MS = 1500;

export async function initPersistence(): Promise<void> {
  if (!pool) return;
  await pool.query(
    `CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      snapshot BYTEA NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );
}

export async function loadSnapshot(id: string, doc: Y.Doc): Promise<void> {
  if (!pool) return;
  const { rows } = await pool.query<{ snapshot: Buffer }>(
    "SELECT snapshot FROM boards WHERE id = $1",
    [id]
  );
  if (rows[0]) Y.applyUpdate(doc, new Uint8Array(rows[0].snapshot));
}

async function save(id: string, doc: Y.Doc): Promise<void> {
  if (!pool) return;
  const snapshot = Buffer.from(Y.encodeStateAsUpdate(doc));
  await pool.query(
    `INSERT INTO boards (id, snapshot, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (id) DO UPDATE SET snapshot = EXCLUDED.snapshot, updated_at = now()`,
    [id, snapshot]
  );
}

export function scheduleSave(id: string, doc: Y.Doc): void {
  if (!pool) return;
  const existing = timers.get(id);
  if (existing) clearTimeout(existing);
  timers.set(
    id,
    setTimeout(() => {
      timers.delete(id);
      save(id, doc).catch((err) => console.error("save failed", id, err));
    }, SAVE_DELAY_MS)
  );
}

export async function flushSave(id: string, doc: Y.Doc): Promise<void> {
  const existing = timers.get(id);
  if (existing) {
    clearTimeout(existing);
    timers.delete(id);
  }
  await save(id, doc);
}
