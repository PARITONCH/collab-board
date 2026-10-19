"use client";

import dynamic from "next/dynamic";

const Board = dynamic(() => import("./Board"), {
  ssr: false,
  loading: () => (
    <main className="flex h-screen items-center justify-center text-neutral-500">Loading board…</main>
  ),
});

export default function BoardLoader({ roomId }: { roomId: string }) {
  return <Board key={roomId} roomId={roomId} />;
}
