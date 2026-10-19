import type { Point, Viewport } from "@/types/board";

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 4;

export const INITIAL_VIEWPORT: Viewport = { x: 0, y: 0, scale: 1 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function zoomAt(view: Viewport, factor: number, center: Point): Viewport {
  const scale = clamp(view.scale * factor, MIN_SCALE, MAX_SCALE);
  const world = { x: (center.x - view.x) / view.scale, y: (center.y - view.y) / view.scale };
  return { scale, x: center.x - world.x * scale, y: center.y - world.y * scale };
}

export function worldToScreen(view: Viewport, point: Point): Point {
  return { x: point.x * view.scale + view.x, y: point.y * view.scale + view.y };
}
