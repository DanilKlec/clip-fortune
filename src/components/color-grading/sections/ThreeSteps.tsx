import { ImagePlus, SlidersHorizontal, Download } from "lucide-react";
import stepUpload from "@/assets/step-upload.jpg";
import stepLook from "@/assets/step-look.jpg";
import stepCompare from "@/assets/step-compare.jpg";

const steps = [
  {
    icon: ImagePlus,
    image: stepUpload,
    title: "Upload your images",
    desc: "Drop one still or a whole batch — PNG, JPG or WebP. The first frame becomes your reference for the look.",
  },
  {
    icon: SlidersHorizontal,
    image: stepLook,
    title: "Build your look",
    desc: "Start from a preset, then push temperature, contrast, highlights and grain until the frame reads right.",
  },
  {
    icon: Download,
    image: stepCompare,
    title: "Compare and download",
    desc: "Drag the handle to check the grade against the original, then export the finished file in one click.",
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
            <div className="overflow-hidden rounded-xl border border-white/10">
              <img
                src={s.image}
                alt=""
                loading="lazy"
                width={900}
                height={640}
                className="h-[150px] w-full object-cover sm:h-[170px]"
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
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