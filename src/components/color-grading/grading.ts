/**
 * Core grading model: adjustments, presets and the render layers derived from
 * them. Presets live here so their names/values can be swapped in one place.
 */

export type AdjustmentKey =
  | "temperature"
  | "tint"
  | "exposure"
  | "gamma"
  | "fade"
  | "contrast"
  | "saturation"
  | "highlights"
  | "shadows"
  | "whites"
  | "blacks"
  | "splitTone"
  | "sharpness"
  | "clarity"
  | "soften"
  | "texture"
  | "bloom"
  | "bloomThreshold"
  | "bloomRadius"
  | "halation"
  | "halationRadius"
  | "halationWarmth"
  | "lensHaze"
  | "hazeDensity"
  | "hazeTint"
  | "grain"
  | "grainSize"
  | "grainRoughness";

export type Adjustments = Record<AdjustmentKey, number>;

/** Per-effect enable/disable flags. */
export type EffectToggles = Record<AdjustmentKey, boolean>;

export interface AdjustmentSpec {
  key: AdjustmentKey;
  label: string;
  min: number;
  max: number;
  step: number;
  /** Short explanation for non-obvious effects. */
  hint?: string;
}

export const ADJUSTMENTS: AdjustmentSpec[] = [
  {
    key: "temperature",
    label: "Temperature",
    min: -100,
    max: 100,
    step: 1,
    hint: "Negative cools the white balance, positive warms it.",
  },
  {
    key: "tint",
    label: "Tint",
    min: -100,
    max: 100,
    step: 1,
    hint: "Negative shifts towards green, positive towards magenta.",
  },
  { key: "exposure", label: "Exposure", min: -100, max: 100, step: 1 },
  {
    key: "gamma",
    label: "Gamma",
    min: -100,
    max: 100,
    step: 1,
    hint: "Bends the midtones without moving black or white points.",
  },
  {
    key: "fade",
    label: "Fade",
    min: 0,
    max: 100,
    step: 1,
    hint: "Milky, lifted look across the whole dynamic range.",
  },
  { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1 },
  { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1 },
  {
    key: "highlights",
    label: "Highlights",
    min: -100,
    max: 100,
    step: 1,
    hint: "Lifts or rolls off the brightest parts of the image.",
  },
  {
    key: "shadows",
    label: "Shadows",
    min: -100,
    max: 100,
    step: 1,
    hint: "Opens up or deepens the darker parts of the image.",
  },
  {
    key: "whites",
    label: "Whites",
    min: -100,
    max: 100,
    step: 1,
    hint: "Sets where the brightest tone clips.",
  },
  {
    key: "blacks",
    label: "Blacks",
    min: -100,
    max: 100,
    step: 1,
    hint: "Sets how deep the darkest tone sits.",
  },
  {
    key: "splitTone",
    label: "Split Tone",
    min: -100,
    max: 100,
    step: 1,
    hint: "Negative pushes teal shadows, positive warm highlights.",
  },
  {
    key: "sharpness",
    label: "Sharpness",
    min: 0,
    max: 100,
    step: 1,
    hint: "Local-contrast clarity — approximated in the live preview.",
  },
  {
    key: "clarity",
    label: "Clarity",
    min: -100,
    max: 100,
    step: 1,
    hint: "Midtone contrast — punchier or flatter detail.",
  },
  {
    key: "soften",
    label: "Soften Details",
    min: 0,
    max: 100,
    step: 1,
    hint: "Gentle diffusion for skin and fine texture.",
  },
  {
    key: "texture",
    label: "Texture",
    min: -100,
    max: 100,
    step: 1,
    hint: "Fine surface detail — smooths or emphasises micro texture.",
  },
  {
    key: "bloom",
    label: "Bloom",
    min: 0,
    max: 100,
    step: 1,
    hint: "Soft glow spilling out of the brightest areas.",
  },
  {
    key: "bloomThreshold",
    label: "Threshold",
    min: 0,
    max: 100,
    step: 1,
    hint: "How bright an area must be before it blooms.",
  },
  {
    key: "bloomRadius",
    label: "Radius",
    min: 0,
    max: 100,
    step: 1,
    hint: "How far the glow spreads.",
  },
  {
    key: "halation",
    label: "Halation",
    min: 0,
    max: 100,
    step: 1,
    hint: "Warm red halo around highlights, like film.",
  },
  {
    key: "halationRadius",
    label: "Radius",
    min: 0,
    max: 100,
    step: 1,
    hint: "Size of the halo around highlights.",
  },
  {
    key: "halationWarmth",
    label: "Warmth",
    min: 0,
    max: 100,
    step: 1,
    hint: "Colour of the halo, from amber to deep red.",
  },
  {
    key: "lensHaze",
    label: "Lens Haze",
    min: 0,
    max: 100,
    step: 1,
    hint: "Lifted, milky blacks from an uncoated lens.",
  },
  {
    key: "hazeDensity",
    label: "Density",
    min: 0,
    max: 100,
    step: 1,
    hint: "How thick the atmospheric haze reads.",
  },
  {
    key: "hazeTint",
    label: "Tint",
    min: -100,
    max: 100,
    step: 1,
    hint: "Negative cools the haze, positive warms it.",
  },
  {
    key: "grain",
    label: "Film Grain",
    min: 0,
    max: 100,
    step: 1,
    hint: "Adds analogue film noise on top of the grade.",
  },
  {
    key: "grainSize",
    label: "Size",
    min: 0,
    max: 100,
    step: 1,
    hint: "Coarseness of the grain particles.",
  },
  {
    key: "grainRoughness",
    label: "Roughness",
    min: 0,
    max: 100,
    step: 1,
    hint: "How harsh and contrasty the grain looks.",
  },
];

