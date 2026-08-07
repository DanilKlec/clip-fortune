import { useState } from "react";
import {
  Check,
  Users,
  Lightbulb,
  RotateCcw,
  Mars,
  Venus,
  UsersRound,
  ShieldCheck,
  Copy,
  ClipboardCheck,
  Activity,
  Wand2,
} from "lucide-react";
import {
  viralityMock,
  tierLabel,
  widthLabel,
  type AudienceSegment,
  type ViralityResult,
  type UsageInfo,
} from "@/lib/virality-mock";
import { ScoreGauge } from "./ScoreGauge";
import { AttentionCurve } from "./results/AttentionCurve";
import { BrainSignals } from "./results/BrainSignals";
import { Speech } from "./results/Speech";

interface Props {
  onReset: () => void;
  result?: ViralityResult;
  usage?: UsageInfo | null;
  fileName?: string | null;
}

const cardStyle: React.CSSProperties = {
  background: "var(--card-bg)",
  borderColor: "var(--card-border)",
  boxShadow: "var(--shadow-card)",
};

function GenderIcon({ gender }: { gender: AudienceSegment["gender"] }) {
  const props = { size: 16, strokeWidth: 1.75, color: "var(--sky)" as const };
  if (gender === "male") return <Mars {...props} />;
  if (gender === "female") return <Venus {...props} />;
  return <UsersRound {...props} />;
}

function SegmentRow({
  seg,
  variant,
}: {
  seg: AudienceSegment;
  variant: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: isPrimary ? "var(--sky-dim)" : "var(--tile)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: "var(--tile)" }}
        >
          <GenderIcon gender={seg.gender} />
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
          style={{
            background: "var(--tile)",
            color: "var(--foreground)",
          }}
        >
          {seg.age_range}
        </span>
        <span
          className={`font-semibold text-foreground ${
            isPrimary ? "text-[15px]" : "text-[13px]"
          }`}
        >
          {seg.label}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {seg.interests.map((i) => (
          <span
            key={i}
            className="rounded-full px-2 py-1 text-[12px] font-medium"
            style={{
              background: "var(--volt-dim)",
              color: "var(--volt)",
            }}
          >
            #{i}
          </span>
        ))}
      </div>
      {seg.why && (
        <div className="mt-2 text-[12px] font-medium text-muted-foreground">
          Why: {seg.why}
        </div>
      )}
    </div>
  );
}

function impactStyles(impact: "high" | "medium" | "low") {
  if (impact === "high")
    return { background: "var(--danger-tint)", color: "var(--danger)" };
  if (impact === "medium")
    return { background: "var(--amber-tint)", color: "var(--amber)" };
  return {
    background: "var(--tile)",
    color: "var(--t2)",
  };
}

