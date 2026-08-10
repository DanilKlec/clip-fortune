import { useEffect, useId, useRef, type ReactNode } from "react";
import { ChevronDown, Palette } from "lucide-react";

interface Props {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Sticky action bar kept visible while the content scrolls. */
  actions: ReactNode;
}

/**
 * Mobile-only compact Color Grading card. Closed it is a single 56–64px row;
 * open it becomes a self-scrolling panel capped at 75dvh with a pinned footer.
 */
export function MobileControlPanel({ open, onToggle, children, actions }: Props) {
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
        maxHeight: open ? "75dvh" : undefined,
        minHeight: 0,
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
        className="flex h-14 w-full shrink-0 items-center gap-3 px-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--volt-dim)" }}
        >
          <Palette size={16} strokeWidth={2} className="text-volt" />
        </span>
        <span className="font-display min-w-0 flex-1 truncate text-[13px] font-extrabold uppercase tracking-[0.14em] text-foreground">
          Color Grading
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2}
          aria-hidden
          className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
          <div
            id={id}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden border-t px-3 pb-4 pt-3"
            style={{ borderColor: "var(--card-border)", overscrollBehavior: "contain" }}
          >
            {children}
          </div>
      )}

      <div
        className="flex shrink-0 items-center gap-2 border-t px-3 py-2.5"
        style={{ borderColor: "var(--card-border)", background: "var(--tile)" }}
      >
        {actions}
      </div>
    </div>
  );
}