export const NEUTRAL: Adjustments = {
  temperature: 0,
  tint: 0,
  exposure: 0,
  gamma: 0,
  fade: 0,
  contrast: 0,
  saturation: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  splitTone: 0,
  sharpness: 0,
  clarity: 0,
  soften: 0,
  texture: 0,
  bloom: 0,
  bloomThreshold: 50,
  bloomRadius: 50,
  halation: 0,
  halationRadius: 50,
  halationWarmth: 50,
  lensHaze: 0,
  hazeDensity: 50,
  hazeTint: 0,
  grain: 0,
  grainSize: 50,
  grainRoughness: 50,
};

export const ADJUSTMENT_KEYS = Object.keys(NEUTRAL) as AdjustmentKey[];

/** Every effect is on by default; toggling one off is an explicit user action. */
export const DEFAULT_ENABLED: EffectToggles = ADJUSTMENT_KEYS.reduce((acc, key) => {
  acc[key] = true;
  return acc;
}, {} as EffectToggles);

/** Values actually applied: disabled effects fall back to their neutral value. */
export function effectiveAdjustments(a: Adjustments, enabled: EffectToggles): Adjustments {
  const out = { ...a };
  for (const key of ADJUSTMENT_KEYS) {
    if (!enabled[key]) out[key] = NEUTRAL[key];
  }
  return out;
}

export function allEnabled(enabled: EffectToggles) {
  return ADJUSTMENT_KEYS.every((k) => enabled[k]);
}

export interface Preset {
  id: string;
  name: string;
  values: Adjustments;
}

const p = (v: Partial<Adjustments>): Adjustments => ({ ...NEUTRAL, ...v });

