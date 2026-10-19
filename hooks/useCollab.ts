"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { Awareness } from "y-protocols/awareness";
import type { ConnectionStatus, Identity } from "@/types/board";
import { WS_URL } from "@/lib/config";
import { getIdentity } from "@/lib/identity";
import { LOCAL_ORIGIN, type ShapeMap } from "@/lib/shapes";

export interface CollabSession {
  doc: Y.Doc;
  provider: WebsocketProvider;
  shapes: ShapeMap;
  undo: Y.UndoManager;
  awareness: Awareness;
  identity: Identity;
}

export interface Collab {
  session: CollabSession;
  status: ConnectionStatus;
  synced: boolean;
}

const destroyTimers = new WeakMap<CollabSession, number>();

function createSession(roomId: string, name: string): CollabSession {
  const identity = getIdentity(name);
  const doc = new Y.Doc();
  const provider = new WebsocketProvider(`${WS_URL}/rooms`, roomId, doc, { connect: false, disableBc: true });
  const shapes = doc.getMap<Y.Map<unknown>>("shapes");
  const undo = new Y.UndoManager(shapes, { trackedOrigins: new Set([LOCAL_ORIGIN]) });
  const awareness = provider.awareness;
  awareness.setLocalState({ user: identity, cursor: null, draft: null });
  return { doc, provider, shapes, undo, awareness, identity };
}

function destroySession(session: CollabSession): void {
  session.undo.destroy();
  session.provider.destroy();
  session.doc.destroy();
}

export function useCollab(roomId: string, name: string): Collab {
  const [session] = useState(() => createSession(roomId, name));
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const { provider } = session;
    const pending = destroyTimers.get(session);
    if (pending !== undefined) {
      window.clearTimeout(pending);
      destroyTimers.delete(session);
    }

    const onStatus = (event: { status: ConnectionStatus }) => setStatus(event.status);
    const onSync = (isSynced: boolean) => setSynced(isSynced);
    provider.on("status", onStatus);
    provider.on("sync", onSync);
    provider.connect();

    return () => {
      provider.off("status", onStatus);
      provider.off("sync", onSync);
      provider.disconnect();
      destroyTimers.set(
        session,
        window.setTimeout(() => destroySession(session), 0)
      );
    };
  }, [session]);

  return { session, status, synced };
}
