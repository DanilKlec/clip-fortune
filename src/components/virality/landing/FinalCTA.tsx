import { Sparkles } from "lucide-react";

interface Props {
  onCTA: () => void;
}

export function FinalCTA({ onCTA }: Props) {
  return (
    <section className="page-shell mx-auto w-full max-w-6xl py-12 sm:py-16 md:py-20">
      <div
        className="overflow-hidden rounded-2xl border border-white/10 px-4 py-12 text-center sm:px-8 sm:py-16 md:px-12 md:py-20"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--volt-dim) 0%, color-mix(in oklab, var(--background) 90%, transparent) 60%, var(--background) 100%), var(--background)",
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
          <span className="badge-volt gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-blink" />
            Ready to go viral
          </span>
          <h2
            className="font-display text-[clamp(2rem,6vw,3.75rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.02em] text-foreground [text-wrap:balance]"
          >
            Test your{" "}
            <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              next post
            </span>
          </h2>
          <p className="max-w-xl text-[14px] font-medium text-muted-foreground sm:text-[15px]">
            Get a modeled read on your clip in under a minute. No sign-up,
            no card.
          </p>
          <button
            onClick={onCTA}
            className="button-cta mt-2 flex h-12 items-center gap-2 rounded-full px-8 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Sparkles size={18} strokeWidth={2} />
            Predict Viral Potential
          </button>
        </div>
      </div>
    </section>
  );
}