import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

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
}

/**
 * Centers a box with the source image ratio inside the available area, sized to
 * the largest `contain` fit. Every layer inside it shares identical bounds.
 */
export function ImageStage({ ratio, children, stageRef, className }: Props) {
  const outer = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const w = Math.min(r.width, r.height * ratio);
      setSize({ w, h: w / ratio });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ratio]);

  return (
    <div ref={outer} className="flex h-full w-full min-w-0 items-center justify-center">
      <div
        ref={stageRef}
        className={`relative overflow-hidden rounded-xl ${className ?? ""}`}
        style={
          size
            ? { width: size.w, height: size.h, maxWidth: "100%", maxHeight: "100%" }
            : { width: "100%", height: "100%" }
        }
      >
        {children}
      </div>
    </div>
  );
}
