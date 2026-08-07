import { useState } from "react";
import { Brain, Info, ChevronDown } from "lucide-react";
import type { BrainSignals as BrainSignalsData } from "@/lib/virality-mock";

const cardStyle: React.CSSProperties = {
  background: "var(--card-bg)",
  borderColor: "var(--card-border)",
  boxShadow: "var(--shadow-card)",
};

const WEIGHTS: Record<keyof BrainSignalsData["formula_breakdown"], { label: string; weight: number }> = {
  attention: { label: "Attention", weight: 0.30 },
  emotion: { label: "Emotion", weight: 0.20 },
  memory: { label: "Memory encoding", weight: 0.20 },
  cognitive_load_inv: { label: "Cognitive ease", weight: 0.15 },
  sensory_coherence: { label: "A/V coherence", weight: 0.10 },
  social_currency: { label: "Social currency", weight: 0.05 },
};

function loadLabel(load: number) {
  if (load <= 35) return { label: "Light", bg: "var(--volt-dim)", color: "var(--volt)" };
  if (load <= 65) return { label: "Balanced", bg: "var(--amber-tint)", color: "var(--amber)" };
  return { label: "Overloaded", bg: "var(--danger-tint)", color: "var(--danger)" };
}

export function BrainSignals({ data }: { data: BrainSignalsData }) {
  const [open, setOpen] = useState(false);
  const load = loadLabel(data.cognitive_load);

  return (
    <div className="mt-4 rounded-2xl border p-3" style={cardStyle}>
      <div className="flex items-center gap-2 px-2 pb-3 pt-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--tile)" }}>
          <Brain size={18} strokeWidth={1.75} className="text-sky" />
        </div>
        <h2 className="text-[22px] font-semibold text-foreground">Brain signals</h2>
        <span
          className="ml-auto rounded-full px-2.5 py-1 text-[12px] font-semibold"
          style={{ background: "var(--sky-dim)", color: "var(--sky)" }}
          title={data.references.join(" · ")}
        >
          {data.composite_score} · composite
        </span>
      </div>

      <div className="mb-2 flex items-start gap-2 px-2 text-[12px] font-medium text-muted-foreground">
        <Info size={13} className="mt-0.5 shrink-0" />
        <span>Neuromarketing proxies estimated from frames. Based on {data.references.join(", ")}.</span>
      </div>

      {/* Regions */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.regions.map((r) => (
          <div key={r.key} className="rounded-xl p-4" style={{ background: "var(--tile)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="text-[14px] font-semibold text-foreground">{r.name}</div>
              <div className="text-[15px] font-bold text-foreground">{r.score}</div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--tile)" }}>
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-out"
                style={{
                  width: `${r.score}%`,
                  background: "var(--volt)",
                }}
              />
            </div>
            {r.evidence && (
              <div className="mt-2 text-[12px] font-medium text-[color:var(--muted-foreground)]">
                {r.evidence}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl p-3" style={{ background: "var(--tile)" }}>
          <div className="text-[12px] font-medium text-muted-foreground">Cognitive load</div>
          <div className="mt-1 flex items-center justify-between">
            <div className="text-[18px] font-bold text-foreground">{data.cognitive_load}</div>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: load.bg, color: load.color }}>
              {load.label}
            </span>
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ background: "var(--tile)" }}>
          <div className="text-[12px] font-medium text-muted-foreground">A/V sync</div>
          <div className="mt-1 text-[18px] font-bold text-foreground">{data.av_sync_score}</div>
        </div>
        <div className="rounded-xl p-3" style={{ background: "var(--tile)" }}>
          <div className="text-[12px] font-medium text-muted-foreground">Brand recall index</div>
          <div className="mt-1 text-[18px] font-bold text-foreground">{data.brand_recall_index}</div>
        </div>
      </div>

      {/* Formula breakdown */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-3 flex w-full items-center justify-between rounded-full px-4 py-2 text-[13px] font-semibold text-foreground"
        style={{ background: "var(--sky-dim)", color: "var(--sky)" }}
      >
        <span>How the composite is calculated</span>
        <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 200ms" }} />
      </button>
      {open && (
        <div className="mt-2 rounded-xl p-3" style={{ background: "var(--tile)" }}>
          <ul className="flex flex-col gap-1.5 text-[12px] font-medium text-foreground">
            {(Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>).map((k) => (
              <li key={k} className="flex items-center justify-between gap-2">
                <span className="text-[color:var(--muted-foreground)]">
                  {WEIGHTS[k].label} · {Math.round(WEIGHTS[k].weight * 100)}%
                </span>
                <span className="font-semibold">{data.formula_breakdown[k]}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 text-[11px] font-medium text-muted-foreground">
            Composite = Σ(component × weight). Weights derived from Nielsen CN sales-lift studies and Ramsøy's AIDA-neuro model.
          </div>
        </div>
      )}
    </div>
  );
}