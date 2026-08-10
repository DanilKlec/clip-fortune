import { Info, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
}

export function AdjustmentPanel({
  values,
  enabled,
  disabled = false,
  onChange,
  onToggle,
  onResetKey,
  onResetAll,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
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

      <div className="grid grid-cols-1 gap-2">
      {ADJUSTMENTS.map((spec) => {
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
              aria-label={`${on ? "Disable" : "Enable"} ${spec.label}`}
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
                  background: on ? "var(--volt-dim)" : "var(--card-border)",
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
                  <span className="truncate">{spec.label}</span>
                  {spec.hint && (
                    <span title={spec.hint} aria-hidden className="shrink-0 text-muted-foreground">
                      <Info size={11} strokeWidth={2} />
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground">
                  {on ? value : "off"}
                </span>
              </div>
              <Slider
                id={`adj-${spec.key}`}
                aria-label={`${spec.label}${spec.hint ? `: ${spec.hint}` : ""}`}
                aria-valuetext={`${value}`}
                disabled={disabled || !on}
                min={spec.min}
                max={spec.max}
                step={spec.step}
                value={[value]}
                onValueChange={(v) => onChange(spec.key, v[0])}
                className="cg-slider"
              />
            </div>
            <button
              type="button"
              aria-label={`Reset ${spec.label}`}
              onClick={() => onResetKey(spec.key)}
              disabled={disabled || !changed}
              className="cg-tray-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw size={12} strokeWidth={2} />
            </button>
          </div>
        );
      })}
      </div>
    </div>
  );
}
