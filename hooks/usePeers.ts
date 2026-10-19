"use client";

import { useEffect, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import type { Identity, Peer, Point, Shape } from "@/types/board";

interface AwarenessState {
  user?: Identity;
  cursor?: Point | null;
  draft?: Shape | null;
}

export function usePeers(awareness: Awareness | null): Peer[] {
  const [peers, setPeers] = useState<Peer[]>([]);

  useEffect(() => {
    if (!awareness) return;

    const refresh = () => {
      const list: Peer[] = [];
      awareness.getStates().forEach((raw, clientId) => {
        const state = raw as AwarenessState;
        if (clientId === awareness.clientID || !state.user) return;
        list.push({
          ...state.user,
          clientId,
          cursor: state.cursor ?? null,
          draft: state.draft ?? null,
        });
      });
      setPeers(list);
    };

    awareness.on("change", refresh);
    refresh();

    return () => awareness.off("change", refresh);
  }, [awareness]);

  return peers;
}
