import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { ReactNode } from "react";
import { ImageStage } from "./ImageStage";

interface Props {
  before: ReactNode;
  after: ReactNode;
  /** Source image aspect ratio (w/h) — both layers share this stage. */
  ratio: number;
  label?: string;
  /** Optional controlled handle position (0-100) so it can persist per image. */
  position?: number;
  onPositionChange?: (pos: number) => void;
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/** Draggable before/after comparison. Keyboard accessible via the slider role. */
export function BeforeAfter({
  before,
  after,
  ratio,
  label = "Before and after",
  position,
  onPositionChange,
}: Props) {
  const [internal, setInternal] = useState(position ?? 50);
  const pos = clamp(position ?? internal);
  const setPos = (next: number | ((v: number) => number)) => {
    const value = clamp(typeof next === "function" ? next(pos) : next);
    setInternal(value);
    onPositionChange?.(value);
  };
  const stageRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    setPos(((clientX - r.left) / r.width) * 100);
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture unsupported — pointer events still bubble */
    }
    move(e.clientX);
  };
  const stop = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <ImageStage ratio={ratio} stageRef={stageRef} className="select-none">
      <div
        onPointerDown={onDown}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          e.preventDefault();
          move(e.clientX);
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={() => (dragging.current = false)}
        className="absolute inset-0 touch-none select-none"
      >
        {/* bottom layer — original, always fully visible */}
        {before}
        {/* top layer — revealed by clipping only, never resized */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 calc(100% - ${pos}%) 0 0)` }}
        >
          {after}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-volt"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
        />
        <div
          role="slider"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((v) => v - 2);
            if (e.key === "ArrowRight") setPos((v) => v + 2);
          }}
          className="absolute top-1/2 z-30 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border bg-background/80 text-[11px] font-bold text-volt backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ left: `${pos}%`, borderColor: "var(--volt-bdr)" }}
        >
          ⇆
        </div>

        <span className="badge-volt pointer-events-none absolute left-3 top-3 z-30">Before</span>
        <span className="badge-sky pointer-events-none absolute right-3 top-3 z-30">After</span>
      </div>
    </ImageStage>
  );
}
