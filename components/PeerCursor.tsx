"use client";

import { Group, Label, Line, Tag, Text } from "react-konva";
import type { Peer } from "@/types/board";

interface PeerCursorProps {
  peer: Peer;
  scale: number;
}

export default function PeerCursor({ peer, scale }: PeerCursorProps) {
  if (!peer.cursor) return null;

  return (
    <Group x={peer.cursor.x} y={peer.cursor.y} scaleX={1 / scale} scaleY={1 / scale} listening={false}>
      <Line
        points={[0, 0, 0, 16, 4, 12, 7.5, 19, 10, 18, 6.5, 11, 12, 11]}
        closed
        fill={peer.color}
        stroke="#0a0a0a"
        strokeWidth={1}
        lineJoin="round"
      />
      <Label x={12} y={18}>
        <Tag fill={peer.color} cornerRadius={4} />
        <Text text={peer.name} fontSize={12} padding={4} fill="#0a0a0a" fontStyle="bold" />
      </Label>
    </Group>
  );
}
