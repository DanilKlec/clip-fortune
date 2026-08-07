import { useEffect, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { UploadCloud, Film, Sparkles, Loader2 } from "lucide-react";
import { HeroPreviewCard } from "./landing/HeroPreviewCard";
import { HowItWorks } from "./landing/HowItWorks";
import { EngagementScore } from "./landing/EngagementScore";
import { FinalCTA } from "./landing/FinalCTA";
import { ExploreMoreApps } from "./landing/ExploreMoreApps";
import {
  MAX_DURATION_SEC,
  MAX_FILE_MB,
  checkVideoDuration,
} from "@/lib/virality-api";
import type { UsageInfo } from "@/lib/virality-mock";
import { useViralitySession, type Platform } from "@/lib/virality-session";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  initialFile?: File | null;
  usage?: UsageInfo | null;
}

const platforms: { id: Platform; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "reels", label: "Reels" },
  { id: "shorts", label: "Shorts" },
  { id: "auto", label: "Auto-detect" },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadScreen({ initialFile, usage }: Props) {
  const { analyze, analyzing } = useViralitySession();
  const [file, setFile] = useState<File | null>(initialFile ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("auto");
  const [dragOver, setDragOver] = useState(false);
  const [validating, setValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const scrollToDrop = () => {
    dropRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToBrain = () => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const el = document.getElementById("brain-card");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePredict = () => {
    if (!file) return;
    void analyze(file, platform);
    setTimeout(scrollToBrain, 50);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!/\.(mp4|mov)$/i.test(f.name)) {
      toast.error("Only MP4 or MOV files are supported");
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File is too large — max ${MAX_FILE_MB} MB`);
      return;
    }
    setValidating(true);
    try {
      const duration = await checkVideoDuration(f);
      if (duration > MAX_DURATION_SEC) {
        toast.error(`Video is too long — max ${MAX_DURATION_SEC} seconds`);
        return;
      }
      setFile(f);
    } catch {
      toast.error("Couldn't read the video — try a different file");
    } finally {
      setValidating(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="w-full">
      {/* Usage counter */}
      {/* HERO */}
      <section className="page-shell mx-auto w-full max-w-6xl pt-6 sm:pt-8 md:pt-10">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-[13px] font-medium text-muted-foreground sm:mb-6"
        >
          <a
            href="#explore-apps"
            className="transition-colors hover:text-foreground"
          >
            Apps
          </a>
          <span aria-hidden>/</span>
          <span className="text-foreground">Virality Predictor</span>
        </nav>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:items-stretch">
          {/* Left: upload */}
          <div id="upload-card" className="flex h-full min-w-0 flex-col">
            {/* Dropzone card */}
            <div
              ref={dropRef}
              className="glass flex flex-1 flex-col rounded-2xl p-4 sm:p-5"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h1 className="px-1 font-display text-[clamp(1.75rem,6vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground [text-wrap:balance]">
                Viral Potential{" "}
                <span className="bg-gradient-to-b from-volt to-volt/60 bg-clip-text text-transparent">
                  Predictor
                </span>
              </h1>
              <p className="mt-3 px-1 pb-4 text-[14px] font-medium leading-relaxed text-muted-foreground">
                Upload a short clip and get a modeled read on its hook strength, attention curve, and viral potential.
              </p>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex-1 cursor-pointer overflow-hidden rounded-xl text-center transition-colors ${
                  file
                    ? "min-h-[220px] p-3"
                    : "flex min-h-[220px] flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10"
                }`}
                style={{
                  background: dragOver ? "var(--volt-dim)" : "var(--tile)",
                  border: `1.5px dashed ${
                    dragOver ? "var(--volt)" : "var(--card-border)"
                  }`,
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,.mp4,.mov"
                  className="hidden"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    void handleFiles(e.target.files)
                  }
                />
                {!file && (
                  <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: "var(--tile)" }}
                  >
                    <UploadCloud size={22} strokeWidth={1.5} className="text-volt" />
                  </div>
                )}
                {file ? (
                  <div className="flex h-full w-full items-stretch justify-start gap-3 sm:gap-4 lg:justify-center">
                    {previewUrl ? (
                      <div
                        className="pointer-events-none aspect-[9/16] h-full shrink-0 overflow-hidden rounded-xl border"
                        style={{
                          borderColor: "var(--card-border)",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.10)",
                          background: "var(--tile)",
                          maxWidth: "45%",
                        }}
                      >
                        <video
                          src={previewUrl}
                          muted
                          loop
                          playsInline
                          autoPlay
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-full"
                        style={{ background: "var(--tile)" }}
                      >
                        <Film size={22} strokeWidth={1.5} className="text-volt" />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-col justify-center text-left">
                      <div className="truncate text-[15px] font-semibold text-foreground">
                        {file.name}
                      </div>
                      <div className="mt-0.5 text-[13px] font-medium text-muted-foreground">
                        {formatSize(file.size)}
                      </div>
                      <div className="mt-1 text-[13px] font-medium text-muted-foreground">
                        Click to replace
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 text-[15px] font-medium text-foreground">
                      Drop your video to predict viral potential
                    </div>
                    <div className="mt-1 text-[13px] font-medium text-muted-foreground">
                      Upload from device · MP4 or MOV
                    </div>
                  </>
                )}
              </div>

              {/* Platform dropdown */}
              <div className="mt-4 px-1">
                <Select
                  value={platform}
                  onValueChange={(v) => setPlatform(v as Platform)}
                >
                  <SelectTrigger
                    aria-label="Platform"
                    className="h-10 w-full rounded-full border px-4 text-[13px] font-semibold text-foreground sm:w-[200px]"
                    style={{
                      background: "var(--tile)",
                      borderColor: "var(--card-border)",
                    }}
                  >
                    <SelectValue placeholder="Auto-detect" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {platforms.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        className="text-[13px] font-semibold"
                      >
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                disabled={!file || validating || analyzing}
                onClick={handlePredict}
                className="button-cta mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--card)]"
                style={{
                  opacity: file && !validating && !analyzing ? 1 : 0.45,
                  cursor:
                    file && !validating && !analyzing ? "pointer" : "not-allowed",
                }}
              >
                {analyzing ? (
                  <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                ) : (
                  <Sparkles size={18} strokeWidth={2} />
                )}
                {analyzing
                  ? "Analyzing…"
                  : validating
                    ? "Checking video..."
                    : "Predict Viral Potential"}
              </button>

              <p className="mt-3 text-center text-[12px] font-medium text-muted-foreground">
                Max video duration is {MAX_DURATION_SEC} seconds, up to {MAX_FILE_MB} MB.
              </p>
            </div>
          </div>

          {/* Right: sample result preview */}
          <div className="h-full min-w-0">
            <HeroPreviewCard />
          </div>
        </div>
      </section>

      <HowItWorks />
      <EngagementScore />
      <FinalCTA onCTA={scrollToDrop} />
      <ExploreMoreApps />
    </div>
  );
}

export type { Platform };