import { GradedImage } from "./GradedImage";
import { PRESETS, type Preset } from "./grading";

interface Props {
  activeId: string | null;
  onPick: (preset: Preset) => void;
  /** Preview source: the active user image, or the local demo photo. */
  previewSrc: string;
}

export function PresetPicker({ activeId, onPick, previewSrc }: Props) {
  return (
    <div>
      <h3 className="font-display text-[13px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
        Presets
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
              <GradedImage
                src={previewSrc}
                alt={`${preset.name} preview`}
                adjustments={preset.values}
                className="w-full"
                imgClassName="h-[74px] w-full object-cover sm:h-[84px]"
              />
              <span
                className="block truncate px-2 py-2 text-[12px] font-semibold"
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