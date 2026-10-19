"use client";

import {
  Circle,
  MousePointer2,
  Pencil,
  Redo2,
  Square,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import type { Tool } from "@/types/board";
import { PALETTE } from "@/lib/palette";
import { removeShape } from "@/lib/shapes";
import type { CollabSession } from "@/hooks/useCollab";
import { useUndoState } from "@/hooks/useUndoState";
import { useBoardStore } from "@/store/board";

interface ToolbarProps {
  session: CollabSession;
}

const TOOLS: { tool: Tool; label: string; key: string; icon: LucideIcon }[] = [
  { tool: "select", label: "Select", key: "V", icon: MousePointer2 },
  { tool: "rect", label: "Rectangle", key: "R", icon: Square },
  { tool: "ellipse", label: "Ellipse", key: "O", icon: Circle },
  { tool: "pen", label: "Pen", key: "P", icon: Pencil },
  { tool: "text", label: "Text", key: "T", icon: Type },
  { tool: "sticky", label: "Sticky note", key: "S", icon: StickyNote },
];

const buttonClass =
  "flex h-9 w-9 items-center justify-center rounded-lg text-neutral-300 transition hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-30";

function Divider() {
  return <div className="my-1 h-px bg-neutral-800" />;
}

export default function Toolbar({ session }: ToolbarProps) {
  const tool = useBoardStore((state) => state.tool);
  const color = useBoardStore((state) => state.color);
  const selectedId = useBoardStore((state) => state.selectedId);
  const setTool = useBoardStore((state) => state.setTool);
  const setColor = useBoardStore((state) => state.setColor);
  const select = useBoardStore((state) => state.select);
  const { canUndo, canRedo } = useUndoState(session.undo);

  const deleteSelected = () => {
    if (!selectedId) return;
    removeShape(session, selectedId);
    select(null);
  };

  return (
    <div className="absolute top-1/2 left-4 flex -translate-y-1/2 flex-col gap-1 rounded-xl border border-neutral-800 bg-neutral-900/90 p-1.5 shadow-xl backdrop-blur">
      {TOOLS.map(({ tool: value, label, key, icon: Icon }) => (
        <button
          key={value}
          type="button"
          title={`${label} (${key})`}
          aria-label={label}
          aria-pressed={tool === value}
          onClick={() => setTool(value)}
          className={`${buttonClass} ${tool === value ? "bg-indigo-500 text-white hover:bg-indigo-500" : ""}`}
        >
          <Icon size={18} />
        </button>
      ))}
      <Divider />
      <div className="grid grid-cols-2 gap-1.5 p-1">
        {PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`Color ${swatch}`}
            aria-pressed={color === swatch}
            onClick={() => setColor(swatch)}
            className={`h-5 w-5 rounded-full border transition ${
              color === swatch ? "scale-110 border-white" : "border-neutral-700"
            }`}
            style={{ background: swatch }}
          />
        ))}
      </div>
      <Divider />
      <button
        type="button"
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        disabled={!canUndo}
        onClick={() => session.undo.undo()}
        className={buttonClass}
      >
        <Undo2 size={18} />
      </button>
      <button
        type="button"
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
        disabled={!canRedo}
        onClick={() => session.undo.redo()}
        className={buttonClass}
      >
        <Redo2 size={18} />
      </button>
      <button
        type="button"
        title="Delete (Del)"
        aria-label="Delete"
        disabled={!selectedId}
        onClick={deleteSelected}
        className={buttonClass}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
