import { buildLayers, type Adjustments } from "./grading";

export interface GradeRequest {
  imageUrl: string;
  prompt: string;
  adjustments: Adjustments;
}

export interface GradeResult {
  /** Object URL of the graded image — caller owns revoking it. */
  url: string;
}

export type GradeAdapter = (req: GradeRequest) => Promise<GradeResult>;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the image"));
    img.src = src;
  });
}

/**
 * Local stand-in for the future hosted grading API. Renders the current
 * adjustments onto a canvas and returns an object URL. Swapping this adapter
 * for a real API call requires no UI changes.
 */
export const generateColorGradeMock: GradeAdapter = async ({
  imageUrl,
  adjustments,
}) => {
  const img = await loadImage(imageUrl);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser");

  const layers = buildLayers(adjustments);
  ctx.filter = layers.filter;
  ctx.drawImage(img, 0, 0, w, h);
  ctx.filter = "none";

  for (const o of layers.overlays) {
    ctx.globalCompositeOperation = o.blend === "overlay" ? "overlay" : "soft-light";
    ctx.fillStyle = `rgba(${o.color}, ${o.opacity})`;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = "source-over";

  if (layers.grainOpacity > 0) {
    const noise = ctx.createImageData(w, h);
    const d = noise.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = Math.round(layers.grainOpacity * 255);
    }
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    tmp.getContext("2d")?.putImageData(noise, 0, 0);
    ctx.globalCompositeOperation = "overlay";
    ctx.drawImage(tmp, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

  // Simulated round-trip latency so the UI states are exercised realistically.
  await new Promise((r) => setTimeout(r, 1200));

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("Could not render the graded image");
  return { url: URL.createObjectURL(blob) };
};