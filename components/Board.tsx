"use client";

import { useEffect } from "react";
import { useCollab } from "@/hooks/useCollab";
import { usePeers } from "@/hooks/usePeers";
import { useShapes } from "@/hooks/useShapes";
import { useShortcuts } from "@/hooks/useShortcuts";
import { useBoardStore } from "@/store/board";
import Canvas from "./Canvas";
import Toolbar from "./Toolbar";
import TopBar from "./TopBar";
import ZoomControls from "./ZoomControls";

interface BoardProps {
  roomId: string;
}

export default function Board({ roomId }: BoardProps) {
  const { session, status } = useCollab(roomId);
  const shapes = useShapes(session);
  const peers = usePeers(session.awareness);
  useShortcuts(session);

  useEffect(() => {
    useBoardStore.setState({
      tool: "select",
      selectedId: null,
      view: { x: window.innerWidth / 2, y: window.innerHeight / 2, scale: 1 },
    });
  }, [roomId]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-neutral-950">
      <Canvas session={session} shapes={shapes} peers={peers} />
      <Toolbar session={session} />
      <TopBar identity={session.identity} peers={peers} status={status} />
      <ZoomControls />
    </main>
  );
}
