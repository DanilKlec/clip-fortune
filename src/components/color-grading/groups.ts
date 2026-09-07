import type { AdjustmentKey } from "./grading";

export interface AdjustGroup {
  id: string;
  label: string;
  /** Effect groups get a master eye toggle. */
  effect: boolean;
  keys: AdjustmentKey[];
  /** Short in-group labels, e.g. "Amount" instead of "Bloom". */
  labels?: Partial<Record<AdjustmentKey, string>>;
}

/** Category layout of the workspace controls. */
export const ADJUST_GROUPS: AdjustGroup[] = [
  {
    id: "color",
    label: "Color correct",
    effect: false,
    keys: [
      "temperature",
      "tint",
      "contrast",
      "saturation",
      "highlights",
      "shadows",
      "whites",
      "blacks",
      "splitTone",
    ],
  },
  { id: "exposure", label: "Exposure", effect: false, keys: ["exposure", "gamma", "fade"] },
  {
    id: "details",
    label: "Soften details",
    effect: false,
    keys: ["sharpness", "clarity", "soften", "texture"],
  },
  {
    id: "bloom",
    label: "Bloom",
    effect: true,
    keys: ["bloom", "bloomThreshold", "bloomRadius"],
    labels: { bloom: "Amount" },
  },
  {
    id: "halation",
    label: "Halation",
    effect: true,
    keys: ["halation", "halationRadius", "halationWarmth"],
    labels: { halation: "Amount" },
  },
  {
    id: "haze",
    label: "Lens haze",
    effect: true,
    keys: ["lensHaze", "hazeDensity", "hazeTint"],
    labels: { lensHaze: "Amount" },
  },
  {
    id: "grain",
    label: "Film grain",
    effect: true,
    keys: ["grain", "grainSize", "grainRoughness"],
    labels: { grain: "Amount" },
  },
];

export const GROUP_OF: Record<string, AdjustGroup> = ADJUST_GROUPS.reduce(
  (acc, g) => {
    g.keys.forEach((k) => (acc[k] = g));
    return acc;
  },
  {} as Record<string, AdjustGroup>,
);
