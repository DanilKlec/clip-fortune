import { Download, Sparkles, SlidersHorizontal, Trash2 } from "lucide-react";
import type { HistoryItem } from "./history-store";

interface Props {
  items: HistoryItem[];
  onUse: (item: HistoryItem) => void;
  onDownload: (item: HistoryItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const when = (ts: number) =>
  new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Locally persisted results — visible across images and page reloads. */
export function GradingHistory({ items, onUse, onDownload, onRemove, onClear }: Props) {
  return (
    <section
      aria-label="Grading history"
      className="mt-4 min-w-0 rounded-2xl p-3 sm:p-4"
      style={{ background: "var(--tile)" }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-[13px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
          History
        </h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="button-utility flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 size={13} strokeWidth={2} />
            Clear
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-[12px] font-medium text-muted-foreground">
          Generated and downloaded results appear here — stored on this device only.
        </p>
      ) : (
        <ul className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="w-[152px] shrink-0 overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--card-border)", background: "var(--tile)" }}
            >
              <button
                type="button"
                onClick={() => onUse(item)}
                className="block h-[96px] w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                aria-label={`Open ${item.name}`}
              >
                <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
              </button>
              <div className="space-y-1 p-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  {item.kind === "ai" ? (
                    <Sparkles size={12} strokeWidth={2} className="shrink-0 text-volt" />
                  ) : (
                    <SlidersHorizontal size={12} strokeWidth={2} className="shrink-0 text-sky" />
                  )}
                  <span className="truncate text-[12px] font-semibold text-foreground" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="font-mono truncate text-[10px] text-muted-foreground">
                  {when(item.createdAt)} · {item.sourceName}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onDownload(item)}
                    aria-label={`Download ${item.name}`}
                    className="button-utility flex h-8 flex-1 items-center justify-center gap-1 rounded-full text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Download size={12} strokeWidth={2} />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Delete ${item.name}`}
                    className="button-utility flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 size={12} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
