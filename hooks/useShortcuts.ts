"use client";

import { useEffect } from "react";
import type { Tool } from "@/types/board";
import { removeShape } from "@/lib/shapes";
import { useBoardStore } from "@/store/board";
import type { CollabSession } from "./useCollab";

const TOOL_KEYS: Record<string, Tool> = {
  v: "select",
  r: "rect",
  o: "ellipse",
  p: "pen",
  t: "text",
  s: "sticky",
};

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable)
  );
}

export function useShortcuts(session: CollabSession | null): void {
  useEffect(() => {
    if (!session) return;
    const { undo } = session;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const store = useBoardStore.getState();
      const key = event.key.toLowerCase();
      const mod = event.ctrlKey || event.metaKey;

      if (mod && key === "z") {
        event.preventDefault();
        if (event.shiftKey) undo.redo();
        else undo.undo();
        return;
      }
      if (mod && key === "y") {
        event.preventDefault();
        undo.redo();
        return;
      }
      if (mod || event.altKey) return;

      if (key === "delete" || key === "backspace") {
        if (store.selectedId) {
          removeShape(session, store.selectedId);
          store.select(null);
        }
        return;
      }
      if (key === "escape") {
        store.setTool("select");
        return;
      }
      const tool = TOOL_KEYS[key];
      if (tool) store.setTool(tool);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [session]);
}
