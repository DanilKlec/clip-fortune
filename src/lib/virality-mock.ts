export type ViralityTier =
  | "low"
  | "below_average"
  | "average"
  | "high"
  | "very_high";

export interface AudienceSegment {
  gender: "male" | "female" | "all";
  age_range: string;
  label: string;
  interests: string[];
  why?: string;
}

export interface ViralityResult {
  overall_score: number;
  virality_tier: ViralityTier;
  verdict: string;
  audience: {
    primary: AudienceSegment;
    secondary: AudienceSegment;
    audience_width: "narrow" | "medium" | "broad";
    targeting_tip: string;
  };
  factors: Array<{
    key: string;
    name: string;
    score: number;
    finding: string;
    fix: string;
  }>;
  top_fixes: Array<{
    timecode: string;
    issue: string;
    action: string;
    impact: "high" | "medium" | "low";
    effort?: "quick" | "moderate" | "reshoot";
  }>;
  strengths: string[];
  attention_curve?: Array<{ second: number; value: number }>;
  drop_off_points?: Array<{ timecode: string; reason: string }>;
  safety?: {
    score: number;
    flags: Array<{
      category: string;
      severity: "high" | "medium" | "low";
      note: string;
    }>;
  };
  hook_variants?: string[];
  brain_signals?: BrainSignals;
  speech?: SpeechInfo;
}

export interface SpeechInfo {
  available: boolean;
  transcript: string;      // preview, may be truncated
  language: string;        // ISO code or "" if unknown
  hook_line: string;       // first spoken line
  words_per_second: number;
  notes: string;           // e.g. "no speech, music only"
}

export interface BrainRegion {
  key:
    | "visual_cortex"
    | "auditory_cortex"
    | "language_network"
    | "limbic_emotion"
    | "memory_encoding"
    | "attention_control";
  name: string;
  score: number;
  evidence: string;
}

export interface BrainSignals {
  composite_score: number;
  regions: BrainRegion[];
  cognitive_load: number;
  focus_drift_seconds: number[];
  av_sync_score: number;
  brand_recall_index: number;
  formula_breakdown: {
    attention: number;
    emotion: number;
    memory: number;
    cognitive_load_inv: number;
    sensory_coherence: number;
    social_currency: number;
  };
  references: string[];
}

export interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
}

export const tierLabel: Record<ViralityTier, string> = {
  low: "Not viral yet",
  below_average: "Below average",
  average: "Average",
  high: "Strong potential",
  very_high: "High viral potential",
};

export const widthLabel: Record<"narrow" | "medium" | "broad", string> = {
  narrow: "Niche",
  medium: "Medium",
  broad: "Mass market",
};

export const viralityMock: ViralityResult = {
  overall_score: 58,
  virality_tier: "average",
  verdict: "Solid concept undermined by a slow hook and a static mid-section.",
  audience: {
    primary: {
      gender: "male",
      age_range: "35-54",
      label: "Men 35-54, cars & fishing",
      interests: ["cars", "fishing", "DIY"],
      why: "Topic, speaker's age, garage setting",
    },
    secondary: {
      gender: "male",
      age_range: "25-34",
      label: "Men 25-34, car detailing",
      interests: ["detailing", "auto tools"],
    },
    audience_width: "medium",
    targeting_tip:
      "Add on-screen captions with niche slang to sharpen the fit.",
  },
  factors: [
    {
      key: "hook",
      name: "Hook (first 3 sec)",
      score: 41,
      finding: "First 2 seconds are a static logo — a classic swipe trigger.",
      fix: "Start mid-action at 0:04 and move the logo to the end.",
    },
    {
      key: "retention",
      name: "Retention",
      score: 55,
      finding: "0:07-0:14 is one static shot.",
      fix: "Cut into 2-3 shots or add a punch-in zoom.",
    },
    {
      key: "silent_watch",
      name: "Sound-off watchability",
      score: 70,
      finding: "Captions present but small.",
      fix: "Increase caption size by ~30%.",
    },
    {
      key: "emotion",
      name: "Emotional trigger",
      score: 62,
      finding: "Mild curiosity, no stakes.",
      fix: "Add a before/after payoff.",
    },
    {
      key: "shareability",
      name: "Shareability",
      score: 48,
      finding: "No reason to send to a friend.",
      fix: "End with a relatable one-liner.",
    },
    {
      key: "platform_fit",
      name: "Platform fit",
      score: 85,
      finding: "Clean 9:16, good light.",
      fix: "Nothing critical.",
    },
  ],
  top_fixes: [
    {
      timecode: "0:00-0:02",
      issue: "Static logo intro",
      action: "Cut it, start mid-action",
      impact: "high",
    },
    {
      timecode: "0:07-0:14",
      issue: "Static shot",
      action: "Split into 2-3 cuts",
      impact: "high",
    },
    {
      timecode: "0:28",
      issue: "Weak ending",
      action: "Loop back to the opening shot",
      impact: "medium",
    },
  ],
  strengths: ["Great lighting", "Captions present", "Clear niche topic"],
};