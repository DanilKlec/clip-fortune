import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

/** Reads the natural aspect ratio (w/h) of a source image. */
export function useImageAspect(src?: string | null) {
  const [ratio, setRatio] = useState(16 / 9);
  useEffect(() => {
    if (!src) return;
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive && img.naturalWidth && img.naturalHeight) {
        setRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return ratio;
}

interface Props {
  /** width / height of the source image. */
  ratio: number;
  children: ReactNode;
  /** Ref to the stage box itself (used for pointer maths). */
  stageRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  /** CSS height cap for the stage (e.g. "min(70vh, 760px)"). */
  maxHeight?: string;
}

/**
 * Centers a box with the source image ratio inside the available area, sized to
 * the largest `contain` fit. Every layer inside it shares identical bounds.
 */
export function ImageStage({ ratio, children, stageRef, className, maxHeight }: Props) {
  // The stage is measured in pixels: a percentage/aspect-ratio-only box keeps a
  // definite width, so a tall image would overflow the (clipped) container and
  // read as zoomed. Measuring gives an exact `contain` fit for every ratio.
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit =
    box.w > 0 && box.h > 0
      ? (() => {
          const w = Math.min(box.w, box.h * ratio);
          return { width: `${w}px`, height: `${w / ratio}px` };
        })()
      : // Pre-measure / auto-height parents: fall back to a ratio box.
        {
          width: "100%",
          aspectRatio: `${ratio}`,
          maxWidth: "100%",
          maxHeight: maxHeight ?? "100%",
        };

  return (
    <div
      ref={boxRef}
      className="flex h-full w-full min-w-0 items-center justify-center"
      style={maxHeight && maxHeight !== "100%" ? { maxHeight } : undefined}
    >
      <div
        ref={stageRef}
        className={`relative overflow-hidden rounded-xl ${className ?? ""}`}
        style={fit}
      >
        {children}
      </div>
    </div>
  );
}
