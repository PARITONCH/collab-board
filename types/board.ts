export type Tool = "select" | "rect" | "ellipse" | "pen" | "text" | "sticky";

interface BaseShape {
  id: string;
  x: number;
  y: number;
  color: string;
  authorId: string;
}

export interface RectShape extends BaseShape {
  type: "rect";
  width: number;
  height: number;
}

export interface EllipseShape extends BaseShape {
  type: "ellipse";
  width: number;
  height: number;
}

export interface PenShape extends BaseShape {
  type: "pen";
  points: number[];
}

export interface TextShape extends BaseShape {
  type: "text";
  text: string;
  fontSize: number;
}

export interface StickyShape extends BaseShape {
  type: "sticky";
  text: string;
  width: number;
  height: number;
}

export type Shape = RectShape | EllipseShape | PenShape | TextShape | StickyShape;

export interface Presence {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
}
