import { useRef } from "react";
import { Ban, Check } from "lucide-react";
import { PRESETS, type Preset } from "./grading";
import { PRESET_IMAGES } from "./preset-images";

interface Props {
  activeId: string | null;
  onPick: (preset: Preset) => void;
  /** Manual settings differ from the selected preset. */
  custom?: boolean;
}

/**
 * Mobile-only single-row preset carousel. The first card resets to the neutral
 * look; picking a card only changes the local preview (never calls the API).
 */
export function MobilePresetStrip({ activeId, onPick, custom = false }: Props) {
  const none = PRESETS[0];
  const rest = PRESETS.slice(1);
  const noneActive = !custom && activeId === none.id;
  // Horizontal scrolling happens only after an explicit user choice.
  const scrollToPicked = (el: HTMLElement | null) => {
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  };
  const noneRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      style={{ scrollSnapType: "x proximity", touchAction: "pan-x pan-y" }}
      role="group"
      aria-label="Presets"
    >
      <button
        type="button"
        onClick={() => {
          onPick(none);
          scrollToPicked(noneRef.current);
        }}
        aria-pressed={noneActive}
        ref={noneRef}
        style={{ scrollSnapAlign: "start" }}
        className="flex w-[68px] shrink-0 flex-col items-center gap-1 focus-visible:outline-none"
      >
        <span
          className="relative flex h-[52px] w-full items-center justify-center rounded-lg border-2 transition-colors"
          style={{
            borderColor: noneActive ? "var(--volt)" : "var(--card-border)",
            background: "var(--tile)",
          }}
        >
          <Ban
            size={18}
            strokeWidth={2}
            className={noneActive ? "text-volt" : "text-muted-foreground"}
          />
          {noneActive && (
            <span
              aria-hidden
              className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full"
              style={{ background: "var(--volt)" }}
            >
              <Check size={11} strokeWidth={3} className="text-background" />
            </span>
          )}
        </span>
        <span
          className="w-full truncate text-center text-[10px] font-semibold"
          style={{ color: noneActive ? "var(--volt)" : undefined }}
        >
          None
        </span>
      </button>

      {rest.map((preset) => {
        const active = !custom && preset.id === activeId;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={(e) => {
              onPick(preset);
              scrollToPicked(e.currentTarget);
            }}
            aria-pressed={active}
            style={{ scrollSnapAlign: "start" }}
            className="flex w-[68px] shrink-0 flex-col items-center gap-1 focus-visible:outline-none"
          >
            <span
              className="relative block h-[52px] w-full overflow-hidden rounded-lg border-2 transition-colors"
              style={{ borderColor: active ? "var(--volt)" : "var(--card-border)" }}
            >
              <img
                src={PRESET_IMAGES[preset.id]}
                alt={`${preset.name} preview`}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover"
              />
              {active && (
                <span
                  aria-hidden
                  className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full"
                  style={{ background: "var(--volt)" }}
                >
                  <Check size={11} strokeWidth={3} className="text-background" />
                </span>
              )}
            </span>
            <span
              title={preset.name}
              className="w-full truncate text-center text-[10px] font-semibold"
              style={{ color: active ? "var(--volt)" : undefined }}
            >
              {preset.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
