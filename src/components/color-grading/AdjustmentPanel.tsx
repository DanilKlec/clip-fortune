import { Info, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { SliderVariant } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CollapsibleSection } from "./CollapsibleSection";
import {
  ADJUSTMENTS,
  NEUTRAL,
  type AdjustmentKey,
  type Adjustments,
  type EffectToggles,
} from "./grading";

interface Props {
  values: Adjustments;
  enabled: EffectToggles;
  disabled?: boolean;
  onChange: (key: AdjustmentKey, value: number) => void;
  onToggle: (key: AdjustmentKey, on: boolean) => void;
  onResetKey: (key: AdjustmentKey) => void;
  onResetAll: () => void;
  /** Mobile mode: split the effects into collapsible groups. */
  grouped?: boolean;
  /** Hide the internal "Reset all" (mobile keeps it in the sticky action bar). */
  hideResetAll?: boolean;
  openGroups?: Record<string, boolean>;
  onToggleGroup?: (id: string) => void;
}

/** Purpose-based groups — every parameter appears exactly once. */
const GROUPS: {
  id: string;
  label: string;
  keys: AdjustmentKey[];
  /** Design-system accent used for the fill, thumb ring and focus ring. */
  accent: SliderVariant;
  /** Effect groups get a master switch in the header. */
  effect?: boolean;
  /** Short in-group labels, e.g. "Amount" instead of "Bloom". */
  labels?: Partial<Record<AdjustmentKey, string>>;
}[] = [
  {
    id: "color",
    label: "Color Correct",
    accent: "volt",
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
  { id: "exposure", label: "Exposure", accent: "sky", keys: ["exposure", "gamma", "fade"] },
  {
    id: "details",
    label: "Soften Details",
    accent: "plasma",
    keys: ["sharpness", "clarity", "soften", "texture"],
  },
  {
    id: "bloom",
    label: "Bloom",
    accent: "plasma",
    effect: true,
    keys: ["bloom", "bloomThreshold", "bloomRadius"],
    labels: { bloom: "Amount" },
  },
  {
    id: "halation",
    label: "Halation",
    accent: "volt",
    effect: true,
    keys: ["halation", "halationRadius", "halationWarmth"],
    labels: { halation: "Amount" },
  },
  {
    id: "haze",
    label: "Lens Haze",
    accent: "sky",
    effect: true,
    keys: ["lensHaze", "hazeDensity", "hazeTint"],
    labels: { lensHaze: "Amount" },
  },
  {
    id: "grain",
    label: "Film Grain",
    accent: "volt",
    effect: true,
    keys: ["grain", "grainSize", "grainRoughness"],
    labels: { grain: "Amount" },
  },
];

/** Low-opacity companion token for each accent, used for the filled block. */
const ACCENT_DIM: Record<SliderVariant, string> = {
  volt: "var(--volt-dim)",
  primary: "var(--volt-dim)",
  sky: "var(--sky-dim)",
  plasma: "var(--plasma-dim)",
};

export function AdjustmentPanel({
  values,
  enabled,
  disabled = false,
  onChange,
  onToggle,
  onResetKey,
  onResetAll,
  grouped = false,
  hideResetAll = false,
  openGroups,
  onToggleGroup,
}: Props) {
  const rowFor = (key: AdjustmentKey, labelOverride?: string, accent: SliderVariant = "volt") => {
    const spec = ADJUSTMENTS.find((s) => s.key === key)!;
    const label = labelOverride ?? spec.label;
    const value = values[spec.key];
    const changed = value !== NEUTRAL[spec.key];
    const on = enabled[spec.key];
    const bipolar = spec.min < 0;
    const pct = ((value - spec.min) / (spec.max - spec.min)) * 100;
    const originPct = bipolar ? 50 : 0;
    const fillLeft = Math.min(originPct, pct);
    const fillWidth = Math.abs(pct - originPct);
    return (
      <div key={spec.key} className="flex min-w-0 items-center gap-1.5">
        <Switch
          checked={on}
          disabled={disabled}
          onCheckedChange={(next) => onToggle(spec.key, next)}
          aria-label={`${on ? "Disable" : "Enable"} ${label}`}
          className="cg-switch"
        />
        <div
          className={`relative h-10 min-w-0 flex-1 overflow-hidden rounded-lg border ${on ? "" : "opacity-60"}`}
          style={{ borderColor: "var(--card-border)", background: "var(--tile)" }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0"
            style={{
              left: `${fillLeft}%`,
              width: `${fillWidth}%`,
              background: on ? ACCENT_DIM[accent] : "var(--card-border)",
            }}
          />
          {bipolar && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-foreground/20"
            />
          )}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between gap-1.5 px-2.5">
            <span
              className={`flex min-w-0 items-center gap-1 truncate text-[12px] font-semibold ${on ? "text-foreground" : "text-muted-foreground"}`}
            >
              <span className="truncate" title={label}>
                {label}
              </span>
              {spec.hint && (
                <span title={spec.hint} aria-hidden className="shrink-0 text-muted-foreground">
                  <Info size={11} strokeWidth={2} />
                </span>
              )}
            </span>
            <span className="font-mono shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
              {on ? value : "off"}
            </span>
          </div>
          <Slider
            id={`adj-${spec.key}`}
            aria-label={`${label}${spec.hint ? `: ${spec.hint}` : ""}`}
            aria-valuetext={`${value}`}
            disabled={disabled || !on}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            value={[value]}
            onValueChange={(v) => onChange(spec.key, v[0])}
            variant={accent}
            className="cg-slider"
          />
        </div>
        <button
          type="button"
          aria-label={`Reset ${label}`}
          onClick={() => onResetKey(spec.key)}
          disabled={disabled || !changed}
          className="cg-tray-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw size={12} strokeWidth={2} />
        </button>
      </div>
    );
  };

  if (grouped) {
    return (
      <div className="space-y-2">
        {GROUPS.map((group) => {
          const open = openGroups?.[group.id] ?? false;
          const effectOn = group.effect ? group.keys.some((k) => enabled[k]) : undefined;
          return (
            <CollapsibleSection
              key={group.id}
              id={group.id}
              label={group.label}
              open={open}
              onToggle={() => onToggleGroup?.(group.id)}
              disabled={disabled}
              effectOn={effectOn}
              onEffectToggle={
                group.effect ? (next) => group.keys.forEach((k) => onToggle(k, next)) : undefined
              }
            >
              {group.keys.map((k) => rowFor(k, group.labels?.[k], group.accent))}
            </CollapsibleSection>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-between ${hideResetAll ? "hidden" : ""}`}>
        <h3 className="font-display text-[13px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
          Adjustments
        </h3>
        <button
          type="button"
          onClick={onResetAll}
          disabled={disabled}
          className="button-utility flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw size={13} strokeWidth={2} />
          Reset all
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">{ADJUSTMENTS.map((spec) => rowFor(spec.key))}</div>
    </div>
  );
}
