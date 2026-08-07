import brainAnalyzingRef from "@/assets/brain-analyzing-ref.png.asset.json";
import dropVisualRef from "@/assets/drop-visual-ref.png.asset.json";

const cardStyle: React.CSSProperties = {
  boxShadow: "var(--shadow-card)",
};

function DropVisual() {
  return (
    <div
      className="relative flex h-[220px] items-center justify-center overflow-hidden rounded-xl"
      style={{ background: "var(--background)" }}
    >
      <img
        src={dropVisualRef.url}
        alt="Drop your video"
        width={1448}
        height={1086}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function AnalyzeVisual() {
  return (
    <div
      className="relative flex h-[220px] items-center justify-center overflow-hidden rounded-xl"
      style={{ background: "var(--background)" }}
    >
      <div
        className="absolute inset-4 rounded-xl"
        style={{ border: "1.5px solid var(--sky-bdr)" }}
      />
      <img
        src={brainAnalyzingRef.url}
        alt="Brain analysis"
        width={1024}
        height={1024}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function ResultsVisual() {
  const size = 150;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.85;
  const val = 73;
  const offset = arc - (val / 100) * arc;

  return (
    <div
      className="flex h-[220px] flex-col items-center justify-center rounded-xl p-4"
      style={{ background: "var(--tile)" }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(117deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--tile)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${c}`}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            style={{ stroke: "var(--volt)" }}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${c}`}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[28px] font-bold leading-none text-foreground">
            73<span className="text-muted-foreground text-[16px]">/100</span>
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-muted-foreground">
            Engagement score
          </div>
        </div>
      </div>
      <div className="mt-3 w-full space-y-1.5">
        {[
          { name: "Visual Cortex", val: 92 },
          { name: "Auditory Cortex", val: 81 },
        ].map((f) => (
          <div key={f.name}>
            <div className="flex justify-between text-[10px] font-semibold text-foreground">
              <span>{f.name}</span>
              <span>{f.val}%</span>
            </div>
            <div
              className="mt-0.5 h-1 w-full overflow-hidden rounded-full"
              style={{ background: "var(--tile)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${f.val}%`,
                  background: "var(--volt)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const steps = [
  {
    visual: <DropVisual />,
    title: "Drop the clip",
    desc: "A hook you're testing, an ad before launch, a reel sitting in drafts. Any format, vertical or horizontal, up to 90 seconds.",
  },
  {
    visual: <AnalyzeVisual />,
    title: "We analyze",
    desc: "A modeled audience watches while we map the brain response across vision, sound, memory, attention, language.",
  },
  {
    visual: <ResultsVisual />,
    title: "See results",
    desc: "A virality score, a peak hook timestamp, a hold rate, and a heatmap showing exactly which regions of the brain your clip is firing.",
  },
];

export function HowItWorks() {
  return (
    <section className="page-shell mx-auto w-full max-w-6xl py-12 sm:py-16 md:py-20">
      <h2
        className="text-center font-display text-[clamp(1.5rem,5.5vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground [text-wrap:balance]"
      >
        How it{" "}
        <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
          works
        </span>
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 md:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.title}
            className="glass rounded-2xl p-4"
            style={cardStyle}
          >
            {s.visual}
            <h3
              className="mt-5 px-2 font-display text-[22px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground"
            >
              {s.title}
            </h3>
            <p className="mt-2 px-2 pb-2 text-[14px] font-medium text-muted-foreground">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}