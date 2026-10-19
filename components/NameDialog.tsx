"use client";

import { useState, type FormEvent } from "react";
import { MAX_NAME_LENGTH, cleanName } from "@/lib/identity";

interface NameDialogProps {
  onSubmit: (name: string) => void;
}

export default function NameDialog({ onSubmit }: NameDialogProps) {
  const [value, setValue] = useState("");
  const name = cleanName(value);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (name) onSubmit(name);
  };

  return (
    <main className="flex h-screen items-center justify-center bg-neutral-950 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl"
      >
        <h1 className="text-xl font-semibold">Join the board</h1>
        <p className="mt-1 text-sm text-neutral-400">Others will see this name next to your cursor.</p>
        <input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Your name"
          aria-label="Your name"
          className="mt-5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2 outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!name}
          className="mt-4 w-full rounded-lg bg-indigo-500 px-4 py-2 font-medium transition hover:bg-indigo-400 disabled:opacity-40 disabled:hover:bg-indigo-500"
        >
          Join
        </button>
      </form>
    </main>
  );
}
