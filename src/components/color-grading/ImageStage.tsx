import { useEffect, useState, type ReactNode, type RefObject } from "react";

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
  // A percentage max-height needs a definite parent height; when a caller gives
  // an explicit cap we mirror it into max-width so the ratio is never broken.
  const cap = maxHeight ?? "100%";
  const maxWidth = maxHeight ? `calc(${maxHeight} * ${ratio})` : "100%";
  return (
    <div className="flex h-full w-full min-w-0 items-center justify-center">
      <div
        ref={stageRef}
        className={`relative overflow-hidden rounded-xl ${className ?? ""}`}
        style={{ width: "100%", aspectRatio: `${ratio}`, maxWidth, maxHeight: cap }}
      >
        {children}
      </div>
    </div>
  );
}
