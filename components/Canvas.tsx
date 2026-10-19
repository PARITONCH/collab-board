"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import { Layer, Rect, Stage } from "react-konva";
import type { Peer, Point, Shape, StickyShape, TextShape, Viewport } from "@/types/board";
import { CURSOR_THROTTLE_MS } from "@/lib/config";
import {
  addShape,
  boundsOf,
  isDraftMeaningful,
  isTextual,
  patchShape,
  removeShape,
  startShape,
  updateDraft,
} from "@/lib/shapes";
import { throttle } from "@/lib/throttle";
import { zoomAt } from "@/lib/viewport";
import { useElementSize } from "@/hooks/useElementSize";
import type { CollabSession } from "@/hooks/useCollab";
import { useBoardStore } from "@/store/board";
import PeerCursor from "./PeerCursor";
import ShapeView from "./ShapeView";
import TextEditor from "./TextEditor";

interface CanvasProps {
  session: CollabSession;
  shapes: Shape[];
  peers: Peer[];
}

interface EditingState {
  shape: TextShape | StickyShape;
  isNew: boolean;
}

interface ActiveDraft {
  shape: Shape;
  origin: Point;
}

interface PanState {
  start: Point;
  view: Viewport;
}

const GRID_SIZE = 24;

function SelectionOutline({ shape, scale }: { shape: Shape; scale: number }) {
  const box = boundsOf(shape);
  const pad = 6 / scale;
  return (
    <Rect
      x={box.x - pad}
      y={box.y - pad}
      width={box.width + pad * 2}
      height={box.height + pad * 2}
      stroke="#6366f1"
      strokeWidth={1.5 / scale}
      dash={[6 / scale, 4 / scale]}
      listening={false}
    />
  );
}

