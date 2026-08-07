import { useState } from "react";
import { Mic, MicOff, ChevronDown } from "lucide-react";
import type { SpeechInfo } from "@/lib/virality-mock";

const cardStyle: React.CSSProperties = {
  background: "var(--card-bg)",
  borderColor: "var(--card-border)",
  boxShadow: "var(--shadow-card)",
};

function paceLabel(wps: number) {
  if (wps <= 0) return { label: "—", bg: "var(--tile)", color: "var(--t2)" };
  if (wps < 1.8) return { label: "Slow", bg: "var(--amber-tint)", color: "var(--amber)" };
  if (wps <= 3.2) return { label: "Natural", bg: "var(--volt-dim)", color: "var(--volt)" };
  return { label: "Fast", bg: "var(--danger-tint)", color: "var(--danger)" };
}

export function Speech({ data }: { data: SpeechInfo }) {
  const [open, setOpen] = useState(false);

  if (!data.available) {
    return (
      <div className="mt-4 rounded-2xl border p-4" style={cardStyle}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--tile)" }}>
            <MicOff size={18} strokeWidth={1.75} className="text-muted-foreground" />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-foreground">No speech detected</div>
            <div className="text-[12px] font-medium text-muted-foreground">
              {data.notes || "Analysis based on visuals only."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pace = paceLabel(data.words_per_second);

  return (
    <div className="mt-4 rounded-2xl border p-3" style={cardStyle}>
      <div className="flex items-center gap-2 px-2 pb-3 pt-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--tile)" }}>
          <Mic size={18} strokeWidth={1.75} className="text-sky" />
        </div>
        <h2 className="text-[22px] font-semibold text-foreground">Speech &amp; hook</h2>
        {data.language && (
          <span
            className="ml-auto rounded-full px-2.5 py-1 text-[12px] font-semibold uppercase"
            style={{ background: "var(--sky-dim)", color: "var(--sky)" }}
          >
            {data.language}
          </span>
        )}
      </div>

      {data.hook_line && (
        <div className="rounded-xl p-4" style={{ background: "var(--sky-dim)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.25em]" style={{ color: "var(--sky)" }}>
                Hook line (first spoken words)
              </div>
              <div className="mt-1 text-[15px] font-semibold text-foreground">"{data.hook_line}"</div>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold"
              style={{ background: pace.bg, color: pace.color }}
            >
              {pace.label} · {data.words_per_second.toFixed(1)} w/s
            </span>
          </div>
        </div>
      )}

      {data.notes && (
        <div className="mt-2 px-1 text-[12px] font-medium text-muted-foreground">
          {data.notes}
        </div>
      )}

      {data.transcript && (
        <>
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-full px-4 py-2 text-[13px] font-semibold"
            style={{ background: "var(--tile)", color: "var(--foreground)" }}
          >
            <span>Transcript preview</span>
            <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 200ms" }} />
          </button>
          {open && (
            <div
              className="mt-2 rounded-xl p-3 text-[13px] font-medium leading-relaxed text-foreground"
              style={{ background: "var(--tile)" }}
            >
              {data.transcript}
            </div>
          )}
        </>
      )}
    </div>
  );
}