"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Link2, Pencil } from "lucide-react";
import type { ConnectionStatus, Identity, Peer } from "@/types/board";
import { MAX_NAME_LENGTH, cleanName } from "@/lib/identity";

interface TopBarProps {
  identity: Identity;
  peers: Peer[];
  status: ConnectionStatus;
  onRename: (name: string) => void;
}

const STATUS_STYLE: Record<ConnectionStatus, { dot: string; label: string }> = {
  connected: { dot: "bg-emerald-400", label: "Live" },
  connecting: { dot: "bg-amber-400", label: "Connecting" },
  disconnected: { dot: "bg-red-400", label: "Offline" },
};

function Avatar({ name, color, ring }: { name: string; color: string; ring?: boolean }) {
  return (
    <div
      title={name}
      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-neutral-900 ${
        ring ? "ring-2 ring-white" : "ring-2 ring-neutral-900"
      }`}
      style={{ background: color }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function NameEditor({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const start = () => {
    setDraft(name);
    setEditing(true);
  };

  const commit = (event?: FormEvent) => {
    event?.preventDefault();
    const next = cleanName(draft);
    if (next && next !== name) onRename(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <form onSubmit={commit}>
        <input
          autoFocus
          value={draft}
          maxLength={MAX_NAME_LENGTH}
          aria-label="Your name"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit()}
          onKeyDown={(event) => event.key === "Escape" && setEditing(false)}
          className="w-28 rounded-md border border-indigo-500 bg-neutral-950 px-2 py-1 text-sm outline-none"
        />
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      title="Change your name"
      className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-neutral-200 transition hover:bg-neutral-800"
    >
      <span className="max-w-24 truncate">{name}</span>
      <Pencil size={12} className="text-neutral-500" />
    </button>
  );
}

export default function TopBar({ identity, peers, status, onRename }: TopBarProps) {
  const [copied, setCopied] = useState(false);
  const { dot, label } = STATUS_STYLE[status];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <>
      <Link
        href="/"
        className="absolute top-4 left-4 rounded-xl border border-neutral-800 bg-neutral-900/90 px-3 py-2 text-sm font-semibold backdrop-blur transition hover:bg-neutral-800"
      >
        Collab Board
      </Link>
      <div className="absolute top-4 right-4 flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/90 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          {label}
        </div>
        <div className="flex -space-x-2">
          <Avatar name={`${identity.name} (you)`} color={identity.color} ring />
          {peers.map((peer) => (
            <Avatar key={peer.clientId} name={peer.name} color={peer.color} />
          ))}
        </div>
        <NameEditor name={identity.name} onRename={onRename} />
        <button
          type="button"
          onClick={copyLink}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium transition hover:bg-indigo-400"
        >
          {copied ? <Check size={14} /> : <Link2 size={14} />}
          {copied ? "Copied" : "Share"}
        </button>
      </div>
    </>
  );
}
