import { useEffect, useRef, useState } from "react";
import type { AnalyzePhase } from "@/lib/virality-session";

export const PHASE_LABEL: Record<AnalyzePhase, string> = {
  sampling: "Sampling frames…",
  uploading: "Uploading video…",
  analyzing: "Analyzing with AI…",
};

export const ANALYZING_MESSAGES = [
  "Watching the first 3 seconds of your hook…",
  "Reading facial expressions and body language…",
  "Tracking scene changes and cuts…",
  "Measuring visual pacing and rhythm…",
  "Transcribing on-screen text and captions…",
  "Analyzing voice tone and delivery…",
  "Detecting emotional peaks in audio…",
  "Mapping attention curve second by second…",
  "Estimating scroll-stop probability…",
  "Modeling your target audience response…",
  "Simulating cortical response across 720 brains…",
  "Benchmarking against top-performing short-form videos…",
  "Scoring hook strength…",
  "Scoring retention potential…",
  "Scoring shareability signals…",
  "Calculating overall viral score…",
  "Scanning visual cortex triggers…",
  "Balancing cognitive load across edits…",
  "Tuning memory encoding signals…",
  "Measuring emotional resonance…",
  "Polishing the final brain report…",
  "Finalizing your report…",
  "Almost there…",
];

export const PHASE_PROGRESS: Record<AnalyzePhase, number> = {
  sampling: 20,
  uploading: 55,
  analyzing: 85,
};

export function useAnalyzeProgress(
  analyzing: boolean,
  phase: AnalyzePhase,
  ready: boolean,
) {
  const [msgIdx, setMsgIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!analyzing || phase !== "analyzing") return;
    setMsgIdx(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setMsgIdx((v) => {
        if (v >= ANALYZING_MESSAGES.length - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return v;
        }
        return v + 1;
      });
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [analyzing, phase]);

  const text = analyzing
    ? phase === "analyzing"
      ? ANALYZING_MESSAGES[msgIdx]
      : PHASE_LABEL[phase]
    : "";

  // Progress: idle 0, analyzing per phase, ready 100.
  const progress = ready ? 100 : analyzing ? PHASE_PROGRESS[phase] : 0;

  return { text, progress, msgIdx };
}