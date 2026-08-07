import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { ReactNode } from "react";

interface Props {
  before: ReactNode;
  after: ReactNode;
  label?: string;
}

/** Draggable before/after comparison. Keyboard accessible via the slider role. */
export function BeforeAfter({ before, after, label = "Before and after" }: Props) {
  const [pos, setPos] = useState(50);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    move(e.clientX);
  };

  return (
    <div
      ref={boxRef}
      onPointerDown={onDown}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      className="relative touch-none select-none overflow-hidden rounded-xl"
    >
      <div className="[&_img]:pointer-events-none">{after}</div>
      <div
        className="absolute inset-0 overflow-hidden [&_img]:pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        {before}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-px bg-volt"
        style={{ left: `${pos}%` }}
      />
      <div
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((v) => Math.max(0, v - 2));
          if (e.key === "ArrowRight") setPos((v) => Math.min(100, v + 2));
        }}
        className="absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border bg-background/80 text-[11px] font-bold text-volt backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ left: `${pos}%`, borderColor: "var(--volt-bdr)" }}
      >
        ⇆
      </div>
      <span className="badge-volt pointer-events-none absolute left-3 top-3">Before</span>
      <span className="badge-sky pointer-events-none absolute right-3 top-3">After</span>
    </div>
  );
}