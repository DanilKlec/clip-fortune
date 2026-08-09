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
    case "contrast":
      return `Contrast: ${s} ${v > 0 ? "stronger" : "softer"} contrast (${v})`;
    case "saturation":
      return `Saturation: ${s} ${v > 0 ? "more vivid" : "more muted"} colors (${v})`;
    case "highlights":
      return `Highlights: ${s} ${v > 0 ? "brighter, lifted" : "softer, rolled-off"} highlights (${v})`;
    case "exposure":
      return `Exposure: ${s} ${v > 0 ? "brighter" : "darker"} overall exposure (${v})`;
    case "sharpness":
      return `Sharpness: ${s} increased detail clarity (${v})`;
    case "grain":
      return `Film grain: ${s} visible film grain (${v})`;
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
