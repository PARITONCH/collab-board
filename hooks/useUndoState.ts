"use client";

import { useEffect, useState } from "react";
import type * as Y from "yjs";

interface UndoState {
  canUndo: boolean;
  canRedo: boolean;
}

export function useUndoState(undo: Y.UndoManager | null): UndoState {
  const [state, setState] = useState<UndoState>({ canUndo: false, canRedo: false });

  useEffect(() => {
    if (!undo) return;

    const refresh = () =>
      setState({ canUndo: undo.undoStack.length > 0, canRedo: undo.redoStack.length > 0 });

    undo.on("stack-item-added", refresh);
    undo.on("stack-item-popped", refresh);
    undo.on("stack-cleared", refresh);
    refresh();

    return () => {
      undo.off("stack-item-added", refresh);
      undo.off("stack-item-popped", refresh);
      undo.off("stack-cleared", refresh);
    };
  }, [undo]);

  return state;
}
