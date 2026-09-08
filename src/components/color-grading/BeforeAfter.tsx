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
  /** Optional CSS height cap forwarded to the shared stage. */
  maxHeight?: string;
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
  maxHeight,
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
    <ImageStage ratio={ratio} stageRef={stageRef} className="select-none" maxHeight={maxHeight}>
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
        {/* bottom layer — original (Before), always fully visible */}
        {before}
        {/* top layer — After, revealed by clipping from the right */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        >
          {after}
        </div>

        <span className="cg-tag cg-tag-a">Before</span>
        <span className="cg-tag cg-tag-b">After</span>

        <div aria-hidden className="cg-cmp-line" style={{ left: `${pos}%` }} />
        <button
          type="button"
          className="cg-cmp-knob"
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
          style={{ left: `${pos}%` }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m9 6-4 6 4 6" />
            <path d="m15 6 4 6-4 6" />
          </svg>
        </button>
      </div>
    </ImageStage>
  );
}
