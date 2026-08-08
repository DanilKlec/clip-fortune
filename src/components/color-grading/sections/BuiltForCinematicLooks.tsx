import { Gauge, Images, SlidersHorizontal, Sparkles } from "lucide-react";

const features = [
  {
    icon: SlidersHorizontal,
    title: "Full grading controls",
    desc: "Temperature, contrast, saturation, highlights, exposure, sharpness and grain — a full tonal recipe, not a flat filter.",
  },
  {
    icon: Images,
    title: "Works with any image",
    desc: "Portraits, product shots, landscapes or film frames. PNG, JPG and WebP, one at a time or a whole batch.",
  },
  {
    icon: Gauge,
    title: "Instant cinematic output",
    desc: "The preview re-renders as you drag, so the graded frame is ready the moment you stop moving the sliders.",
  },
];

interface Props {
  onCTA: () => void;
}

export function BuiltForCinematicLooks({ onCTA }: Props) {
  return (
    <section className="page-shell mx-auto w-full max-w-6xl py-12 sm:py-16 md:py-20">
      <div
        className="overflow-hidden rounded-2xl border border-white/10 px-4 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--volt-dim) 0%, color-mix(in oklab, var(--background) 90%, transparent) 60%, var(--background) 100%), var(--background)",
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <span className="badge-volt gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-blink" />
            Made for filmmakers
          </span>
          <h2 className="mt-5 font-display text-[clamp(2rem,6vw,3.75rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.02em] text-foreground [text-wrap:balance]">
            Built for{" "}
            <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              cinematic looks
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[14px] font-medium text-muted-foreground sm:text-[15px]">
            Grading tools that behave like a colourist's panel, running right in
            the browser on your own frames.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-xl p-5 text-left">
              <f.icon size={20} strokeWidth={1.75} className="text-volt" />
              <h3 className="mt-4 text-[16px] font-bold text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-[14px] font-medium text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={onCTA}
            className="button-cta flex h-12 items-center gap-2 rounded-full px-8 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Sparkles size={18} strokeWidth={2} />
            Grade your image
          </button>
        </div>
      </div>
    </section>
  );
}
