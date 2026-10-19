export type Tool = "select" | "rect" | "ellipse" | "pen" | "text" | "sticky";

interface BaseShape {
  id: string;
  x: number;
  y: number;
  color: string;
  authorId: string;
  createdAt: number;
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

export interface Identity {
  id: string;
  name: string;
  color: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface Peer extends Identity {
  clientId: number;
  cursor: Point | null;
  draft: Shape | null;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected";
