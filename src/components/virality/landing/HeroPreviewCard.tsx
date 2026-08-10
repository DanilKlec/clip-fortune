import { ArrowRight } from "lucide-react";
import { Brain3D } from "./Brain3D";
import { useViralitySession } from "@/lib/virality-session";
import { useAnalyzeProgress } from "@/lib/analyze-progress";

const PLACEHOLDER_FACTORS = [
  { name: "Visual Cortex", value: 46 },
  { name: "Attention Control", value: 36 },
  { name: "Auditory Cortex", value: 31 },
  { name: "Focus Drift", value: 70 },
  { name: "Language Network", value: 33 },
];

const PLACEHOLDER_STATS = [
  { label: "Duration" },
  { label: "Hook Score" },
  { label: "Hold Rate" },
];

function formatDuration(sec: number | undefined) {
  if (!sec || !isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function HeroPreviewCard() {
  const { poster, analyzing, phase, result } = useViralitySession();

  const state: "idle" | "analyzing" | "ready" = analyzing
    ? "analyzing"
    : result
      ? "ready"
      : "idle";

  const { text: progressText, progress } = useAnalyzeProgress(
    analyzing,
    phase,
    state === "ready",
  );

  const stats =
    state === "ready" && result
      ? [
          {
            label: "Duration",
            value: formatDuration(
              result.attention_curve?.[result.attention_curve.length - 1]?.second,
            ),
          },
          {
            label: "Hook",
            value: String(
              result.factors.find((f) => f.key === "hook")?.score ?? "—",
            ),
          },
          {
            label: "Retention",
            value: `${
              result.factors.find((f) => f.key === "retention")?.score ?? "—"
            }`,
          },
        ]
      : PLACEHOLDER_STATS.map((s) => ({ ...s, value: "—" }));

  const factors =
    state === "ready" && result?.brain_signals
      ? result.brain_signals.regions
          .slice()
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((r) => ({ name: r.name, value: r.score }))
      : state === "ready"
        ? result!.factors.slice(0, 5).map((f) => ({ name: f.name, value: f.score }))
        : PLACEHOLDER_FACTORS.map((f) => ({ ...f, value: 0 }));

  const score =
    state === "ready" && result ? result.overall_score : 47;

  const barPercent = state === "ready" ? score : 0;

  return (
    <div
      id="brain-card"
      className="flex h-full flex-col rounded-2xl border p-5 sm:p-6"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Top: gradient bar + score */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ background: "var(--card-border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${barPercent}%`,
                background: "var(--volt)",
              }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">
            Viral Potential
          </div>
          <div className="mt-0.5 text-[24px] font-bold leading-none text-foreground sm:text-[28px]">
            {state === "ready" ? (
              <>
                {score}
                <span className="text-muted-foreground">/100</span>
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Brain + thumbnail */}
      <div className="relative mt-4 flex h-[200px] items-center justify-center overflow-hidden rounded-xl sm:h-[240px] lg:h-[260px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, var(--volt-dim), transparent 70%)",
        }}
      >
        <Brain3D />
        {(state === "analyzing" || state === "ready") && (
          <div
            className="absolute bottom-3 left-3 h-[92px] w-[68px] overflow-hidden rounded-xl border-2"
            style={{ borderColor: "var(--foreground)", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}
          >
            {poster ? (
              <img
                src={poster}
                alt="Video thumbnail"
                width={720}
                height={1280}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[color:var(--tile)]" />
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn { from {opacity:0; transform:translateY(2px)} to {opacity:1; transform:none} }`}</style>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="px-1 py-1 text-center"
          >
            <div className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-1 text-[18px] font-bold text-foreground sm:text-[22px]">
              {state === "ready" ? s.value : "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Factor bars */}
      <div
        className="mt-4 grid gap-x-4 gap-y-2.5 rounded-xl p-3 sm:grid-cols-2 sm:gap-y-3 sm:p-4"
        style={{ background: "var(--tile)", border: "1px solid var(--card-border)" }}
      >
        {factors.map((f) => (
          <div key={f.name}>
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-foreground">{f.name}</span>
              <span className="font-bold text-foreground">
                {state === "ready" ? `${f.value}%` : "—"}
              </span>
            </div>
            <div
              className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: "var(--card-border)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: state === "ready" ? `${f.value}%` : "0%",
                  background: "var(--volt)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 lg:mt-auto lg:pt-5">
        <button
          type="button"
          onClick={() => {}}
          disabled={state !== "ready"}
          className={`relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--card)] ${state === "ready" ? "button-cta" : ""}`}
        style={{
          background:
            state === "ready"
              ? undefined
              : state === "analyzing"
                ? "var(--volt-dim)"
                : "var(--tile)",
          color:
            state === "ready"
              ? undefined
              : state === "analyzing"
                ? "var(--foreground)"
                : "var(--text-secondary)",
          cursor: state === "ready" ? "pointer" : "not-allowed",
        }}
      >
        {state === "analyzing" && (
          <div
            className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: "var(--volt)",
            }}
          />
        )}
        <span
          className="relative z-10 flex items-center gap-2 px-4 text-center"
          key={state === "analyzing" ? progressText : state}
          style={{ animation: state === "analyzing" ? "fadeIn .4s ease" : undefined }}
        >
          {state === "analyzing" ? (
            progressText
          ) : (
            <>
              View full report
              <ArrowRight size={18} strokeWidth={2} />
            </>
          )}
        </span>
        </button>
        <p aria-hidden className="hidden h-[18px] lg:block" />
      </div>
    </div>
  );
}