import { ImagePlus, SlidersHorizontal, Download } from "lucide-react";

const steps = [
  {
    icon: ImagePlus,
    title: "Load your frames",
    desc: "Drag in a single hero still or a whole batch. PNG, JPG and WebP all work, and the first image becomes your reference frame.",
  },
  {
    icon: SlidersHorizontal,
    title: "Shape the look",
    desc: "Pick a starting preset, then push temperature, contrast, highlights and grain until the frame reads the way you want it to.",
  },
  {
    icon: Download,
    title: "Render and keep it",
    desc: "Generate the graded version, compare it against the original, and download the file ready for your edit or feed.",
  },
];

export function ThreeSteps() {
  return (
    <section className="page-shell mx-auto w-full max-w-6xl py-12 sm:py-16 md:py-20">
      <h2 className="text-center font-display text-[clamp(1.5rem,5.5vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground [text-wrap:balance]">
        Color grade your image in{" "}
        <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
          3 easy steps
        </span>
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 md:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="glass rounded-2xl p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: "var(--volt-dim)" }}
              >
                <s.icon size={20} strokeWidth={1.75} className="text-volt" />
              </span>
              <span className="button-meta text-muted-foreground">
                Step {i + 1}
              </span>
            </div>
            <h3 className="mt-5 font-display text-[22px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground">
              {s.title}
            </h3>
            <p className="mt-2 text-[14px] font-medium text-muted-foreground">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}