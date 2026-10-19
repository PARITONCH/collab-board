import { nanoid } from "nanoid";
import type { Identity } from "@/types/board";
import { PALETTE } from "./palette";

const SESSION_KEY = "collab-board:session";
const NAME_KEY = "collab-board:name";

export const MAX_NAME_LENGTH = 24;

type SessionIdentity = Pick<Identity, "id" | "color">;

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

function isSessionIdentity(value: unknown): value is SessionIdentity {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.color === "string";
}

export function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export function loadName(): string {
  try {
    return cleanName(window.localStorage.getItem(NAME_KEY) ?? "");
  } catch {
    return "";
  }
}

export function saveName(name: string): void {
  try {
    window.localStorage.setItem(NAME_KEY, name);
  } catch {}
}

export function getIdentity(name: string): Identity {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isSessionIdentity(parsed)) return { id: parsed.id, color: parsed.color, name };
    }
  } catch {}

  const session: SessionIdentity = { id: nanoid(8), color: pick(PALETTE.slice(1)) };

  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}

  return { ...session, name };
}
