"use client";

import { useEffect, useState } from "react";
import { useCollab } from "@/hooks/useCollab";
import { usePeers } from "@/hooks/usePeers";
import { useShapes } from "@/hooks/useShapes";
import { useShortcuts } from "@/hooks/useShortcuts";
import { useBoardStore } from "@/store/board";
import Canvas from "./Canvas";
import NameDialog from "./NameDialog";
import Toolbar from "./Toolbar";
import TopBar from "./TopBar";
import ZoomControls from "./ZoomControls";

interface BoardProps {
  roomId: string;
}

interface BoardViewProps extends BoardProps {
  name: string;
  onRename: (name: string) => void;
}

function BoardView({ roomId, name, onRename }: BoardViewProps) {
  const { session, status } = useCollab(roomId, name);
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

  useEffect(() => {
    session.awareness.setLocalStateField("user", { ...session.identity, name });
  }, [session, name]);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-neutral-950">
      <Canvas session={session} shapes={shapes} peers={peers} />
      <Toolbar session={session} />
      <TopBar
        identity={{ ...session.identity, name }}
        peers={peers}
        status={status}
        onRename={onRename}
      />
      <ZoomControls />
    </main>
  );
}

export default function Board({ roomId }: BoardProps) {
  const [name, setName] = useState("");

  if (!name) return <NameDialog onSubmit={setName} />;
  return <BoardView roomId={roomId} name={name} onRename={setName} />;
}
