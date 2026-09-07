import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

/** Reads the natural aspect ratio (w/h) of a source image. */
export function useImageAspect(src?: string | null) {
  const [ratio, setRatio] = useState(16 / 9);
  useEffect(() => {
    if (!src) return;
    let alive = true;
    const img = new Image();
    const apply = () => {
      if (alive && img.naturalWidth && img.naturalHeight) {
        setRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.onload = apply;
    img.src = src;
    // Cached sources resolve synchronously: apply at once so a source swap
    // never renders one frame with the previous image's ratio.
    if (img.complete) apply();
    else
      void img
        .decode?.()
        .then(apply)
        .catch(() => undefined);
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

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const read = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measured mode: the inner box is absolutely positioned, so its size can
  // never feed back into the parent — swapping original/graded/AI sources
  // keeps the preview area byte-for-byte identical.
  const measured = box.w > 0 && box.h > 0;
  const fitW = measured ? Math.min(box.w, box.h * ratio) : 0;
  const fit: React.CSSProperties = measured
    ? {
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: `${fitW}px`,
        height: `${fitW / ratio}px`,
      }
    : // Pre-measure / auto-height parents: fall back to a ratio box.
      {
        position: "relative",
        width: "100%",
        aspectRatio: `${ratio}`,
        maxWidth: "100%",
        maxHeight: maxHeight ?? "100%",
      };

  return (
    <div
      ref={boxRef}
      className="relative flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden"
      style={maxHeight && maxHeight !== "100%" ? { maxHeight } : undefined}
    >
      <div ref={stageRef} className={`overflow-hidden rounded-xl ${className ?? ""}`} style={fit}>
        {children}
      </div>
    </div>
  );
}
