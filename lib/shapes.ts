import * as Y from "yjs";
import { nanoid } from "nanoid";
import type { Point, Shape, StickyShape, TextShape, Tool } from "@/types/board";

export const LOCAL_ORIGIN = "local-edit";

export type ShapeMap = Y.Map<Y.Map<unknown>>;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function sortShapes(list: Shape[]): Shape[] {
  return list.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export function isTextual(shape: Shape): shape is TextShape | StickyShape {
  return shape.type === "text" || shape.type === "sticky";
}

export interface BoardContext {
  doc: Y.Doc;
  shapes: ShapeMap;
  undo: Y.UndoManager;
}

export function addShape({ doc, shapes, undo }: BoardContext, shape: Shape): void {
  undo.stopCapturing();
  doc.transact(() => {
    const entry = new Y.Map<unknown>();
    for (const [key, value] of Object.entries(shape)) entry.set(key, value);
    shapes.set(shape.id, entry);
  }, LOCAL_ORIGIN);
}

export function patchShape(
  { doc, shapes }: BoardContext,
  id: string,
  patch: Record<string, unknown>
): void {
  const entry = shapes.get(id);
  if (!entry) return;
  doc.transact(() => {
    for (const [key, value] of Object.entries(patch)) {
      if (entry.get(key) !== value) entry.set(key, value);
    }
  }, LOCAL_ORIGIN);
}

export function removeShape({ doc, shapes, undo }: BoardContext, id: string): void {
  if (!shapes.has(id)) return;
  undo.stopCapturing();
  doc.transact(() => shapes.delete(id), LOCAL_ORIGIN);
}

export function normalizeBox(a: Point, b: Point): Box {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

export function startShape(
  tool: Exclude<Tool, "select">,
  point: Point,
  authorId: string,
  color: string
): Shape {
  const base = {
    id: nanoid(10),
    x: point.x,
    y: point.y,
    color,
    authorId,
    createdAt: Date.now(),
  };

  switch (tool) {
    case "rect":
      return { ...base, type: "rect", width: 0, height: 0 };
    case "ellipse":
      return { ...base, type: "ellipse", width: 0, height: 0 };
    case "pen":
      return { ...base, type: "pen", x: 0, y: 0, points: [point.x, point.y] };
    case "text":
      return { ...base, type: "text", text: "", fontSize: 24 };
    case "sticky":
      return {
        ...base,
        type: "sticky",
        x: point.x - 80,
        y: point.y - 80,
        width: 160,
        height: 160,
        text: "",
      };
  }
}

export function updateDraft(draft: Shape, origin: Point, point: Point): Shape {
  switch (draft.type) {
    case "rect":
    case "ellipse":
      return { ...draft, ...normalizeBox(origin, point) };
    case "pen":
      return { ...draft, points: [...draft.points, point.x, point.y] };
    default:
      return draft;
  }
}

export function isDraftMeaningful(draft: Shape): boolean {
  if (draft.type === "rect" || draft.type === "ellipse") {
    return draft.width > 3 && draft.height > 3;
  }
  if (draft.type === "pen") return draft.points.length >= 4;
  return true;
}

export function boundsOf(shape: Shape): Box {
  switch (shape.type) {
    case "rect":
    case "ellipse":
    case "sticky":
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    case "pen": {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < shape.points.length; i += 2) {
        minX = Math.min(minX, shape.points[i]);
        maxX = Math.max(maxX, shape.points[i]);
        minY = Math.min(minY, shape.points[i + 1]);
        maxY = Math.max(maxY, shape.points[i + 1]);
      }
      return {
        x: shape.x + minX,
        y: shape.y + minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }
    case "text": {
      const lines = shape.text.split("\n");
      const longest = Math.max(1, ...lines.map((line) => line.length));
      return {
        x: shape.x,
        y: shape.y,
        width: longest * shape.fontSize * 0.58,
        height: lines.length * shape.fontSize * 1.2,
      };
    }
  }
}
