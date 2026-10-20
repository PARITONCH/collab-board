"use client";

import { memo, useRef } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import { Ellipse, Group, Line, Rect, Text } from "react-konva";
import { boundsOf } from "@/lib/shapes";
import type { Point, Shape, StickyShape, TextShape } from "@/types/board";

interface ShapeViewProps {
  shape: Shape;
  interactive: boolean;
  onSelect?: (id: string) => void;
  onMove?: (id: string, position: Point) => void;
  onEdit?: (shape: TextShape | StickyShape) => void;
}

interface DragOrigin {
  shape: Point;
  center: Point;
}

function Body({ shape, dx, dy }: { shape: Shape; dx: number; dy: number }) {
  switch (shape.type) {
    case "rect":
      return (
        <Rect
          x={shape.x - dx}
          y={shape.y - dy}
          width={shape.width}
          height={shape.height}
          stroke={shape.color}
          strokeWidth={2}
          fill={`${shape.color}22`}
          cornerRadius={4}
        />
      );
    case "ellipse":
      return (
        <Ellipse
          x={shape.x + shape.width / 2 - dx}
          y={shape.y + shape.height / 2 - dy}
          radiusX={shape.width / 2}
          radiusY={shape.height / 2}
          stroke={shape.color}
          strokeWidth={2}
          fill={`${shape.color}22`}
        />
      );
    case "pen":
      return (
        <Line
          x={shape.x - dx}
          y={shape.y - dy}
          points={shape.points}
          stroke={shape.color}
          strokeWidth={3}
          tension={0.4}
          lineCap="round"
          lineJoin="round"
          hitStrokeWidth={16}
        />
      );
    case "text":
      return (
        <Text
          x={shape.x - dx}
          y={shape.y - dy}
          text={shape.text}
          fontSize={shape.fontSize}
          lineHeight={1.2}
          fill={shape.color}
        />
      );
    case "sticky":
      return (
        <Group x={shape.x - dx} y={shape.y - dy}>
          <Rect
            width={shape.width}
            height={shape.height}
            fill={shape.color}
            cornerRadius={4}
            shadowColor="#000000"
            shadowBlur={12}
            shadowOpacity={0.35}
            shadowOffsetY={4}
          />
          <Text
            x={12}
            y={12}
            width={shape.width - 24}
            height={shape.height - 24}
            text={shape.text}
            fontSize={18}
            lineHeight={1.25}
            fill="#1a1a1a"
          />
        </Group>
      );
  }
}

function ShapeViewBase({ shape, interactive, onSelect, onMove, onEdit }: ShapeViewProps) {
  const origin = useRef<DragOrigin | null>(null);
  const box = boundsOf(shape);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const textual = shape.type === "text" || shape.type === "sticky";

  const reportMove = (event: KonvaEventObject<DragEvent>) => {
    const start = origin.current ?? { shape: { x: shape.x, y: shape.y }, center: { x: cx, y: cy } };
    onMove?.(shape.id, {
      x: start.shape.x + event.target.x() - start.center.x,
      y: start.shape.y + event.target.y() - start.center.y,
    });
  };

  return (
    <Group
      x={cx}
      y={cy}
      rotation={shape.rotation ?? 0}
      listening={interactive}
      draggable={interactive}
      onPointerDown={(event: KonvaEventObject<PointerEvent>) => {
        if (event.evt.button !== 0) return;
        event.cancelBubble = true;
        onSelect?.(shape.id);
      }}
      onDragStart={() => {
        origin.current = { shape: { x: shape.x, y: shape.y }, center: { x: cx, y: cy } };
      }}
      onDragMove={reportMove}
      onDragEnd={(event) => {
        reportMove(event);
        origin.current = null;
      }}
      onDblClick={() => textual && onEdit?.(shape as TextShape | StickyShape)}
      onDblTap={() => textual && onEdit?.(shape as TextShape | StickyShape)}
    >
      <Body shape={shape} dx={cx} dy={cy} />
    </Group>
  );
}

export default memo(ShapeViewBase);
