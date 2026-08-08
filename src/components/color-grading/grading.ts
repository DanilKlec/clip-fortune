/**
 * Core grading model: adjustments, presets and the render layers derived from
 * them. Presets live here so their names/values can be swapped in one place.
 */

export type AdjustmentKey =
  | "temperature"
  | "contrast"
  | "saturation"
  | "highlights"
  | "exposure"
  | "sharpness"
  | "grain";

export type Adjustments = Record<AdjustmentKey, number>;

export interface AdjustmentSpec {
  key: AdjustmentKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

export const ADJUSTMENTS: AdjustmentSpec[] = [
  { key: "temperature", label: "Temperature", min: -100, max: 100, step: 1 },
  { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1 },
  { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1 },
  { key: "highlights", label: "Highlights", min: -100, max: 100, step: 1 },
  { key: "exposure", label: "Exposure", min: -100, max: 100, step: 1 },
  { key: "sharpness", label: "Sharpness", min: 0, max: 100, step: 1 },
  { key: "grain", label: "Film Grain", min: 0, max: 100, step: 1 },
];

export const NEUTRAL: Adjustments = {
  temperature: 0,
  contrast: 0,
  saturation: 0,
  highlights: 0,
  exposure: 0,
  sharpness: 0,
  grain: 0,
};

export interface Preset {
  id: string;
  name: string;
  values: Adjustments;
}

const p = (v: Partial<Adjustments>): Adjustments => ({ ...NEUTRAL, ...v });

/** 10 working presets — names and values are meant to be easy to replace. */
export const PRESETS: Preset[] = [
  { id: "natural", name: "Natural", values: p({}) },
  {
    id: "split-tone",
    name: "Split Tone",
    values: p({ temperature: -22, contrast: 18, saturation: 16, highlights: 18 }),
  },
  {
    id: "soft-skin",
    name: "Soft Skin",
    values: p({ temperature: 14, contrast: -12, saturation: -6, exposure: 8, sharpness: 10 }),
  },
  {
    id: "old-lens",
    name: "Old Lens",
    values: p({ temperature: 20, contrast: -8, saturation: -22, highlights: 14, grain: 30 }),
  },
  {
    id: "16mm",
    name: "16mm",
    values: p({ temperature: 10, contrast: 16, saturation: -10, grain: 55, sharpness: 20 }),
  },
  {
    id: "warm-film",
    name: "Warm Film",
    values: p({ temperature: 38, contrast: 12, saturation: 10, grain: 18 }),
  },
  {
    id: "cool-cinema",
    name: "Cool Cinema",
    values: p({ temperature: -42, contrast: 20, saturation: -8, highlights: -14 }),
  },
  {
    id: "teal-orange",
    name: "Teal & Orange",
    values: p({ temperature: 26, contrast: 26, saturation: 28, highlights: -10 }),
  },
  {
    id: "faded-film",
    name: "Faded Film",
    values: p({ temperature: -6, contrast: -26, saturation: -18, highlights: 24, grain: 22 }),
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    values: p({ contrast: 52, saturation: 12, highlights: -18, sharpness: 34 }),
  },
];

/** Tint colours are image-processing constants, not UI theme colours. */
const WARM_TINT = "255, 150, 60";
const COOL_TINT = "60, 150, 255";

export interface Overlay {
  color: string;
  blend: "soft-light" | "overlay";
  opacity: number;
}

export interface RenderLayers {
  filter: string;
  overlays: Overlay[];
  grainOpacity: number;
}

export function buildLayers(a: Adjustments): RenderLayers {
  const brightness = 1 + a.exposure / 250;
  // Sharpness is approximated with a local-contrast lift (CSS has no unsharp mask).
  const contrast = 1 + a.contrast / 160 + a.sharpness / 600;
  const saturate = Math.max(0, 1 + a.saturation / 100);

  const overlays: Overlay[] = [];
  if (a.temperature !== 0) {
    overlays.push({
      color: a.temperature > 0 ? WARM_TINT : COOL_TINT,
      blend: "soft-light",
      opacity: Math.min(0.6, Math.abs(a.temperature) / 140),
    });
  }
  if (a.highlights !== 0) {
    overlays.push({
      color: a.highlights > 0 ? "255, 255, 255" : "0, 0, 0",
      blend: "overlay",
      opacity: Math.min(0.45, Math.abs(a.highlights) / 260),
    });
  }

  return {
    filter: `brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(
      3,
    )}) saturate(${saturate.toFixed(3)})`,
    overlays,
    grainOpacity: a.grain / 100 * 0.35,
  };
}

/** Tiny tiling SVG noise used for the film-grain layer. */
export const GRAIN_URL =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='140' height='140' filter='url(%23n)' opacity='0.55'/></svg>\")";

export function isNeutral(a: Adjustments) {
  return (Object.keys(NEUTRAL) as AdjustmentKey[]).every((k) => a[k] === NEUTRAL[k]);
}

export function sameValues(a: Adjustments, b: Adjustments) {
  return (Object.keys(NEUTRAL) as AdjustmentKey[]).every((k) => a[k] === b[k]);
}