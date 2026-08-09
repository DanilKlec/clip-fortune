import { RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { ADJUSTMENTS, NEUTRAL, type AdjustmentKey, type Adjustments } from "./grading";

interface Props {
  values: Adjustments;
  onChange: (key: AdjustmentKey, value: number) => void;
  onResetKey: (key: AdjustmentKey) => void;
  onResetAll: () => void;
}

export function AdjustmentPanel({ values, onChange, onResetKey, onResetAll }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[13px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
          Adjustments
        </h3>
        <button
          type="button"
          onClick={onResetAll}
          className="button-utility flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw size={13} strokeWidth={2} />
          Reset all
        </button>
      </div>

      {ADJUSTMENTS.map((spec) => {
        const value = values[spec.key];
        const changed = value !== NEUTRAL[spec.key];
        return (
          <div key={spec.key}>
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`adj-${spec.key}`}
                className="text-[13px] font-semibold text-foreground"
              >
                {spec.label}
              </label>
              <div className="flex items-center gap-1">
                <span className="button-meta text-muted-foreground">{value}</span>
                <button
                  type="button"
                  aria-label={`Reset ${spec.label}`}
                  onClick={() => onResetKey(spec.key)}
                  disabled={!changed}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw size={13} strokeWidth={2} />
                </button>
              </div>
            </div>
            <Slider
              id={`adj-${spec.key}`}
              aria-label={spec.label}
              min={spec.min}
              max={spec.max}
              step={spec.step}
              value={[value]}
              onValueChange={(v) => onChange(spec.key, v[0])}
              className="mt-1 py-3"
            />
          </div>
        );
      })}
    </div>
  );
}
