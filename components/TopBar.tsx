"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Link2 } from "lucide-react";
import type { ConnectionStatus, Identity, Peer } from "@/types/board";

interface TopBarProps {
  identity: Identity;
  peers: Peer[];
  status: ConnectionStatus;
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
      {name.charAt(0)}
    </div>
  );
}

export default function TopBar({ identity, peers, status }: TopBarProps) {
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
