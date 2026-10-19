"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import type { StickyShape, TextShape, Viewport } from "@/types/board";
import { worldToScreen } from "@/lib/viewport";

interface TextEditorProps {
  shape: TextShape | StickyShape;
  view: Viewport;
  onCommit: (text: string) => void;
}

export default function TextEditor({ shape, view, onCommit }: TextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }, []);

  const origin = worldToScreen(view, shape);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();
    if (event.key === "Escape" || (event.key === "Enter" && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  if (shape.type === "sticky") {
    return (
      <textarea
        ref={ref}
        key={shape.id}
        defaultValue={shape.text}
        onBlur={(event) => onCommit(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        className="absolute resize-none rounded text-neutral-900 shadow-xl outline-none"
        style={{
          left: origin.x,
          top: origin.y,
          width: shape.width * view.scale,
          height: shape.height * view.scale,
          padding: 12 * view.scale,
          fontSize: 18 * view.scale,
          lineHeight: 1.25,
          background: shape.color,
        }}
      />
    );
  }

  return (
    <textarea
      ref={ref}
      key={shape.id}
      rows={1}
      defaultValue={shape.text}
      onBlur={(event) => onCommit(event.currentTarget.value)}
      onKeyDown={handleKeyDown}
      className="absolute resize-none overflow-hidden bg-transparent p-0 outline-1 outline-dashed outline-indigo-500 field-sizing-content"
      style={{
        left: origin.x,
        top: origin.y,
        minWidth: 120 * view.scale,
        fontSize: shape.fontSize * view.scale,
        lineHeight: 1.2,
        color: shape.color,
      }}
    />
  );
}
