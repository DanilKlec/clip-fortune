import phoneImg from "@/assets/phone-mock.jpg";
import { ScoreGauge } from "../ScoreGauge";

const factors = [
  { name: "Visual Cortex", val: 92, color: "var(--volt)" },
  { name: "Auditory Cortex", val: 81, color: "var(--volt)" },
  { name: "Memory Encoding", val: 74, color: "gradient" },
];

export function EngagementScore() {
  return (
    <section className="page-shell mx-auto w-full max-w-6xl py-12 sm:py-16 md:py-20">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        {/* Left copy */}
        <div>
          <h2 className="font-display text-[clamp(1.75rem,5.5vw,3.25rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground [text-wrap:balance]">
            Engagement{" "}
            <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              score
            </span>
          </h2>
          <p className="mt-4 max-w-lg text-[15px] font-medium leading-relaxed text-muted-foreground sm:mt-6 sm:text-[16px]">
            One number for how long people will actually watch. Not a guess,
            not a vibe check — a modeled read on whether your clip earns the
            scroll or loses it. The closest thing to a test screening before
            you hit publish.
          </p>
        </div>

        {/* Right visual: phone → arrow → gauge card */}
        <div className="relative flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          {/* Phone mock */}
          <div
            className="h-[280px] w-[160px] shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:h-[380px] sm:w-[210px]"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <img
              src={phoneImg}
              alt="Video preview"
              width={720}
              height={1280}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Arrow */}
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            fill="none"
            className="shrink-0 rotate-90 sm:rotate-0"
          >
            <path
              d="M4 12 C 20 12, 28 22, 38 30"
              style={{ stroke: "var(--volt)" }}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M38 30 L 32 28 M 38 30 L 36 24"
              style={{ stroke: "var(--volt)" }}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {/* Gauge card */}
          <div
            className="glass rounded-2xl p-4 sm:p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex justify-center">
              <ScoreGauge score={90} tierLabel="Engagement score" size={180} compact />
            </div>
            <div className="mt-4 space-y-2.5">
              {factors.map((f) => (
                <div key={f.name}>
                  <div className="flex justify-between text-[12px] font-semibold text-foreground">
                    <span>{f.name}</span>
                    <span>{f.val}%</span>
                  </div>
                  <div
                    className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: "var(--tile)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${f.val}%`,
                        background:
                          f.color === "gradient" ? "var(--volt)" : f.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}