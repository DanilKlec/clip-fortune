import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Props {
  id: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Effect groups get a master switch next to the title. */
  effectOn?: boolean;
  onEffectToggle?: (on: boolean) => void;
  disabled?: boolean;
}

/** Shared collapsible block used by the presets and every adjustment group. */
export function CollapsibleSection({
  id,
  label,
  open,
  onToggle,
  children,
  effectOn,
  onEffectToggle,
  disabled = false,
}: Props) {
  const hasSwitch = typeof effectOn === "boolean" && Boolean(onEffectToggle);
  return (
    <div
      className="min-w-0 overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--card-border)", background: "var(--tile)" }}
    >
      <div className="flex h-11 min-w-0 items-center gap-2 pr-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`cg-group-${id}`}
          className="flex h-11 min-w-0 flex-1 items-center justify-between gap-2 px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span className="font-display truncate text-[12px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </span>
          <ChevronDown
            size={15}
            strokeWidth={2}
            aria-hidden
            className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {hasSwitch && (
          <Switch
            checked={effectOn}
            disabled={disabled}
            onCheckedChange={(next) => onEffectToggle?.(next)}
            aria-label={`${effectOn ? "Disable" : "Enable"} ${label}`}
            className="cg-switch shrink-0"
          />
        )}
      </div>
      {open && (
        <div id={`cg-group-${id}`} className="min-w-0 space-y-2 px-2 pb-2">
          {children}
        </div>
      )}
    </div>
  );
}
