"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { nanoid } from "nanoid";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const create = () => router.push(`/room/${nanoid(10)}`);

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const id = code.trim().split("/").pop();
    if (id) router.push(`/room/${id}`);
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-neutral-950 px-6 text-neutral-100">
      <div className="text-center">
        <h1 className="text-5xl font-semibold tracking-tight">Collab Board</h1>
        <p className="mt-3 text-neutral-400">
          A real-time whiteboard. Share a link, draw together.
        </p>
      </div>
      <button
        onClick={create}
        className="rounded-lg bg-indigo-500 px-6 py-3 font-medium transition hover:bg-indigo-400"
      >
        Create a board
      </button>
      <form onSubmit={join} className="flex w-full max-w-sm gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste a room link or code"
          className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="rounded-lg border border-neutral-700 px-4 py-2 transition hover:bg-neutral-900"
        >
          Join
        </button>
      </form>
    </main>
  );
}
