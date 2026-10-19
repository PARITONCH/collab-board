import { create } from "zustand";
import type { Tool, Viewport } from "@/types/board";
import { DEFAULT_COLOR } from "@/lib/palette";
import { INITIAL_VIEWPORT } from "@/lib/viewport";

interface BoardState {
  tool: Tool;
  color: string;
  selectedId: string | null;
  view: Viewport;
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  select: (id: string | null) => void;
  setView: (view: Viewport) => void;
}

export const useBoardStore = create<BoardState>()((set) => ({
  tool: "select",
  color: DEFAULT_COLOR,
  selectedId: null,
  view: INITIAL_VIEWPORT,
  setTool: (tool) => set({ tool, selectedId: null }),
  setColor: (color) => set({ color }),
  select: (selectedId) => set({ selectedId }),
  setView: (view) => set({ view }),
}));
