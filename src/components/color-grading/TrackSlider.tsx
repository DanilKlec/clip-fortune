import { useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Neutral value — drives the "moved" marker. */
  def: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  /** Called once when a pointer drag starts / ends (history batching). */
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** Full-width track control: label, live value, knob and neutral marker. */
export function TrackSlider({
  label,
  value,
  min,
  max,
  step = 1,
  def,
  disabled = false,
  onChange,
  onDragStart,
  onDragEnd,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pct = (v: number) => (v - min) / (max - min);
  const fromClientX = (clientX: number) => {
    const el = ref.current;
    if (!el) return value;
    const r = el.getBoundingClientRect();
    if (!r.width) return value;
    const raw = min + ((clientX - r.left) / r.width) * (max - min);
    return clamp(Math.round(raw / step) * step, min, max);
  };

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    dragging.current = true;
    onDragStart?.();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture unsupported */
    }
    onChange(fromClientX(e.clientX));
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current || disabled) return;
    onChange(fromClientX(e.clientX));
  };
  const up = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onDragEnd?.();
  };

  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const big = (max - min) / 10;
    const map: Record<string, number> = {
      ArrowLeft: -step,
      ArrowDown: -step,
      ArrowRight: step,
      ArrowUp: step,
      PageDown: -big,
      PageUp: big,
    };
    if (e.key in map) {
      e.preventDefault();
      onChange(clamp(Math.round(value + map[e.key]), min, max));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      onChange(min);
    }
    if (e.key === "End") {
      e.preventDefault();
      onChange(max);
    }
  };

  const shown = Math.round(value);
  const text = `${min < 0 && shown > 0 ? "+" : ""}${shown}`;

  return (
    <div
      ref={ref}
      className="cg-track"
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={shown}
      aria-valuetext={text}
      aria-disabled={disabled}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
    >
      <div className="cg-fill" style={{ width: `${pct(value) * 100}%` }} />
      <div className="cg-mark" style={{ left: `${pct(def) * 100}%` }} />
      <div className="cg-knob" style={{ left: `${pct(value) * 100}%` }} />
      <span className="cg-lab">{label}</span>
      <span className="cg-val">{text}</span>
    </div>
  );
}
