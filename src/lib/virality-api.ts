import { supabase } from "@/integrations/supabase/client";
import type { ViralityResult, UsageInfo } from "./virality-mock";

export const MAX_FILE_MB = 100;
export const MAX_DURATION_SEC = 90;

export async function ensureAnonSession(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user?.id) return data.session.user.id;
  const { data: signIn, error } = await supabase.auth.signInAnonymously();
  if (error || !signIn.user) throw new Error("Could not start session");
  return signIn.user.id;
}

export function checkVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      const d = video.duration;
      cleanup();
      if (!Number.isFinite(d)) reject(new Error("Could not read duration"));
      else resolve(d);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Could not read video"));
    };
  });
}

export async function uploadVideo(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const uuid = crypto.randomUUID();
  const path = `${userId}/${uuid}.${ext}`;
  const { error } = await supabase.storage.from("videos").upload(path, file, {
    contentType: file.type || "video/mp4",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function uploadAudio(blob: Blob, userId: string): Promise<string> {
  const uuid = crypto.randomUUID();
  const path = `${userId}/${uuid}.wav`;
  const { error } = await supabase.storage.from("videos").upload(path, blob, {
    contentType: "audio/wav",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export interface AnalyzeResponse {
  result: ViralityResult;
  usage: UsageInfo;
}

export interface RateLimitError {
  kind: "rate_limited";
  usage: UsageInfo;
}

export interface AiUnavailableError {
  kind: "ai_unavailable";
  status: number;
  message: string;
}

export async function analyzeVideo(
  video_path: string,
  platform: string,
  frames: string[],
  duration: number,
  audio_path?: string | null,
): Promise<AnalyzeResponse> {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: { video_path, platform, frames, duration, audio_path: audio_path ?? null },
  });
  // supabase-js throws for non-2xx; try to peek at the status via context.
  if (error) {
    // The response body is often attached under error.context
    const ctx = (error as unknown as { context?: Response }).context;
    if (ctx) {
      if (ctx.status === 429) {
        let usage: UsageInfo = { used: 0, limit: 50, remaining: 0 };
        try {
          const body = await ctx.clone().json();
          if (body?.usage) usage = body.usage;
        } catch {
          /* ignore */
        }
        const err: RateLimitError = { kind: "rate_limited", usage };
        throw err;
      }
      if (ctx.status === 402 || ctx.status === 503) {
        let message =
          ctx.status === 402
            ? "AI credits exhausted — please try again later."
            : "AI is temporarily unavailable — please try again.";
        try {
          const body = await ctx.clone().json();
          if (body?.error && typeof body.error === "string") message = body.error;
        } catch {
          /* ignore */
        }
        const err: AiUnavailableError = {
          kind: "ai_unavailable",
          status: ctx.status,
          message,
        };
        throw err;
      }
    }
    throw error;
  }
  return data as AnalyzeResponse;
}