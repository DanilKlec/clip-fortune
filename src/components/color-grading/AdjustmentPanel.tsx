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
    <div className="space-y-4">
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

      {ADJUSTMENTS.map((spec) => {
        const value = values[spec.key];
        const changed = value !== NEUTRAL[spec.key];
        const on = enabled[spec.key];
        const bipolar = spec.min < 0;
        return (
          <div key={spec.key}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Switch
                  checked={on}
                  disabled={disabled}
                  onCheckedChange={(next) => onToggle(spec.key, next)}
                  aria-label={`${on ? "Disable" : "Enable"} ${spec.label}`}
                />
                <label
                  htmlFor={`adj-${spec.key}`}
                  className={`truncate text-[13px] font-semibold ${on ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {spec.label}
                </label>
                {spec.hint && (
                  <span
                    tabIndex={0}
                    role="note"
                    title={spec.hint}
                    aria-label={`${spec.label}: ${spec.hint}`}
                    className="shrink-0 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Info size={12} strokeWidth={2} />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="button-meta text-muted-foreground">{on ? value : "off"}</span>
                <button
                  type="button"
                  aria-label={`Reset ${spec.label}`}
                  onClick={() => onResetKey(spec.key)}
                  disabled={disabled || !changed}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw size={13} strokeWidth={2} />
                </button>
              </div>
            </div>
            {on && (
              <div className="relative">
                {bipolar && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-foreground/25"
                  />
                )}
                <Slider
                  id={`adj-${spec.key}`}
                  aria-label={spec.label}
                  aria-valuetext={`${value}`}
                  disabled={disabled}
                  min={spec.min}
                  max={spec.max}
                  step={spec.step}
                  value={[value]}
                  onValueChange={(v) => onChange(spec.key, v[0])}
                  className="mt-1 py-3"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