/** 24 working presets — names and values are meant to be easy to replace. */
export const PRESETS: Preset[] = [
  { id: "natural", name: "Natural", values: p({}) },
  {
    id: "split-tone",
    name: "Split Tone",
    values: p({ temperature: -22, contrast: 18, saturation: 16, highlights: 18, splitTone: 45 }),
  },
  {
    id: "soft-skin",
    name: "Soft Skin",
    values: p({ temperature: 14, contrast: -12, saturation: -6, exposure: 8, soften: 26 }),
  },
  {
    id: "old-lens",
    name: "Old Lens",
    values: p({
      temperature: 20,
      contrast: -8,
      saturation: -22,
      highlights: 14,
      grain: 30,
      lensHaze: 28,
    }),
  },
  {
    id: "16mm",
    name: "16mm",
    values: p({
      temperature: 10,
      contrast: 16,
      saturation: -10,
      grain: 55,
      sharpness: 20,
      halation: 24,
    }),
  },
  {
    id: "warm-film",
    name: "Warm Film",
    values: p({ temperature: 38, contrast: 12, saturation: 10, grain: 18, halation: 18 }),
  },
  {
    id: "cool-cinema",
    name: "Cool Cinema",
    values: p({ temperature: -42, contrast: 20, saturation: -8, highlights: -14, shadows: -10 }),
  },
  {
    id: "teal-orange",
    name: "Teal & Orange",
    values: p({ temperature: 26, contrast: 26, saturation: 28, highlights: -10, splitTone: 60 }),
  },
  {
    id: "faded-film",
    name: "Faded Film",
    values: p({
      temperature: -6,
      contrast: -26,
      saturation: -18,
      highlights: 24,
      grain: 22,
      lensHaze: 34,
    }),
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    values: p({ contrast: 52, saturation: 12, highlights: -18, sharpness: 34, blacks: -30 }),
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    values: p({
      temperature: 52,
      exposure: 10,
      contrast: 10,
      saturation: 18,
      highlights: 16,
      bloom: 26,
      halation: 22,
    }),
  },
  {
    id: "bleach-bypass",
    name: "Bleach Bypass",
    values: p({ contrast: 46, saturation: -52, highlights: 20, blacks: -24, sharpness: 30 }),
  },
  {
    id: "film-noir",
    name: "Film Noir",
    values: p({ contrast: 58, saturation: -100, highlights: -12, blacks: -40, grain: 34 }),
  },
  {
    id: "kodak-portrait",
    name: "Kodak Portrait",
    values: p({ temperature: 22, tint: 10, contrast: 8, saturation: 12, soften: 16, grain: 12 }),
  },
  {
    id: "fuji-film",
    name: "Fuji Film",
    values: p({ temperature: -10, tint: -18, contrast: 14, saturation: 8, shadows: 12, grain: 16 }),
  },
  {
    id: "vintage-fade",
    name: "Vintage Fade",
    values: p({
      temperature: 16,
      contrast: -30,
      saturation: -24,
      shadows: 26,
      blacks: 34,
      grain: 26,
    }),
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    values: p({ temperature: -48, tint: 38, contrast: 34, saturation: 42, bloom: 30, blacks: -22 }),
  },
  {
    id: "moody-green",
    name: "Moody Green",
    values: p({ temperature: -18, tint: -44, contrast: 22, saturation: -14, shadows: -20 }),
  },
  {
    id: "desert-heat",
    name: "Desert Heat",
    values: p({ temperature: 58, contrast: 20, saturation: 16, highlights: 12, lensHaze: 18 }),
  },
  {
    id: "pastel",
    name: "Pastel",
    values: p({
      temperature: 8,
      tint: 12,
      contrast: -22,
      saturation: -12,
      exposure: 14,
      shadows: 24,
      soften: 20,
    }),
  },
  {
    id: "matte",
    name: "Matte",
    values: p({ contrast: -18, saturation: -10, blacks: 40, lensHaze: 22 }),
  },
  {
    id: "deep-blue",
    name: "Deep Blue",
    values: p({ temperature: -62, contrast: 26, saturation: -6, shadows: -18, blacks: -20 }),
  },
  {
    id: "sunset",
    name: "Sunset",
    values: p({
      temperature: 46,
      tint: 20,
      contrast: 16,
      saturation: 26,
      highlights: 18,
      halation: 26,
    }),
  },
  {
    id: "clean-editorial",
    name: "Clean Editorial",
    values: p({ temperature: -8, contrast: 12, saturation: -4, whites: 18, sharpness: 26 }),
  },
];

/** Tint colours are image-processing constants, not UI theme colours. */
const WARM_TINT = "255, 150, 60";
const COOL_TINT = "60, 150, 255";
const GREEN_TINT = "90, 220, 120";
const MAGENTA_TINT = "230, 90, 200";
const HALATION_TINT = "255, 80, 40";

export interface Overlay {
  color: string;
  blend: "soft-light" | "overlay" | "screen" | "multiply";
  opacity: number;
}

export interface RenderLayers {
  filter: string;
  overlays: Overlay[];
  grainOpacity: number;
  /** Tile size of the grain pattern in px. */
  grainSize: number;
}

