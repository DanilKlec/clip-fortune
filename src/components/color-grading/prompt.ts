import { NEUTRAL, PRESETS, type Adjustments } from "./grading";

const SYSTEM = `Apply professional color grading to image 1.

Preserve the original composition, crop, camera angle, subject identity, facial features, body proportions, objects, background structure, logos and readable text. Do not add, remove or replace people or objects. Do not redesign the scene.

Change only the color palette, white balance, exposure, contrast, saturation, highlights, sharpness, tonal response and film grain.`;

function strength(v: number) {
  const a = Math.abs(v);
  if (a >= 66) return "strongly";
  if (a >= 33) return "moderately";
  return "slightly";
}

/** Human-readable description for one adjustment, or null when neutral. */
function describe(key: keyof Adjustments, v: number): string | null {
  if (v === NEUTRAL[key]) return null;
  const s = strength(v);
  switch (key) {
    case "temperature":
      return `Temperature: ${s} ${v > 0 ? "warmer" : "cooler"} white balance (${v})`;
    case "tint":
      return `Tint: ${s} ${v > 0 ? "magenta" : "green"} tint (${v})`;
    case "contrast":
      return `Contrast: ${s} ${v > 0 ? "stronger" : "softer"} contrast (${v})`;
    case "saturation":
      return `Saturation: ${s} ${v > 0 ? "more vivid" : "more muted"} colors (${v})`;
    case "highlights":
      return `Highlights: ${s} ${v > 0 ? "brighter, lifted" : "softer, rolled-off"} highlights (${v})`;
    case "shadows":
      return `Shadows: ${s} ${v > 0 ? "lifted, open" : "deeper, crushed"} shadows (${v})`;
    case "whites":
      return `Whites: ${s} ${v > 0 ? "brighter" : "pulled back"} white point (${v})`;
    case "blacks":
      return `Blacks: ${s} ${v > 0 ? "raised, matte" : "deeper"} black point (${v})`;
    case "splitTone":
      return `Split tone: ${s} ${v > 0 ? "warm highlights with cool shadows" : "cool highlights with warm shadows"} (${v})`;
    case "exposure":
      return `Exposure: ${s} ${v > 0 ? "brighter" : "darker"} overall exposure (${v})`;
    case "gamma":
      return `Gamma: ${s} ${v > 0 ? "lifted" : "lowered"} midtones (${v})`;
    case "fade":
      return `Fade: ${s} faded, milky tonal response (${v})`;
    case "sharpness":
      return `Sharpness: ${s} increased detail clarity (${v})`;
    case "clarity":
      return `Clarity: ${s} ${v > 0 ? "stronger" : "softer"} midtone contrast (${v})`;
    case "soften":
      return `Soften details: ${s} diffused, softened fine detail (${v})`;
    case "texture":
      return `Texture: ${s} ${v > 0 ? "more pronounced" : "smoothed"} fine surface texture (${v})`;
    case "bloom":
      return `Bloom: ${s} soft glow around bright areas (${v})`;
    case "bloomThreshold":
      return `Bloom threshold: glow starts at ${v}% brightness`;
    case "bloomRadius":
      return `Bloom radius: ${v > 50 ? "wide" : "tight"} glow spread (${v})`;
    case "halation":
      return `Halation: ${s} warm red halo around highlights (${v})`;
    case "halationRadius":
      return `Halation radius: ${v > 50 ? "wide" : "tight"} halo (${v})`;
    case "halationWarmth":
      return `Halation warmth: ${v > 50 ? "warmer amber" : "deeper red"} halo (${v})`;
    case "lensHaze":
      return `Lens haze: ${s} hazy, lifted blacks like an uncoated lens (${v})`;
    case "hazeDensity":
      return `Haze density: ${v > 50 ? "thicker" : "thinner"} atmospheric haze (${v})`;
    case "hazeTint":
      return `Haze tint: ${s} ${v > 0 ? "warm" : "cool"} haze colour (${v})`;
    case "grain":
      return `Film grain: ${s} visible film grain (${v})`;
    case "grainSize":
      return `Grain size: ${v > 50 ? "coarse" : "fine"} grain particles (${v})`;
    case "grainRoughness":
      return `Grain roughness: ${v > 50 ? "harsh" : "smooth"} grain (${v})`;
    default:
      return null;
  }
}

export function buildGradePrompt(
  userPrompt: string,
  presetId: string | null,
  a: Adjustments,
): string {
  const presetName = PRESETS.find((p) => p.id === presetId)?.name ?? "Custom";
  const lines = [
    `Requested look: ${userPrompt.trim() || "Professional natural cinematic color grade"}`,
    `Preset: ${presetName}`,
  ];
  for (const key of Object.keys(NEUTRAL) as (keyof Adjustments)[]) {
    const line = describe(key, a[key]);
    if (line) lines.push(line);
  }
  if (lines.length === 2) {
    lines.push("Keep the grade neutral and true to the original colors.");
  }
  return `${SYSTEM}\n\n${lines.join("\n")}`;
}
