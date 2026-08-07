import { buildLayers, GRAIN_URL, type Adjustments } from "./grading";

interface Props {
  src: string;
  alt: string;
  adjustments: Adjustments;
  className?: string;
  imgClassName?: string;
}

/** Renders an image with the live grade applied (filter + tint + grain layers). */
export function GradedImage({
  src,
  alt,
  adjustments,
  className,
  imgClassName,
}: Props) {
  const layers = buildLayers(adjustments);
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={imgClassName ?? "h-full w-full object-contain"}
        style={{ filter: layers.filter }}
      />
      {layers.overlays.map((o, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `rgba(${o.color}, ${o.opacity})`,
            mixBlendMode: o.blend,
          }}
        />
      ))}
      {layers.grainOpacity > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: GRAIN_URL,
            opacity: layers.grainOpacity,
            mixBlendMode: "overlay",
          }}
        />
      )}
    </div>
  );
}