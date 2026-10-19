import { nanoid } from "nanoid";
import type { Identity } from "@/types/board";
import { PALETTE } from "./palette";

const STORAGE_KEY = "collab-board:identity";
const ADJECTIVES = ["Swift", "Quiet", "Brave", "Lucky", "Clever", "Mellow", "Bright", "Nimble"];
const ANIMALS = ["Otter", "Falcon", "Panda", "Lynx", "Heron", "Koala", "Gecko", "Raven"];

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

function isIdentity(value: unknown): value is Identity {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.name === "string" && typeof v.color === "string";
}

export function getIdentity(): Identity {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isIdentity(parsed)) return parsed;
    }
  } catch {}

  const identity: Identity = {
    id: nanoid(8),
    name: `${pick(ADJECTIVES)} ${pick(ANIMALS)}`,
    color: pick(PALETTE.slice(1)),
  };

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {}

  return identity;
}
