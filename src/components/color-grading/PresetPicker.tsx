import { PRESETS, type Preset } from "./grading";

interface Props {
  activeId: string | null;
  onPick: (preset: Preset) => void;
}

export function PresetPicker({ activeId, onPick }: Props) {
  return (
    <div>
      <h3 className="font-display text-[13px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
        Presets
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const active = preset.id === activeId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPick(preset)}
              aria-pressed={active}
              className="flex h-11 items-center rounded-full border px-4 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                borderColor: active ? "var(--volt)" : "var(--card-border)",
                background: active ? "var(--volt-dim)" : "var(--tile)",
                color: active ? "var(--volt)" : undefined,
              }}
            >
              {preset.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}