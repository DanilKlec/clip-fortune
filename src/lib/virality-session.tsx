import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  ensureAnonSession,
  uploadVideo,
  uploadAudio,
  analyzeVideo,
  type RateLimitError,
  type AiUnavailableError,
} from "@/lib/virality-api";
import { extractFrames } from "@/lib/video-frames";
import { extractAudioWav } from "@/lib/video-audio";
import type { ViralityResult, UsageInfo } from "@/lib/virality-mock";
import {
  saveAnalysis,
  getAnalysis,
  type AnalysisRecord,
} from "@/lib/analyses-store";

export type Platform = "tiktok" | "reels" | "shorts" | "auto";
export type AnalyzePhase = "sampling" | "uploading" | "analyzing";

interface SessionState {
  file: File | null;
  poster: string | null;
  fileName: string | null;
  analyzing: boolean;
  phase: AnalyzePhase;
  result: ViralityResult | null;
  usage: UsageInfo | null;
  rateLimit: UsageInfo | null;
  analyze: (file: File, platform: Platform) => Promise<void>;
  loadFromRecord: (rec: AnalysisRecord) => void;
  loadById: (id: string) => Promise<boolean>;
  reset: () => void;
  clearRateLimit: () => void;
}

const Ctx = createContext<SessionState | null>(null);

export function ViralitySessionProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [poster, setPoster] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [phase, setPhase] = useState<AnalyzePhase>("sampling");
  const [result, setResult] = useState<ViralityResult | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [rateLimit, setRateLimit] = useState<UsageInfo | null>(null);

  useEffect(() => {
    ensureAnonSession().catch(() => {});
  }, []);

  const analyze = useCallback(async (f: File, platform: Platform) => {
    setFile(f);
    setFileName(f.name);
    setPoster(null);
    setResult(null);
    setAnalyzing(true);
    setPhase("sampling");
    try {
      const userId = await ensureAnonSession();
      const [{ frames, duration }, audioBlob] = await Promise.all([
        extractFrames(f, 8, 512),
        extractAudioWav(f).catch(() => null),
      ]);
      const posterFrame = frames[0] ?? null;
      setPoster(posterFrame);
      setPhase("uploading");
      const [videoPath, audioPath] = await Promise.all([
        uploadVideo(f, userId),
        audioBlob
          ? uploadAudio(audioBlob, userId).catch(() => null)
          : Promise.resolve(null),
      ]);
      setPhase("analyzing");
      const res = await analyzeVideo(
        videoPath,
        platform,
        frames,
        duration,
        audioPath,
      );
      setResult(res.result);
      setUsage(res.usage);
      // Save to history — best effort, don't block on failure
      saveAnalysis(userId, {
        fileName: f.name,
        fileSize: f.size,
        duration,
        platform,
        poster: posterFrame,
        result: res.result,
        usage: res.usage,
      }).catch((err) => console.error("Failed to save analysis", err));
    } catch (err) {
      const maybe = err as RateLimitError | AiUnavailableError;
      if (maybe && (maybe as RateLimitError).kind === "rate_limited") {
        setRateLimit((maybe as RateLimitError).usage);
      } else if (
        maybe &&
        (maybe as AiUnavailableError).kind === "ai_unavailable"
      ) {
        toast.error((maybe as AiUnavailableError).message);
      } else {
        console.error("Analyze failed", err);
        toast.error("Analysis failed — please try again");
      }
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const loadFromRecord = useCallback((rec: AnalysisRecord) => {
    setFile(null);
    setFileName(rec.file_name);
    setPoster(rec.poster);
    setResult(rec.result);
    setUsage(rec.usage);
    setAnalyzing(false);
  }, []);

  const loadById = useCallback(
    async (id: string) => {
      try {
        const rec = await getAnalysis(id);
        if (!rec) return false;
        loadFromRecord(rec);
        return true;
      } catch (err) {
        console.error("Failed to load analysis", err);
        return false;
      }
    },
    [loadFromRecord],
  );

  const reset = useCallback(() => {
    setFile(null);
    setPoster(null);
    setFileName(null);
    setResult(null);
  }, []);

  const clearRateLimit = useCallback(() => setRateLimit(null), []);

  const value = useMemo<SessionState>(
    () => ({
      file,
      poster,
      fileName,
      analyzing,
      phase,
      result,
      usage,
      rateLimit,
      analyze,
      loadFromRecord,
      loadById,
      reset,
      clearRateLimit,
    }),
    [file, poster, fileName, analyzing, phase, result, usage, rateLimit, analyze, loadFromRecord, loadById, reset, clearRateLimit],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useViralitySession() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useViralitySession must be used within ViralitySessionProvider");
  }
  return ctx;
}