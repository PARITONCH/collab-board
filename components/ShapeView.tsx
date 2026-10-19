"use client";

import { memo } from "react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Ellipse, Group, Line, Rect, Text } from "react-konva";
import type { Point, Shape, StickyShape, TextShape } from "@/types/board";

interface ShapeViewProps {
  shape: Shape;
  interactive: boolean;
  onSelect?: (id: string) => void;
  onMove?: (id: string, position: Point) => void;
  onEdit?: (shape: TextShape | StickyShape) => void;
}

function positionOf(shape: Shape, node: Konva.Node): Point {
  if (shape.type === "ellipse") {
    return { x: node.x() - shape.width / 2, y: node.y() - shape.height / 2 };
  }
  return { x: node.x(), y: node.y() };
}

function ShapeViewBase({ shape, interactive, onSelect, onMove, onEdit }: ShapeViewProps) {
  const handlers = {
    listening: interactive,
    draggable: interactive,
    onPointerDown: (event: KonvaEventObject<PointerEvent>) => {
      if (event.evt.button !== 0) return;
      event.cancelBubble = true;
      onSelect?.(shape.id);
    },
    onDragMove: (event: KonvaEventObject<DragEvent>) =>
      onMove?.(shape.id, positionOf(shape, event.target)),
    onDragEnd: (event: KonvaEventObject<DragEvent>) =>
      onMove?.(shape.id, positionOf(shape, event.target)),
  };

  switch (shape.type) {
    case "rect":
      return (
        <Rect
          {...handlers}
          x={shape.x}
          y={shape.y}
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
          {...handlers}
          x={shape.x + shape.width / 2}
          y={shape.y + shape.height / 2}
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
          {...handlers}
          x={shape.x}
          y={shape.y}
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
          {...handlers}
          x={shape.x}
          y={shape.y}
          text={shape.text}
          fontSize={shape.fontSize}
          lineHeight={1.2}
          fill={shape.color}
          onDblClick={() => onEdit?.(shape)}
          onDblTap={() => onEdit?.(shape)}
        />
      );
    case "sticky":
      return (
        <Group
          {...handlers}
          x={shape.x}
          y={shape.y}
          onDblClick={() => onEdit?.(shape)}
          onDblTap={() => onEdit?.(shape)}
        >
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

export default memo(ShapeViewBase);
