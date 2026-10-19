"use client";

import { useEffect, useState } from "react";
import type * as Y from "yjs";
import type { Shape } from "@/types/board";
import { sortShapes } from "@/lib/shapes";
import type { CollabSession } from "./useCollab";

export function useShapes(session: CollabSession | null): Shape[] {
  const [shapes, setShapes] = useState<Shape[]>([]);

  useEffect(() => {
    if (!session) return;
    const source = session.shapes;
    let cache = new Map<string, Shape>();
    const dirty = new Set<string>();
    let frame = 0;

    const flush = () => {
      frame = 0;
      const next = new Map<string, Shape>();
      source.forEach((entry, id) => {
        const previous = cache.get(id);
        next.set(id, previous && !dirty.has(id) ? previous : (entry.toJSON() as Shape));
      });
      cache = next;
      dirty.clear();
      setShapes(sortShapes(Array.from(next.values())));
    };

    const onChange = (events: Y.YEvent<Y.Map<unknown>>[]) => {
      for (const event of events) {
        if (event.path.length === 0) {
          event.changes.keys.forEach((_, key) => dirty.add(key));
        } else {
          dirty.add(String(event.path[0]));
        }
      }
      if (!frame) frame = requestAnimationFrame(flush);
    };

    source.observeDeep(onChange);
    flush();

    return () => {
      source.unobserveDeep(onChange);
      cancelAnimationFrame(frame);
    };
  }, [session]);

  return shapes;
}
