import { useState } from "react";
import sampleImage from "@/assets/grading-demo.jpg";
import { BeforeAfter } from "../BeforeAfter";
import { GradedImage } from "../GradedImage";
import { useImageAspect } from "../ImageStage";
import { NEUTRAL, PRESETS, type Preset } from "../grading";

const showcase: Preset[] = PRESETS.filter((p) =>
  ["natural", "split-tone", "soft-skin", "old-lens", "16mm"].includes(p.id),
);

export function SeeItInAction() {
  const [preset, setPreset] = useState<Preset>(showcase[0]);
  const ratio = useImageAspect(sampleImage);

  return (
    <section className="page-shell mx-auto w-full max-w-6xl py-12 sm:py-16 md:py-20">
      <h2 className="text-center font-display text-[clamp(1.5rem,5.5vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground [text-wrap:balance]">
        See it{" "}
        <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
          in action
        </span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-[14px] font-medium text-muted-foreground sm:text-[15px]">
        Switch a look and drag the handle to see exactly what the grade changes.
      </p>

      <div
        className="glass mt-8 rounded-2xl p-4 sm:mt-10 sm:p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="h-[240px] w-full sm:h-[360px] lg:h-[440px]">
          <BeforeAfter
            label="Sample before and after"
            ratio={ratio}
            before={
              <GradedImage
                src={sampleImage}
                alt="Untouched sample frame"
                adjustments={NEUTRAL}
                className="absolute inset-0 h-full w-full"
                imgClassName="h-full w-full object-cover object-center"
              />
            }
            after={
              <GradedImage
                src={sampleImage}
                alt={`Sample frame graded with ${preset.name}`}
                adjustments={preset.values}
                className="absolute inset-0 h-full w-full"
                imgClassName="h-full w-full object-cover object-center"
              />
            }
          />
        </div>

        <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto">
          {showcase.map((p) => {
            const active = p.id === preset.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p)}
                aria-pressed={active}
                className="flex h-11 shrink-0 items-center rounded-full border px-4 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  borderColor: active ? "var(--volt)" : "var(--card-border)",
                  background: active ? "var(--volt-dim)" : "var(--tile)",
                  color: active ? "var(--volt)" : undefined,
                }}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
