"use client";

import { Minus, Plus } from "lucide-react";
import { INITIAL_VIEWPORT, zoomAt } from "@/lib/viewport";
import { useBoardStore } from "@/store/board";

const buttonClass =
  "flex h-8 w-8 items-center justify-center rounded-lg text-neutral-300 transition hover:bg-neutral-800";

export default function ZoomControls() {
  const view = useBoardStore((state) => state.view);
  const setView = useBoardStore((state) => state.setView);

  const zoom = (factor: number) =>
    setView(zoomAt(view, factor, { x: window.innerWidth / 2, y: window.innerHeight / 2 }));

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/90 p-1 backdrop-blur">
      <button type="button" aria-label="Zoom out" onClick={() => zoom(1 / 1.25)} className={buttonClass}>
        <Minus size={16} />
      </button>
      <button
        type="button"
        title="Reset zoom"
        onClick={() => setView({ ...view, scale: INITIAL_VIEWPORT.scale })}
        className="min-w-12 rounded-lg px-1 text-xs text-neutral-300 tabular-nums transition hover:bg-neutral-800"
      >
        {Math.round(view.scale * 100)}%
      </button>
      <button type="button" aria-label="Zoom in" onClick={() => zoom(1.25)} className={buttonClass}>
        <Plus size={16} />
      </button>
    </div>
  );
}