export function buildLayers(a: Adjustments): RenderLayers {
  const bloomSpread = 0.5 + a.bloomRadius / 200;
  const bloomGate = 1 - a.bloomThreshold / 200;
  const bloomAmount = a.bloom * bloomGate * bloomSpread;
  const hazeAmount = a.lensHaze * (0.5 + a.hazeDensity / 100);
  const halationAmount = a.halation * (0.6 + a.halationRadius / 250);
  const brightness = 1 + a.exposure / 250 + a.gamma / 500 + bloomAmount / 900 + a.fade / 900;
  // Sharpness is approximated with a local-contrast lift (CSS has no unsharp mask).
  const contrast =
    1 +
    a.contrast / 160 +
    a.sharpness / 600 +
    a.clarity / 500 +
    a.texture / 900 -
    a.gamma / 700 -
    a.fade / 260 -
    a.blacks / 700 -
    hazeAmount / 500 +
    a.whites / 700;
  const saturate = Math.max(0, 1 + a.saturation / 100);
  const blur = Math.max(0, a.soften / 90 - Math.max(0, a.texture) / 400);

  const overlays: Overlay[] = [];
  const push = (color: string, blend: Overlay["blend"], opacity: number) => {
    if (opacity > 0.001) overlays.push({ color, blend, opacity });
  };

  if (a.temperature !== 0) {
    push(
      a.temperature > 0 ? WARM_TINT : COOL_TINT,
      "soft-light",
      Math.min(0.6, Math.abs(a.temperature) / 140),
    );
  }
  if (a.tint !== 0) {
    push(
      a.tint > 0 ? MAGENTA_TINT : GREEN_TINT,
      "soft-light",
      Math.min(0.5, Math.abs(a.tint) / 180),
    );
  }
  if (a.highlights !== 0) {
    push(
      a.highlights > 0 ? "255, 255, 255" : "0, 0, 0",
      "overlay",
      Math.min(0.45, Math.abs(a.highlights) / 260),
    );
  }
  if (a.shadows !== 0) {
    push(
      a.shadows > 0 ? "255, 255, 255" : "0, 0, 0",
      "soft-light",
      Math.min(0.45, Math.abs(a.shadows) / 240),
    );
  }
  if (a.splitTone !== 0) {
    push(
      a.splitTone > 0 ? WARM_TINT : COOL_TINT,
      "overlay",
      Math.min(0.3, Math.abs(a.splitTone) / 320),
    );
    push(
      a.splitTone > 0 ? COOL_TINT : WARM_TINT,
      "multiply",
      Math.min(0.16, Math.abs(a.splitTone) / 620),
    );
  }
  if (bloomAmount > 0) push("255, 255, 255", "screen", Math.min(0.3, bloomAmount / 420));
  if (halationAmount > 0) {
    const warm = a.halationWarmth / 100;
    const halo = `${Math.round(230 + warm * 25)}, ${Math.round(120 - warm * 60)}, ${Math.round(90 - warm * 60)}`;
    push(halo, "screen", Math.min(0.28, halationAmount / 460));
  }
  if (hazeAmount > 0) {
    const haze =
      a.hazeTint === 0
        ? "255, 255, 255"
        : a.hazeTint > 0
          ? `255, ${Math.round(255 - a.hazeTint * 0.5)}, ${Math.round(255 - a.hazeTint * 0.9)}`
          : `${Math.round(255 + a.hazeTint * 0.9)}, ${Math.round(255 + a.hazeTint * 0.4)}, 255`;
    push(haze, "soft-light", Math.min(0.35, hazeAmount / 300));
  }
  if (a.fade > 0) push("255, 255, 255", "screen", Math.min(0.22, a.fade / 500));

  const filter = [
    `brightness(${brightness.toFixed(3)})`,
    `contrast(${Math.max(0.2, contrast).toFixed(3)})`,
    `saturate(${saturate.toFixed(3)})`,
    blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    filter,
    overlays,
    grainOpacity: (a.grain / 100) * 0.35 * (0.6 + a.grainRoughness / 125),
    grainSize: 90 + a.grainSize * 1.4,
  };
}

/** Tiny tiling SVG noise used for the film-grain layer. */
export const GRAIN_URL =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='140' height='140' filter='url(%23n)' opacity='0.55'/></svg>\")";

export function isNeutral(a: Adjustments) {
  return ADJUSTMENT_KEYS.every((k) => a[k] === NEUTRAL[k]);
}

export function sameValues(a: Adjustments, b: Adjustments) {
  return ADJUSTMENT_KEYS.every((k) => a[k] === b[k]);
}
