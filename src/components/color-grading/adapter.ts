import { buildLayers, type Adjustments } from "./grading";

/** AI request — images and the user prompt only. Manual settings never travel. */
export interface ColorGradeRequest {
  images: File[];
  prompt: string;
}

export interface ColorGradeResult {
  /** Object URL (or remote URL) of the graded image. */
  imageUrl: string;
}

export type ColorGradeAdapter = (req: ColorGradeRequest) => Promise<ColorGradeResult>;

const SYSTEM = `Apply professional color grading to image 1.

Preserve the original composition, crop, camera angle, subject identity, facial features, body proportions, objects, background structure, logos and readable text. Do not add, remove or replace people or objects. Do not redesign the scene.

Change only the color palette, white balance, exposure, contrast, saturation, highlights, sharpness, tonal response and film grain.`;

/** The AI prompt is built from the user's text alone. */
export function buildGradePrompt(userPrompt: string) {
  const look = userPrompt.trim();
  return look ? `${SYSTEM}\n\nRequested look: ${look}` : SYSTEM;
}

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
 * Manual render — bakes the local live-preview adjustments into a JPEG in the
 * browser. Used for downloading a manual result; never touches the AI API.
 */
export async function renderManualGrade(file: File, adjustments: Adjustments): Promise<Blob> {
  const src = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await loadImage(src);
  } finally {
    URL.revokeObjectURL(src);
  }
  const maxSide = 2400;
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

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("Could not render the graded image");
  return blob;
}

/**
 * Real generation: the browser posts the original images and the prompt to the
 * server endpoint, which owns the Fal.ai credentials.
 */
export const generateColorGradeFal: ColorGradeAdapter = async ({ images, prompt }) => {
  const files = images.slice(0, 9);
  if (files.length === 0) throw new Error("No image selected");

  const form = new FormData();
  form.append("prompt", buildGradePrompt(prompt));
  for (const file of files) form.append("images", file, file.name);

  let res: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180_000);
  try {
    res = await fetch("/api/color-grade", {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") {
      throw new Error("Generation timed out — please try again.");
    }
    throw new Error("Network error — check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }

  let payload: { imageUrl?: string; error?: string } = {};
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok || !payload.imageUrl) {
    throw new Error(payload.error ?? "Generation failed. Please try again.");
  }

  // Fetch through the same-origin proxy so Download saves a real file.
  try {
    const img = await fetch(`/api/color-grade?url=${encodeURIComponent(payload.imageUrl)}`);
    if (img.ok) {
      const blob = await img.blob();
      return { imageUrl: URL.createObjectURL(blob) };
    }
  } catch {
    /* fall back to the remote URL */
  }
  return { imageUrl: payload.imageUrl };
};

/** UI calls only this. */
export const generateColorGrade: ColorGradeAdapter = generateColorGradeFal;
