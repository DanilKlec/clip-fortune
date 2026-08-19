import { useEffect, useId, useRef, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

interface Props {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Short caption, e.g. the active mode ("Manual" / "AI"). */
  subtitle: string;
  /** Optional action row rendered at the bottom of the open panel. */
  actions?: ReactNode;
}

/**
 * Mobile-only compact Color Grading card. Closed it is a single 52px row with
 * icon, title, active-mode caption and a chevron. Open it expands in the normal
 * page flow — no internal scroll container.
 */
export function MobileControlPanel({ open, onToggle, children, subtitle, actions }: Props) {
  const id = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (wasOpen.current && !open) btnRef.current?.focus();
    if (!wasOpen.current && open) {
      requestAnimationFrame(() =>
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      );
    }
    wasOpen.current = open;
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="glass flex min-w-0 flex-col overflow-hidden rounded-2xl"
      style={{
        boxShadow: "var(--shadow-card)",
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          onToggle();
        }
      }}
    >
      <button
        ref={btnRef}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex h-[52px] w-full shrink-0 items-center gap-3 px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--volt-dim)" }}
        >
          <SlidersHorizontal size={16} strokeWidth={2} className="text-volt" />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="font-display block truncate text-[13px] font-extrabold uppercase tracking-[0.12em] text-foreground">
            Color Grading Controls
          </span>
          <span className="block truncate text-[11px] font-medium text-muted-foreground">
            {subtitle}
          </span>
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2}
          aria-hidden
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div
            id={id}
            className="space-y-4 border-t px-3 pb-4 pt-3"
            style={{ borderColor: "var(--card-border)" }}
          >
            {children}
          </div>
          {actions && (
            <div
              className="flex items-center gap-2 border-t px-3 py-2.5"
              style={{ borderColor: "var(--card-border)", background: "var(--tile)" }}
            >
              {actions}
            </div>
          )}
        </>
      )}
    </div>
  );
}
