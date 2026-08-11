import { PRESETS, type Preset } from "./grading";
import { PRESET_IMAGES } from "./preset-images";

interface Props {
  activeId: string | null;
  onPick: (preset: Preset) => void;
  /** Manual settings differ from the selected preset. */
  custom?: boolean;
  /** Mobile panel supplies its own section header. */
  hideHeading?: boolean;
}

export function PresetPicker({ activeId, onPick, custom = false, hideHeading = false }: Props) {
  return (
    <div>
      <div className={`flex items-center gap-2 ${hideHeading ? "sr-only" : ""}`}>
        <h3 className="font-display text-[13px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
          Presets
        </h3>
        {(custom || activeId === null) && (
          <span className="badge-volt" aria-live="polite">
            Custom
          </span>
        )}
      </div>
      <div
        className={`grid max-h-[260px] grid-cols-2 gap-2 overflow-y-auto overflow-x-hidden pr-1 min-[360px]:grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 ${hideHeading ? "" : "mt-3"}`}
        style={{ overscrollBehavior: "contain" }}
      >
        {PRESETS.map((preset) => {
          const active = preset.id === activeId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPick(preset)}
              aria-pressed={active}
              className="group min-w-0 overflow-hidden rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                borderColor: active ? "var(--volt)" : "var(--card-border)",
                background: active ? "var(--volt-dim)" : "var(--tile)",
              }}
            >
              <img
                src={PRESET_IMAGES[preset.id]}
                alt={`${preset.name} preview`}
                loading="lazy"
                width={512}
                height={512}
                draggable={false}
                className="h-[62px] w-full object-cover sm:h-[68px]"
              />
              <span
                title={preset.name}
                className="block truncate px-2 py-1.5 text-[11px] font-semibold"
                style={{ color: active ? "var(--volt)" : undefined }}
              >
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
