import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Download,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { GradedImage } from "./GradedImage";
import { BeforeAfter } from "./BeforeAfter";
import { ImageTray } from "./ImageTray";
import { AdjustmentPanel } from "./AdjustmentPanel";
import { PresetPicker } from "./PresetPicker";
import { ACCEPTED_LABEL, isAccepted, useImageLibrary } from "./useImageLibrary";
import { generateColorGrade } from "./adapter";
import {
  NEUTRAL,
  PRESETS,
  sameValues,
  type AdjustmentKey,
  type Adjustments,
  type Preset,
} from "./grading";
import { ThreeSteps } from "./sections/ThreeSteps";
import { SeeItInAction } from "./sections/SeeItInAction";
import { BuiltForCinematicLooks } from "./sections/BuiltForCinematicLooks";
import demoPhoto from "@/assets/grading-demo.jpg";

type Status = "idle" | "ready" | "generating" | "success" | "error";

export function ColorGradingPage() {
  const { images, active, activeId, setActiveId, add, remove, replace } =
    useImageLibrary();
  const [adjustments, setAdjustments] = useState<Adjustments>({ ...NEUTRAL });
  const [presetId, setPresetId] = useState<string | null>("natural");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<string | null>(null);
  const runRef = useRef(0);

  const setResult = useCallback((url: string | null) => {
    if (resultRef.current) URL.revokeObjectURL(resultRef.current);
    resultRef.current = url;
    setResultUrl(url);
  }, []);

  useEffect(
    () => () => {
      if (resultRef.current) URL.revokeObjectURL(resultRef.current);
      resultRef.current = null;
    },
    [],
  );

  useEffect(() => {
    setStatus((s) => {
      if (s === "generating") return s;
      if (!active) return "idle";
      if (s === "idle") return "ready";
      return s;
    });
  }, [active]);

  const invalidate = useCallback(() => {
    runRef.current++;
    setResult(null);
    setError(null);
    setStatus((s) => (s === "idle" || s === "generating" ? s : "ready"));
  }, [setResult]);

  const acceptFiles = (list: FileList | null) => {
    invalidate();
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    const ok = files.filter(isAccepted);
    if (ok.length < files.length) {
      toast.error(`Only ${ACCEPTED_LABEL} images are supported`);
    }
    if (ok.length > 0) add(ok);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    acceptFiles(e.dataTransfer.files);
  };

  const updateAdjustment = (key: AdjustmentKey, value: number) => {
    invalidate();
    setAdjustments((prev) => {
      const next = { ...prev, [key]: value };
      const match = PRESETS.find((p) => sameValues(p.values, next));
      setPresetId(match?.id ?? null);
      return next;
    });
  };

  const resetKey = (key: AdjustmentKey) => updateAdjustment(key, NEUTRAL[key]);

  const resetAll = () => {
    invalidate();
    setAdjustments({ ...NEUTRAL });
    setPresetId("natural");
  };

  const pickPreset = (preset: Preset) => {
    invalidate();
    setAdjustments({ ...preset.values });
    setPresetId(preset.id);
  };

  const generate = async () => {
    if (!active) return;
    const run = ++runRef.current;
    setStatus("generating");
    setError(null);
    try {
      const res = await generateColorGrade({
        images: [active.file],
        prompt,
        presetId,
        adjustments,
      });
      if (run !== runRef.current) {
        URL.revokeObjectURL(res.imageUrl);
        return;
      }
      setResult(res.imageUrl);
      setStatus("success");
    } catch (err) {
      if (run !== runRef.current) return;
      setResult(null);
      setError(
        err instanceof Error ? err.message : "Something went wrong while grading",
      );
      setStatus("error");
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `color-grade-${Date.now()}.jpg`;
    a.click();
  };

  const busy = status === "generating";

  return (
    <div className="w-full">
      <section className="page-shell mx-auto w-full max-w-6xl pt-6 sm:pt-8 md:pt-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-[13px] font-medium text-muted-foreground sm:mb-6"
        >
          <a href="#explore-apps" className="transition-colors hover:text-foreground">
            Apps
          </a>
          <span aria-hidden>/</span>
          <span className="text-foreground">AI Color Grading</span>
        </nav>

        <h1 className="font-display text-[clamp(1.75rem,6vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground [text-wrap:balance]">
          AI Color{" "}
          <span className="bg-gradient-to-b from-volt to-volt/60 bg-clip-text text-transparent">
            Grading
          </span>
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] font-medium leading-relaxed text-muted-foreground sm:text-[15px]">
          Drop your stills, dial in the look with live controls, and export a
          cinematic grade. Every change previews instantly — nothing is uploaded
          until you generate.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* Preview column */}
          <div className="glass min-w-0 rounded-2xl p-4 sm:p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div
              ref={dropRef}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl sm:min-h-[380px] lg:min-h-[460px]"
              style={{
                background: dragOver ? "var(--volt-dim)" : "var(--tile)",
                border: `1.5px dashed ${dragOver ? "var(--volt)" : "var(--card-border)"}`,
              }}
            >
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  acceptFiles(e.target.files);
                  e.target.value = "";
                }}
              />

              {!active && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: "var(--tile)" }}
                  >
                    <ImagePlus size={22} strokeWidth={1.5} className="text-volt" />
                  </span>
                  <span className="text-[15px] font-medium text-foreground">
                    Drop images to start grading
                  </span>
                  <span className="text-[13px] font-medium text-muted-foreground">
                    Upload from device · {ACCEPTED_LABEL} · multiple files
                  </span>
                </button>
              )}

              {active && status !== "success" && (
                <GradedImage
                  src={active.url}
                  alt={active.file.name}
                  adjustments={adjustments}
                  className="h-full w-full"
                  imgClassName="max-h-[460px] w-full object-contain"
                />
              )}

              {active && status === "success" && resultUrl && (
                <BeforeAfter
                  label="Compare original and graded image"
                  before={
                    <img
                      src={active.url}
                      alt="Original"
                      className="max-h-[460px] w-full object-contain"
                    />
                  }
                  after={
                    <img
                      src={resultUrl}
                      alt="Graded result"
                      className="max-h-[460px] w-full object-contain"
                    />
                  }
                />
              )}

              {busy && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
                  <Loader2 size={26} strokeWidth={2} className="animate-spin text-volt" />
                  <p className="text-[14px] font-semibold text-foreground">
                    Applying your grade…
                  </p>
                  <p className="text-[13px] font-medium text-muted-foreground">
                    Rendering tone, colour and grain. This takes a moment.
                  </p>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="mt-4">
                <ImageTray
                  images={images}
                  activeId={activeId}
                  onSelect={(id) => {
                    setActiveId(id);
                    setResult(null);
                    setStatus("ready");
                  }}
                  onRemove={remove}
                  onReplace={replace}
                  onAdd={acceptFiles}
                />
              </div>
            )}

            {status === "success" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={download}
                  className="button-cta flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Download size={16} strokeWidth={2} />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => void generate()}
                  className="button-utility flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RefreshCw size={16} strokeWidth={2} />
                  Generate again
                </button>
              </div>
            )}

            {status === "error" && (
              <div
                className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border p-3"
                style={{ borderColor: "var(--coral-bdr)", background: "var(--coral-dim)" }}
              >
                <AlertTriangle size={16} strokeWidth={2} className="text-destructive" />
                <p className="min-w-0 flex-1 text-[13px] font-medium text-foreground">
                  {error ?? "Generation failed"}
                </p>
                <button
                  type="button"
                  onClick={() => void generate()}
                  className="button-utility flex h-11 items-center gap-2 rounded-full px-4 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RefreshCw size={15} strokeWidth={2} />
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Controls column */}
          <div
            className="glass min-w-0 space-y-6 rounded-2xl p-4 sm:p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="grade-prompt"
                  className="font-display text-[13px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  Describe your look
                </label>
                <span className="badge-sky">AI</span>
              </div>
              <Textarea
                id="grade-prompt"
                value={prompt}
                onChange={(e) => {
                  invalidate();
                  setPrompt(e.target.value);
                }}
                placeholder="Warm 35mm film, muted greens, soft highlights…"
                rows={3}
                className="mt-3 rounded-xl border text-[16px] sm:text-[15px]"
                style={{ background: "var(--tile)", borderColor: "var(--card-border)" }}
              />
              <p className="mt-2 text-[12px] font-medium text-muted-foreground">
                Optional. Your prompt is combined with the selected preset and
                the manual settings below.
              </p>
            </div>

            <AdjustmentPanel
              values={adjustments}
              onChange={updateAdjustment}
              onResetKey={resetKey}
              onResetAll={resetAll}
            />

            <div>
              <button
                type="button"
                disabled={!active || busy}
                onClick={() => void generate()}
                className="button-cta flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  opacity: !active || busy ? 0.45 : 1,
                  cursor: !active || busy ? "not-allowed" : "pointer",
                }}
              >
                {busy ? (
                  <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                ) : (
                  <Sparkles size={18} strokeWidth={2} />
                )}
                {busy ? "Generating…" : "Generate"}
              </button>
              <p className="mt-3 text-center text-[12px] font-medium text-muted-foreground">
                {status === "idle"
                  ? "Add an image to unlock grading."
                  : status === "success"
                    ? "Result ready — drag the handle to compare."
                    : "Preview updates live as you adjust."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ThreeSteps />
      <SeeItInAction />
      <BuiltForCinematicLooks
        onCTA={() =>
          dropRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      />
      <ExploreMoreApps />
    </div>
  );
}