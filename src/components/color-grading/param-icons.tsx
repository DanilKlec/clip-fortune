/** Parameter glyphs ported 1:1 from the workspace design reference. */
import type { AdjustmentKey } from "./grading";

const ICONS: Record<string, string> = {
  temperature:
    '<path d="M12.5 14.6V6.4a2 2 0 1 0-4 0v8.2a3.6 3.6 0 1 0 4 0Z"/><circle cx="17.4" cy="7.6" r="1.6"/>',
  tint: '<circle cx="12" cy="12" r="7"/><path d="M5.3 9.6h13.4"/><path d="M5.3 14.4h13.4"/><path d="M12 5v14"/>',
  contrast:
    '<circle cx="12" cy="12" r="7.2"/><path d="M12 4.8a7.2 7.2 0 0 1 0 14.4Z" fill="currentColor" stroke="none"/>',
  saturation: '<path d="M12 4.5c3.2 3.4 5 5.8 5 8a5 5 0 0 1-10 0c0-2.2 1.8-4.6 5-8Z"/>',
  highlights:
    '<rect x="4.8" y="4.8" width="14.4" height="14.4" rx="3"/><path d="M12 6.2h4.2a1.8 1.8 0 0 1 1.8 1.8v8a1.8 1.8 0 0 1-1.8 1.8H12Z" fill="currentColor" stroke="none"/>',
  shadows:
    '<rect x="4.8" y="4.8" width="14.4" height="14.4" rx="3"/><path d="M8.4 8.6h7.2"/><path d="M8.4 12h7.2"/><path d="M8.4 15.4h7.2"/>',
  whites:
    '<path d="M5 16v-2.5"/><path d="M12 16v-5.5"/><path d="M19 16V6.5"/><path d="M4 19.5h16"/>',
  blacks:
    '<path d="M5 16V6.5"/><path d="M12 16v-5.5"/><path d="M19 16v-2.5"/><path d="M4 19.5h16"/>',
  splittone: '<circle cx="9.5" cy="12" r="5.5"/><circle cx="14.5" cy="12" r="5.5"/>',
  exposure:
    '<circle cx="12" cy="12" r="4"/><path d="M12 3.6v2"/><path d="M12 18.4v2"/><path d="M3.6 12h2"/><path d="M18.4 12h2"/><path d="m6.1 6.1 1.4 1.4"/><path d="m16.5 16.5 1.4 1.4"/><path d="m17.9 6.1-1.4 1.4"/><path d="m7.5 16.5-1.4 1.4"/>',
  gamma: '<path d="M4 19c9 0 7-14 16-14"/>',
  fade: '<path d="M12 4.8a7.2 7.2 0 0 1 0 14.4Z" fill="currentColor" stroke="none"/><path d="M7.6 8.4v7.2"/><path d="M5 10v4"/><circle cx="12" cy="12" r="7.2"/>',
  sharpness: '<path d="M12 5 19.5 18.5h-15Z"/>',
  clarity: '<circle cx="12" cy="12" r="7"/><path d="M6.9 17.1 17.1 6.9"/>',
  soften: '<circle cx="12" cy="12" r="7" stroke-dasharray="2 2.6"/><circle cx="12" cy="12" r="3"/>',
  texture:
    '<path d="M4.5 9.5h15"/><path d="M4.5 14.5h15"/><path d="M9.5 4.5v15"/><path d="M14.5 4.5v15"/>',
  bloom:
    '<circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="7.5" stroke-dasharray="2 2.4"/>',
  threshold: '<rect x="4.5" y="6.5" width="15" height="11" rx="2.5"/><path d="M12 6.5v11"/>',
  radius:
    '<circle cx="12" cy="12" r="7" stroke-dasharray="2 2.4"/><path d="M12 12h6.5"/><circle cx="12" cy="12" r="1.25"/>',
  halation: '<circle cx="12" cy="12" r="4"/><path d="M12 4.6a7.4 7.4 0 0 1 0 14.8"/>',
  warmth:
    '<circle cx="12" cy="12" r="4.5"/><path d="m18.6 8.2 2.1-1"/><path d="M18.9 12h2.3"/><path d="m18.6 15.8 2.1 1"/>',
  haze: '<path d="M4 8.5h16"/><path d="M6 12.5h12"/><path d="M8.5 16.5h7"/>',
  density:
    '<path d="M4 7.5h16"/><path d="M4 12h16" stroke-dasharray="3.2 2.2"/><path d="M4 16.5h16" stroke-dasharray="1.6 2.2"/>',
  grain:
    '<circle cx="12" cy="12" r="7.4"/><circle cx="9.4" cy="10" r=".9" fill="currentColor"/><circle cx="13.6" cy="9.2" r=".7" fill="currentColor"/><circle cx="15" cy="13" r=".9" fill="currentColor"/><circle cx="10.6" cy="14.4" r=".8" fill="currentColor"/><circle cx="12.4" cy="12" r=".6" fill="currentColor"/>',
  size: '<path d="M14.5 4.5H20V10"/><path d="M9.5 19.5H4V14"/><path d="M20 4.5 14.5 10"/><path d="M4 19.5 9.5 14"/>',
  roughness: '<path d="m3.5 14.5 3-4.5 3 4.5 3-6.5 3 6.5 3-4.5 2.5 4.5"/>',
};

/** Which glyph each adjustment uses. */
const PARAM_ICON: Record<AdjustmentKey, string> = {
  temperature: "temperature",
  tint: "tint",
  exposure: "exposure",
  gamma: "gamma",
  fade: "fade",
  contrast: "contrast",
  saturation: "saturation",
  highlights: "highlights",
  shadows: "shadows",
  whites: "whites",
  blacks: "blacks",
  splitTone: "splittone",
  sharpness: "sharpness",
  clarity: "clarity",
  soften: "soften",
  texture: "texture",
  bloom: "bloom",
  bloomThreshold: "threshold",
  bloomRadius: "radius",
  halation: "halation",
  halationRadius: "radius",
  halationWarmth: "warmth",
  lensHaze: "haze",
  hazeDensity: "density",
  hazeTint: "tint",
  grain: "grain",
  grainSize: "size",
  grainRoughness: "roughness",
};

export function ParamIcon({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: ICONS[name] ?? "" }}
    />
  );
}

export function AdjustmentIcon({ paramKey, size }: { paramKey: AdjustmentKey; size?: number }) {
  return <ParamIcon name={PARAM_ICON[paramKey]} size={size} />;
}

export function EyeIcon({ on, size = 20 }: { on: boolean; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {on ? (
        <>
          <path d="M2.1 12.3a1 1 0 0 1 0-.7 10.7 10.7 0 0 1 19.8 0 1 1 0 0 1 0 .7 10.7 10.7 0 0 1-19.8 0" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M10.7 5.1a10.7 10.7 0 0 1 11.2 6.5 1 1 0 0 1 0 .7 10.7 10.7 0 0 1-1.4 2.5" />
          <path d="M14.1 14.2a3 3 0 0 1-4.2-4.2" />
          <path d="M17.5 17.5a10.8 10.8 0 0 1-15.4-5.2 1 1 0 0 1 0-.7 10.8 10.8 0 0 1 4.4-5.1" />
          <path d="m2 2 20 20" />
        </>
      )}
    </svg>
  );
}

export function ResetIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