export function ResultsScreen({ onReset, result, usage, fileName }: Props) {
  const r = result ?? viralityMock;
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyHook = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx((v) => (v === i ? null : v)), 1600);
    } catch {
      /* noop */
    }
  };

  const safety = r.safety;
  const safetyBadge = safety
    ? safety.score >= 90
      ? { label: "Safe", bg: "var(--volt-dim)", color: "var(--volt)" }
      : safety.score >= 70
        ? { label: "Minor risks", bg: "var(--amber-tint)", color: "var(--amber)" }
        : { label: "At risk", bg: "var(--danger-tint)", color: "var(--danger)" }
    : null;

  const effortLabel = (e?: "quick" | "moderate" | "reshoot") =>
    e === "quick" ? "Quick edit" : e === "moderate" ? "Re-edit" : e === "reshoot" ? "Reshoot" : null;

  const severityStyle = (s: "high" | "medium" | "low") =>
    s === "high"
      ? { background: "var(--danger-tint)", color: "var(--danger)" }
      : s === "medium"
        ? { background: "var(--amber-tint)", color: "var(--amber)" }
        : { background: "var(--tile)", color: "var(--t2)" };

  return (
    <div className="page-shell mx-auto w-full max-w-5xl py-8 sm:py-12 md:py-16">
      {/* Header card: gauge + verdict */}
      <div
        className="rounded-2xl border p-6 sm:p-8"
        style={cardStyle}
      >
        <div className="flex flex-col items-center text-center">
          <ScoreGauge
            score={r.overall_score}
            tierLabel={tierLabel[r.virality_tier]}
          />
          <p className="mt-4 max-w-xl text-[15px] font-medium text-[color:var(--muted-foreground)]">
            {r.verdict}
          </p>
        </div>
      </div>

      {/* Attention curve */}
      {r.attention_curve && r.attention_curve.length > 0 && (
        <div className="mt-4 rounded-2xl border p-3" style={cardStyle}>
          <div className="flex items-center gap-2 px-2 pb-3 pt-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--tile)" }}>
              <Activity size={18} strokeWidth={1.75} className="text-sky" />
            </div>
            <h2 className="font-display text-[22px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground">Predicted attention curve</h2>
          </div>
          <AttentionCurve
            points={r.attention_curve}
            dropOffs={r.drop_off_points ?? []}
          />
          {r.drop_off_points && r.drop_off_points.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2 px-1">
              {r.drop_off_points.map((d, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "var(--tile)" }}>
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: "var(--volt)", boxShadow: "0 0 0 3px var(--volt-dim)" }}
                  />
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                    style={{ background: "var(--tile)", color: "var(--foreground)" }}
                  >
                    {d.timecode}
                  </span>
                  <span className="text-[13px] font-medium text-foreground">{d.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Audience */}
      <div
        className="mt-4 rounded-2xl border p-3"
        style={cardStyle}
      >
        <div className="flex items-center gap-2 px-2 pb-3 pt-1">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "var(--tile)" }}
          >
            <Users size={20} strokeWidth={1.5} className="text-sky" />
          </div>
          <h2 className="font-display text-[22px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground">
            Target audience
          </h2>
          <span
            className="ml-auto rounded-full px-2.5 py-1 text-[12px] font-semibold"
            style={{
              background: "var(--sky-dim)",
              color: "var(--sky)",
            }}
          >
            {widthLabel[r.audience.audience_width]}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1.5 px-1 text-[12px] font-medium text-muted-foreground">
              Primary
            </div>
            <SegmentRow seg={r.audience.primary} variant="primary" />
          </div>
          <div>
            <div className="mb-1.5 px-1 text-[12px] font-medium text-muted-foreground">
              Secondary
            </div>
            <SegmentRow seg={r.audience.secondary} variant="secondary" />
          </div>
        </div>

        <div
          className="mt-3 rounded-xl p-4"
          style={{ background: "var(--volt-dim)" }}
        >
          <div className="flex items-start gap-2">
            <Lightbulb
              size={18}
              strokeWidth={1.75}
              className="mt-0.5 shrink-0 text-volt"
            />
            <div className="min-w-0">
              <div
                className="text-[13px] font-semibold"
                style={{ color: "var(--volt)" }}
              >
                Targeting tip
              </div>
              <div className="mt-0.5 text-[13px] font-medium text-foreground">
                {r.audience.targeting_tip}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top fixes */}
      <div
        className="mt-4 rounded-2xl border p-3"
        style={cardStyle}
      >
        <h2 className="px-2 pb-3 pt-1 font-display text-[22px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground">
          Top fixes
        </h2>
        <ol className="flex flex-col gap-2">
          {r.top_fixes.map((fix, i) => (
            <li
              key={i}
              className="rounded-xl p-4"
              style={{ background: "var(--tile)" }}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                  style={{ background: "var(--sky)", color: "var(--primary-foreground)" }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-1 text-[12px] font-semibold"
                      style={{
                        background: "var(--tile)",
                        color: "var(--foreground)",
                      }}
                    >
                      {fix.timecode}
                    </span>
                    <span className="text-[14px] font-semibold text-foreground">
                      {fix.issue}
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] font-medium text-[color:var(--muted-foreground)]">
                    {fix.action}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className="rounded-full px-2.5 py-1 text-[12px] font-semibold capitalize"
                    style={impactStyles(fix.impact)}
                  >
                    {fix.impact}
                  </span>
                  {effortLabel(fix.effort) && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ background: "var(--sky-dim)", color: "var(--sky)" }}
                    >
                      {effortLabel(fix.effort)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Brain signals (neuromarketing) */}
      {r.brain_signals && <BrainSignals data={r.brain_signals} />}

      {/* Speech / transcript */}
      {r.speech && <Speech data={r.speech} />}

      {/* Factors */}
      <div
        className="mt-4 rounded-2xl border p-3"
        style={cardStyle}
      >
        <h2 className="px-2 pb-3 pt-1 font-display text-[22px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground">
          Viral factors
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {r.factors.map((f) => (
            <div
              key={f.key}
              className="rounded-xl p-4"
              style={{ background: "var(--tile)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-[14px] font-semibold text-foreground">
                  {f.name}
                </div>
                <div className="text-[15px] font-bold text-foreground">
                  {f.score}
                </div>
              </div>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full"
                style={{ background: "var(--tile)" }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-1000 ease-out"
                  style={{
                    width: `${f.score}%`,
                    background: "var(--volt)",
                  }}
                />
              </div>
              <div className="mt-3 text-[13px] font-medium text-[color:var(--muted-foreground)]">
                {f.finding}
              </div>
              <div className="mt-2 text-[13px] font-medium text-foreground">
                <span style={{ color: "var(--sky)" }}>Fix:</span>{" "}
                {f.fix}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reach safety */}
      {safety && safetyBadge && (
        <div className="mt-4 rounded-2xl border p-3" style={cardStyle}>
          <div className="flex items-center gap-2 px-2 pb-3 pt-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--tile)" }}>
              <ShieldCheck size={18} strokeWidth={1.75} className="text-sky" />
            </div>
            <h2 className="font-display text-[22px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground">Reach safety</h2>
            <span
              className="ml-auto rounded-full px-2.5 py-1 text-[12px] font-semibold"
              style={{ background: safetyBadge.bg, color: safetyBadge.color }}
            >
              {safety.score} · {safetyBadge.label}
            </span>
          </div>
          {safety.flags.length === 0 ? (
            <div
              className="flex items-center gap-3 rounded-xl p-4"
              style={{ background: "var(--tile)" }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "var(--volt-dim)" }}>
                <Check size={16} strokeWidth={2} className="text-volt" />
              </div>
              <span className="text-[14px] font-medium text-foreground">
                No reach-limiting issues found
              </span>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {safety.flags.map((f, i) => (
                <li key={i} className="rounded-xl p-4" style={{ background: "var(--tile)" }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-1 text-[12px] font-semibold capitalize"
                      style={severityStyle(f.severity)}
                    >
                      {f.severity}
                    </span>
                    <span className="text-[14px] font-semibold text-foreground">{f.category}</span>
                  </div>
                  <div className="mt-1 text-[13px] font-medium text-[color:var(--muted-foreground)]">
                    {f.note}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Hook variants */}
      {r.hook_variants && r.hook_variants.length > 0 && (
        <div className="mt-4 rounded-2xl border p-3" style={cardStyle}>
          <div className="flex items-center gap-2 px-2 pb-3 pt-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--tile)" }}>
              <Wand2 size={18} strokeWidth={1.75} className="text-volt" />
            </div>
            <h2 className="font-display text-[22px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground">Try these hooks instead</h2>
          </div>
          <ol className="flex flex-col gap-2">
            {r.hook_variants.map((h, i) => (
              <li key={i} className="rounded-xl p-4" style={{ background: "var(--tile)" }}>
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                    style={{ background: "var(--volt)", color: "var(--primary-foreground)" }}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 text-[14px] font-medium text-foreground">{h}</div>
                  <button
                    onClick={() => copyHook(h, i)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
                    style={{ background: copiedIdx === i ? "var(--sky-dim)" : "var(--tile)" }}
                    aria-label="Copy hook"
                  >
                    {copiedIdx === i ? (
                      <ClipboardCheck size={16} strokeWidth={2} className="text-sky" />
                    ) : (
                      <Copy size={16} strokeWidth={1.75} className="text-muted-foreground" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-2 px-1 text-[12px] font-medium text-muted-foreground">
            Alternative openings generated for this exact video
          </div>
        </div>
      )}

      {/* Strengths */}
      <div
        className="mt-4 rounded-2xl border p-3"
        style={cardStyle}
      >
        <h2 className="px-2 pb-3 pt-1 font-display text-[22px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground">
          What's already working
        </h2>
        <ul className="flex flex-col gap-2">
          {r.strengths.map((s) => (
            <li
              key={s}
              className="flex items-center gap-3 rounded-xl p-4"
              style={{ background: "var(--tile)" }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--volt-dim)" }}
              >
                <Check size={16} strokeWidth={2} className="text-volt" />
              </div>
              <span className="text-[14px] font-medium text-foreground">
                {s}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onReset}
        className="button-cta mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RotateCcw size={18} strokeWidth={1.75} />
        Analyze another video
      </button>
    </div>
  );
}
