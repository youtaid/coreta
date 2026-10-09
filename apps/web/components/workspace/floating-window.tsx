"use client";

import { GripHorizontal, Maximize2, Minimize2 } from "lucide-react";
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { clampPosition, moveByKey, type Point, type Size } from "@/lib/floating-window";
import { cn } from "@/lib/utils";

export interface FloatingWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
}

interface Measurement {
  windowSize: Size;
  container: Size;
}

/**
 * A small window that floats above the workspace, used when media does not fit beside the
 * question. It can be dragged by pen, finger, or mouse (Pointer Events) or moved with the arrow
 * keys, collapses to its title bar, and never leaves the area it floats in.
 *
 * It positions itself against its nearest positioned ancestor, so that ancestor must be `relative`.
 */
export function FloatingWindow({ title, children, className }: FloatingWindowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<Point | null>(null);
  // null until the user moves the window; it sits in the bottom-right corner by CSS until then.
  const [position, setPosition] = useState<Point | null>(null);
  const [minimized, setMinimized] = useState(false);

  const measure = useCallback((): Measurement | null => {
    const root = rootRef.current;
    const parent = root?.offsetParent;
    if (!root || !(parent instanceof HTMLElement)) return null;
    return {
      windowSize: { width: root.offsetWidth, height: root.offsetHeight },
      container: { width: parent.clientWidth, height: parent.clientHeight },
    };
  }, []);

  // Rotating the tablet, resizing the window, or collapsing/expanding the window changes the
  // available room; keep a window the user has moved inside its container.
  useEffect(() => {
    const root = rootRef.current;
    const parent = root?.offsetParent;
    if (!root || !(parent instanceof HTMLElement)) return;
    const observer = new ResizeObserver(() => {
      const m = measure();
      if (!m) return;
      setPosition((current) =>
        current ? clampPosition(current, m.windowSize, m.container) : current,
      );
    });
    observer.observe(parent);
    observer.observe(root);
    return () => observer.disconnect();
  }, [measure]);

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    dragOffset.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const offset = dragOffset.current;
    const parent = rootRef.current?.offsetParent;
    const m = measure();
    if (!offset || !m || !(parent instanceof HTMLElement)) return;
    const origin = parent.getBoundingClientRect();
    setPosition(
      clampPosition(
        { x: event.clientX - origin.left - offset.x, y: event.clientY - origin.top - offset.y },
        m.windowSize,
        m.container,
      ),
    );
  }

  function handlePointerEnd(event: PointerEvent<HTMLButtonElement>) {
    dragOffset.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const root = rootRef.current;
    const m = measure();
    if (!root || !m) return;
    // Until the window has been moved it is anchored by CSS, so read where it actually is.
    const current = position ?? { x: root.offsetLeft, y: root.offsetTop };
    const next = moveByKey(event.key, current, m.windowSize, m.container);
    if (!next) return;
    event.preventDefault();
    setPosition(next);
  }

  const bodyId = `${title.replace(/\W+/g, "-").toLowerCase()}-body`;

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={title}
      data-testid="floating-window"
      data-minimized={minimized}
      style={position ? { left: position.x, top: position.y } : undefined}
      className={cn(
        "absolute z-20 flex w-[min(20rem,calc(100%-1rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg ring-1 ring-foreground/10",
        !position && "right-2 bottom-2",
        className,
      )}
    >
      <div className="flex min-h-touch shrink-0 items-stretch border-b border-border/60 bg-muted/60">
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onKeyDown={handleKeyDown}
          aria-label={`Geser jendela ${title}. Gunakan tombol panah untuk memindahkan.`}
          className="flex min-w-0 flex-1 cursor-grab touch-none items-center gap-2 px-3 text-left text-xs font-semibold outline-none select-none focus-visible:ring-3 focus-visible:ring-ring active:cursor-grabbing"
        >
          <GripHorizontal className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{title}</span>
        </button>
        <button
          type="button"
          onClick={() => setMinimized((value) => !value)}
          aria-expanded={!minimized}
          aria-controls={bodyId}
          aria-label={minimized ? `Perbesar jendela ${title}` : `Perkecil jendela ${title}`}
          className="grid min-w-touch place-items-center text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring"
        >
          {minimized ? (
            <Maximize2 className="size-4" aria-hidden />
          ) : (
            <Minimize2 className="size-4" aria-hidden />
          )}
        </button>
      </div>

      <div id={bodyId} hidden={minimized} className="h-52 min-h-0">
        {children}
      </div>
    </div>
  );
}
