import type { UsageInfo } from "@/lib/virality-mock";

interface Props {
  open: boolean;
  usage: UsageInfo | null;
  onClose: () => void;
}

export function RateLimitModal({ open, usage, onClose }: Props) {
  if (!open) return null;
  const limit = usage?.limit ?? 5;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "color-mix(in oklab, var(--background) 78%, transparent)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border p-6 text-center"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--card-border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-[22px]"
          style={{ background: "var(--volt-dim)", color: "var(--volt)" }}
        >
          ⏳
        </div>
        <h3 className="mt-4 text-[18px] font-semibold text-foreground">
          Weekly limit reached
        </h3>
        <p className="mt-2 text-[14px] font-medium text-[color:var(--muted-foreground)]">
          You've used all {limit} analyses for this week. Your limit resets on Monday.
        </p>
        <button
          onClick={onClose}
          className="button-cta mt-5 h-11 w-full rounded-full text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Got it
        </button>
      </div>
    </div>
  );
}