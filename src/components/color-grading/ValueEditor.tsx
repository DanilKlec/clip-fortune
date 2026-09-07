import { EyeIcon } from "./param-icons";
import { TrackSlider } from "./TrackSlider";
import { GROUP_OF } from "./groups";
import { ADJUSTMENTS, NEUTRAL, type AdjustmentKey } from "./grading";

interface Props {
  paramKey: AdjustmentKey;
  value: number;
  enabled: boolean;
  onChange: (value: number) => void;
  onToggle: (on: boolean) => void;
  onReset: () => void;
  onCancel: () => void;
  onApply: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const SPEC = new Map(ADJUSTMENTS.map((s) => [s.key, s]));

/** Mobile single-parameter editor — replaces the panel while editing. */
export function ValueEditor({
  paramKey,
  value,
  enabled,
  onChange,
  onToggle,
  onReset,
  onCancel,
  onApply,
  onDragStart,
  onDragEnd,
}: Props) {
  const spec = SPEC.get(paramKey)!;
  const group = GROUP_OF[paramKey];
  const label = group?.labels?.[paramKey] ?? spec.label;
  const moved = value !== NEUTRAL[paramKey];
  const shown = Math.round(value);

  return (
    <div
      className={`cg-editor cg-on${moved ? " cg-moved" : ""}${enabled ? "" : " cg-eye-off"}`}
      role="group"
      aria-label={`${group?.label ?? ""} ${label}`}
    >
      <div className="cg-top">
        <button type="button" className="cg-link" onClick={onReset} disabled={!moved}>
          reset
        </button>
        <button
          type="button"
          className="cg-icon-btn cg-eye"
          aria-pressed={enabled}
          aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
          onClick={() => onToggle(!enabled)}
        >
          <EyeIcon on={enabled} size={20} />
        </button>
      </div>
      <div className="cg-mid">
        <div className="cg-num" aria-live="polite">
          {spec.min < 0 && shown > 0 ? "+" : ""}
          {shown}
        </div>
        <TrackSlider
          label={label}
          value={value}
          min={spec.min}
          max={spec.max}
          step={spec.step}
          def={NEUTRAL[paramKey]}
          disabled={!enabled}
          onChange={onChange}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      </div>
      <div className="cg-bot">
        <button type="button" className="cg-icon-btn" aria-label="Cancel" onClick={onCancel}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <div className="cg-name">
          {(group?.label ?? "").toUpperCase()} · {label.toUpperCase()}
        </div>
        <button type="button" className="cg-icon-btn cg-ok" aria-label="Apply" onClick={onApply}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