export default function Canvas({ session, shapes, peers }: CanvasProps) {
  const { awareness, identity, undo } = session;
  const tool = useBoardStore((state) => state.tool);
  const color = useBoardStore((state) => state.color);
  const selectedId = useBoardStore((state) => state.selectedId);
  const view = useBoardStore((state) => state.view);
  const select = useBoardStore((state) => state.select);
  const setTool = useBoardStore((state) => state.setTool);
  const setView = useBoardStore((state) => state.setView);

  const containerRef = useRef<HTMLDivElement>(null);
  const size = useElementSize(containerRef);
  const draftRef = useRef<ActiveDraft | null>(null);
  const panRef = useRef<PanState | null>(null);
  const pendingTextRef = useRef<TextShape | StickyShape | null>(null);
  const [draft, setDraft] = useState<Shape | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  const sendCursor = useMemo(
    () => throttle((point: Point) => awareness.setLocalStateField("cursor", point), CURSOR_THROTTLE_MS),
    [awareness]
  );
  const sendDraft = useMemo(
    () => throttle((shape: Shape) => awareness.setLocalStateField("draft", shape), CURSOR_THROTTLE_MS),
    [awareness]
  );

  useEffect(
    () => () => {
      sendCursor.cancel();
      sendDraft.cancel();
    },
    [sendCursor, sendDraft]
  );

  const clearCursor = useCallback(() => {
    sendCursor.cancel();
    awareness.setLocalStateField("cursor", null);
  }, [awareness, sendCursor]);

  const clearDraft = useCallback(() => {
    sendDraft.cancel();
    awareness.setLocalStateField("draft", null);
  }, [awareness, sendDraft]);

  const finishInteraction = useEffectEvent(() => {
    panRef.current = null;
    const pendingText = pendingTextRef.current;
    if (pendingText) {
      pendingTextRef.current = null;
      setEditing({ shape: pendingText, isNew: true });
      return;
    }
    const active = draftRef.current;
    if (!active) return;
    draftRef.current = null;
    setDraft(null);
    clearDraft();
    if (!isDraftMeaningful(active.shape)) return;
    addShape(session, active.shape);
    if (active.shape.type !== "pen") {
      setTool("select");
      select(active.shape.id);
    }
  });

  useEffect(() => {
    const end = () => finishInteraction();
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  useEffect(() => {
    const isTyping = (target: EventTarget | null) =>
      target instanceof HTMLElement && (target.tagName === "TEXTAREA" || target.tagName === "INPUT");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isTyping(event.target)) return;
      event.preventDefault();
      setSpaceHeld(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") setSpaceHeld(false);
    };
    const onBlur = () => setSpaceHeld(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const state = useBoardStore.getState();
      state.setView(
        zoomAt(state.view, Math.exp(-event.deltaY * 0.0015), {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        })
      );
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  const handlePointerDown = (event: KonvaEventObject<PointerEvent>) => {
    const stage = event.target.getStage();
    if (!stage || editing || event.evt.button === 2) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const onStage = event.target === stage;

    if (event.evt.button === 1 || spaceHeld || (tool === "select" && onStage)) {
      panRef.current = { start: pointer, view };
      if (tool === "select" && onStage && !spaceHeld && event.evt.button === 0) select(null);
      return;
    }
    if (tool === "select") return;

    const point = stage.getRelativePointerPosition();
    if (!point) return;
    const shape = startShape(tool, point, identity.id, color);
    if (isTextual(shape)) {
      pendingTextRef.current = shape;
      return;
    }
    draftRef.current = { shape, origin: point };
    setDraft(shape);
    sendDraft(shape);
  };

  const handlePointerMove = (event: KonvaEventObject<PointerEvent>) => {
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;

    const pan = panRef.current;
    if (pan) {
      setView({
        ...pan.view,
        x: pan.view.x + pointer.x - pan.start.x,
        y: pan.view.y + pointer.y - pan.start.y,
      });
      return;
    }

    const point = stage.getRelativePointerPosition();
    if (!point) return;
    sendCursor(point);

    const active = draftRef.current;
    if (!active) return;
    if (active.shape.type === "pen") {
      const { points } = active.shape;
      const distance = Math.hypot(point.x - points[points.length - 2], point.y - points[points.length - 1]);
      if (distance < 1.5 / view.scale) return;
    }
    const next = updateDraft(active.shape, active.origin, point);
    draftRef.current = { ...active, shape: next };
    setDraft(next);
    sendDraft(next);
  };

  const handleSelect = useCallback(
    (id: string) => {
      undo.stopCapturing();
      select(id);
    },
    [undo, select]
  );

  const handleMove = useCallback(
    (id: string, position: Point) => patchShape(session, id, { x: position.x, y: position.y }),
    [session]
  );

  const handleEdit = useCallback((shape: TextShape | StickyShape) => {
    setEditing({ shape, isNew: false });
  }, []);

  const commitEdit = (text: string) => {
    if (!editing) return;
    const { shape, isNew } = editing;
    setEditing(null);

    if (isNew) {
      setTool("select");
      if (!text.trim()) return;
      addShape(session, { ...shape, text });
      select(shape.id);
      return;
    }
    if (shape.type === "text" && !text.trim()) {
      removeShape(session, shape.id);
      select(null);
      return;
    }
    undo.stopCapturing();
    patchShape(session, shape.id, { text });
  };

  const hiddenId = editing && !editing.isNew ? editing.shape.id : null;
  const visible = hiddenId ? shapes.filter((shape) => shape.id !== hiddenId) : shapes;
  const selected = !editing && selectedId ? shapes.find((shape) => shape.id === selectedId) : undefined;
  const canInteract = tool === "select" && !spaceHeld;
  const gap = GRID_SIZE * view.scale;
  const cursor = spaceHeld ? "grab" : tool === "select" ? "default" : tool === "text" ? "text" : "crosshair";

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none overflow-hidden select-none"
      onPointerLeave={clearCursor}
      style={{
        cursor,
        backgroundImage: gap >= 8 ? "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)" : "none",
        backgroundSize: `${gap}px ${gap}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
    >
      {size.width > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          x={view.x}
          y={view.y}
          scaleX={view.scale}
          scaleY={view.scale}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          <Layer>
            {visible.map((shape) => (
              <ShapeView
                key={shape.id}
                shape={shape}
                interactive={canInteract}
                onSelect={handleSelect}
                onMove={handleMove}
                onEdit={handleEdit}
              />
            ))}
            {draft && <ShapeView shape={draft} interactive={false} />}
            {selected && <SelectionOutline shape={selected} scale={view.scale} />}
          </Layer>
          <Layer listening={false}>
            {peers.map(
              (peer) => peer.draft && <ShapeView key={`draft-${peer.clientId}`} shape={peer.draft} interactive={false} />
            )}
            {peers.map((peer) => (
              <PeerCursor key={peer.clientId} peer={peer} scale={view.scale} />
            ))}
          </Layer>
        </Stage>
      )}
      {editing && <TextEditor key={editing.shape.id} shape={editing.shape} view={view} onCommit={commitEdit} />}
    </div>
  );
}
