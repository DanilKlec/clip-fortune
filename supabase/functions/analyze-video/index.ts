// deno-lint-ignore-file no-explicit-any
// Real virality analysis via Lovable AI Gateway (Gemini 2.5 Pro).
// Receives sampled frames from the client, asks Gemini for a structured
// JSON analysis, and enforces a persistent weekly per-user rate limit.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WEEKLY_LIMIT = 50;
const MODEL = "google/gemini-2.5-pro";
const FALLBACK_MODEL = "google/gemini-2.5-flash";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const STT_URL = "https://ai.gateway.lovable.dev/v1/audio/transcriptions";
const STT_MODEL = "openai/gpt-4o-transcribe";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logErr(
  supabaseUrl: string,
  serviceKey: string,
  entry: {
    severity?: "error" | "warning" | "info";
    kind: string;
    message: string;
    user_id?: string;
    context?: Record<string, unknown>;
  },
) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/app_error_log`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        source: "edge_fn",
        severity: entry.severity ?? "error",
        kind: entry.kind,
        message: entry.message.slice(0, 2000),
        route: "analyze-video",
        context: { ...(entry.context ?? {}), user_id: entry.user_id },
      }),
    });
  } catch (_e) {
    // swallow — logging must never break the main flow
  }
}

function weekStartISO(): string {
  // ISO week start (Monday) UTC
  const d = new Date();
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

const SYSTEM_PROMPT = `You are a senior short-form video strategist for TikTok, Reels, and YouTube Shorts. Analyze a video from evenly-sampled frames and return a rigorous virality prediction.

You MUST return ONLY a single valid JSON object matching this exact schema — no prose, no markdown, no code fences:

{
  "overall_score": <int 0-100>,
  "virality_tier": "low" | "below_average" | "average" | "high" | "very_high",
  "verdict": "<one concise sentence>",
  "audience": {
    "primary": { "gender": "male"|"female"|"all", "age_range": "<e.g. 18-24>", "label": "<short persona>", "interests": ["...", "..."], "why": "<one sentence>" },
    "secondary": { "gender": "male"|"female"|"all", "age_range": "<...>", "label": "<...>", "interests": ["...", "..."] },
    "audience_width": "narrow" | "medium" | "broad",
    "targeting_tip": "<one actionable sentence>"
  },
  "factors": [
    { "key": "hook", "name": "Hook (first 3 sec)", "score": <0-100>, "finding": "<...>", "fix": "<...>" },
    { "key": "retention", "name": "Retention", "score": <0-100>, "finding": "<...>", "fix": "<...>" },
    { "key": "silent_watch", "name": "Sound-off watchability", "score": <0-100>, "finding": "<...>", "fix": "<...>" },
    { "key": "payoff", "name": "Payoff", "score": <0-100>, "finding": "<...>", "fix": "<...>" },
    { "key": "shareability", "name": "Shareability", "score": <0-100>, "finding": "<...>", "fix": "<...>" },
    { "key": "platform_fit", "name": "Platform fit", "score": <0-100>, "finding": "<...>", "fix": "<...>" }
  ],
  "top_fixes": [
    { "timecode": "0:00-0:02", "issue": "<...>", "action": "<...>", "impact": "high"|"medium"|"low", "effort": "quick"|"moderate"|"reshoot" }
  ],
  "strengths": ["<3-5 items>"],
  "attention_curve": [ { "second": <int>, "value": <0-100> } ],
  "drop_off_points": [ { "timecode": "0:04", "reason": "<...>" } ],
  "safety": {
    "score": <0-100>,
    "flags": [ { "category": "<...>", "severity": "high"|"medium"|"low", "note": "<...>" } ]
  },
  "hook_variants": ["<3 alternative opening hooks>"]
,
  "brain_signals": {
    "regions": [
      { "key": "visual_cortex",    "name": "Visual Cortex",    "score": <0-100>, "evidence": "<one concrete observation from the frames>" },
      { "key": "auditory_cortex",  "name": "Auditory Cortex",  "score": <0-100>, "evidence": "<...>" },
      { "key": "language_network", "name": "Language Network", "score": <0-100>, "evidence": "<...>" },
      { "key": "limbic_emotion",   "name": "Emotion (limbic)", "score": <0-100>, "evidence": "<...>" },
      { "key": "memory_encoding",  "name": "Memory Encoding",  "score": <0-100>, "evidence": "<...>" },
      { "key": "attention_control","name": "Attention Control","score": <0-100>, "evidence": "<...>" }
    ],
    "cognitive_load": <0-100, higher = more overloaded>,
    "focus_drift_seconds": [<seconds where attention likely dips>],
    "av_sync_score": <0-100, audio/visual coherence>,
    "brand_recall_index": <0-100, memory encoding weighted by early brand appearance>
  }
}

Rules:
- Base every observation on what you actually see in the frames (composition, subject, text overlays, lighting, pacing implied by frame variation, on-screen captions, faces).
- attention_curve MUST have one entry per whole second from 0 to floor(duration), values 0-100 reflecting predicted % viewers still watching.
- top_fixes: 3-5 items ordered by impact.
- Vary numbers realistically across factors (do not return identical scores).
- Keep verdict + findings honest — if the video looks weak, say so.
- brain_signals.regions: each score must be grounded in a concrete visual/audio cue you can point to (face in frame at 0-1s, high-contrast cut at 2s, on-screen text with 4+ words, sudden scene change). Do NOT invent neurological data — you are estimating proxy signals from the frames.
- focus_drift_seconds should be consistent with dips in attention_curve.
- If a spoken transcript is provided, use it to ground Hook, Language Network, Payoff and Shareability scores, and generate hook_variants in the SAME language as the transcript. Quote or paraphrase actual spoken words in your findings/evidence.
- If no transcript is provided (or it is empty), score Language Network and Auditory Cortex from visual proxies only (on-screen captions, visible lip movement, subject type) and say so explicitly in the evidence.`;

async function callGemini(
  model: string,
  apiKey: string,
  userContent: any[],
  timeoutMs: number,
): Promise<{ res: Response | null; timedOut: boolean; error?: unknown }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
      signal: ctrl.signal,
    });
    return { res, timedOut: false };
  } catch (e) {
    const aborted = (e as Error)?.name === "AbortError";
    return { res: null, timedOut: aborted, error: e };
  } finally {
    clearTimeout(timer);
  }
}

function tryParseJson(text: string): any | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Attempt to extract the first {...} block
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalizeResult(raw: any, duration: number, video_path: string, platform: string) {
  const clamp = (n: any, lo = 0, hi = 100) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return lo;
    return Math.max(lo, Math.min(hi, Math.round(v)));
  };
  const score = clamp(raw?.overall_score ?? 50);
  const tiers = ["low", "below_average", "average", "high", "very_high"];
  let tier = tiers.includes(raw?.virality_tier) ? raw.virality_tier : null;
  if (!tier) {
    tier =
      score >= 85 ? "very_high" :
      score >= 70 ? "high" :
      score >= 50 ? "average" :
      score >= 35 ? "below_average" : "low";
  }

  const seconds = Math.max(1, Math.floor(duration || 15));
  let curve = Array.isArray(raw?.attention_curve) ? raw.attention_curve : [];
  curve = curve
    .map((p: any) => ({ second: Number(p?.second), value: clamp(p?.value) }))
    .filter((p: any) => Number.isFinite(p.second));
  if (curve.length === 0) {
    curve = Array.from({ length: seconds }, (_, i) => ({ second: i, value: 60 }));
  }

  return {
    overall_score: score,
    virality_tier: tier,
    verdict: String(raw?.verdict ?? "Analysis complete."),
    audience: raw?.audience ?? {
      primary: { gender: "all", age_range: "18-34", label: "General", interests: [] },
      secondary: { gender: "all", age_range: "25-44", label: "Secondary", interests: [] },
      audience_width: "medium",
      targeting_tip: "",
    },
    factors: Array.isArray(raw?.factors) ? raw.factors : [],
    top_fixes: Array.isArray(raw?.top_fixes) ? raw.top_fixes : [],
    strengths: Array.isArray(raw?.strengths) ? raw.strengths : [],
    attention_curve: curve,
    drop_off_points: Array.isArray(raw?.drop_off_points) ? raw.drop_off_points : [],
    safety: raw?.safety ?? { score: 90, flags: [] },
    hook_variants: Array.isArray(raw?.hook_variants) ? raw.hook_variants : [],
    brain_signals: computeBrainSignals(raw, curve, clamp),
    meta: { video_path, platform },
  };
}

// Neuromarketing composite. Based on Nielsen Consumer Neuroscience (memory encoding
// → +23% sales lift; A/V coherence → +15% purchase intent), Kantar LINK+ attention
// research, TikTok Marketing Science (63% brand recall in first 6s), and
// Ramsøy (2015) AIDA-neuro framework.
const BRAIN_WEIGHTS = {
  attention: 0.30,
  emotion: 0.20,
  memory: 0.20,
  cognitive_load_inv: 0.15,
  sensory_coherence: 0.10,
  social_currency: 0.05,
};

function computeBrainSignals(
  raw: any,
  curve: Array<{ second: number; value: number }>,
  clamp: (n: any, lo?: number, hi?: number) => number,
) {
  const bs = raw?.brain_signals ?? {};
  const regionsIn: any[] = Array.isArray(bs?.regions) ? bs.regions : [];
  const REGION_KEYS = [
    ["visual_cortex", "Visual Cortex"],
    ["auditory_cortex", "Auditory Cortex"],
    ["language_network", "Language Network"],
    ["limbic_emotion", "Emotion (limbic)"],
    ["memory_encoding", "Memory Encoding"],
    ["attention_control", "Attention Control"],
  ] as const;

  const regions = REGION_KEYS.map(([key, name]) => {
    const found = regionsIn.find((r) => r?.key === key);
    return {
      key,
      name,
      score: clamp(found?.score ?? 60),
      evidence: String(found?.evidence ?? ""),
    };
  });

  const byKey: Record<string, number> = Object.fromEntries(regions.map((r) => [r.key, r.score]));

  const factors: any[] = Array.isArray(raw?.factors) ? raw.factors : [];
  const fScore = (k: string, fallback: number) =>
    clamp(factors.find((f) => f?.key === k)?.score ?? fallback);

  const attention = Math.round(
    byKey.visual_cortex * 0.5 +
      byKey.attention_control * 0.3 +
      fScore("hook", byKey.attention_control) * 0.2,
  );
  const emotion = byKey.limbic_emotion;
  const memory = byKey.memory_encoding;
  const cognitive_load = clamp(bs?.cognitive_load ?? 40);
  const cognitive_load_inv = 100 - cognitive_load;
  const av_sync = clamp(
    bs?.av_sync_score ?? Math.round((byKey.visual_cortex + byKey.auditory_cortex) / 2),
  );
  const sensory_coherence = av_sync;
  const social_currency = fScore("shareability", 50);

  const composite_score = clamp(
    attention * BRAIN_WEIGHTS.attention +
      emotion * BRAIN_WEIGHTS.emotion +
      memory * BRAIN_WEIGHTS.memory +
      cognitive_load_inv * BRAIN_WEIGHTS.cognitive_load_inv +
      sensory_coherence * BRAIN_WEIGHTS.sensory_coherence +
      social_currency * BRAIN_WEIGHTS.social_currency,
  );

  const earlyAvg =
    curve.length > 0
      ? curve.slice(0, Math.min(6, curve.length)).reduce((s, p) => s + p.value, 0) /
        Math.min(6, curve.length)
      : 60;
  const brand_recall_index = clamp(byKey.memory_encoding * 0.6 + earlyAvg * 0.4);

  let focus_drift_seconds: number[] = Array.isArray(bs?.focus_drift_seconds)
    ? bs.focus_drift_seconds.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n))
    : [];
  if (focus_drift_seconds.length === 0 && curve.length > 3) {
    for (let i = 1; i < curve.length - 1; i++) {
      const drop = curve[i - 1].value - curve[i].value;
      if (drop >= 8 && curve[i].value < 60) focus_drift_seconds.push(curve[i].second);
    }
    focus_drift_seconds = focus_drift_seconds.slice(0, 3);
  }

  return {
    composite_score,
    regions,
    cognitive_load,
    focus_drift_seconds,
    av_sync_score: av_sync,
    brand_recall_index,
    formula_breakdown: {
      attention,
      emotion,
      memory,
      cognitive_load_inv,
      sensory_coherence,
      social_currency,
    },
    references: [
      "Nielsen Consumer Neuroscience (EEG memory encoding)",
      "Kantar LINK+ attention research",
      "TikTok Marketing Science 2023",
      "Ramsøy 2015 — Introduction to Neuromarketing",
    ],
  };
}

function detectLangFromText(text: string): string {
  if (!text) return "";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  if (/[\u3040-\u30FF]/.test(text)) return "ja";
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u0590-\u05FF]/.test(text)) return "he";
  if (/[àâçéèêëîïôûùüÿœæ]/i.test(text)) return "fr";
  if (/[äöüß]/i.test(text)) return "de";
  if (/[ñáéíóúü¿¡]/i.test(text)) return "es";
  return "en";
}

function buildSpeechInfo(
  transcript: string,
  duration: number,
  sttError: string,
  audioSent: boolean,
) {
  const t = transcript.trim();
  if (!t) {
    return {
      available: false,
      transcript: "",
      language: "",
      hook_line: "",
      words_per_second: 0,
      notes: !audioSent
        ? "No audio track detected in the upload."
        : sttError
          ? "Transcription unavailable — analysis based on visuals only."
          : "No speech detected (music, ambience or silence).",
    };
  }
  const firstSentence = (t.match(/^[^.!?\n]{3,140}[.!?]?/)?.[0] ?? t.slice(0, 140)).trim();
  const words = t.split(/\s+/).filter(Boolean).length;
  const wps = duration > 0 ? Number((words / duration).toFixed(2)) : 0;
  return {
    available: true,
    transcript: t.slice(0, 600),
    language: detectLangFromText(t),
    hook_line: firstSentence,
    words_per_second: wps,
    notes: "",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      await logErr(supabaseUrl, serviceKey, {
        kind: "config_missing",
        message: "LOVABLE_API_KEY not set",
        severity: "error",
      });
      return json({ error: "AI not configured" }, 500);
    }

    const startedAt = Date.now();

    // Identify caller
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: anonKey },
    });
    if (!userRes.ok) return json({ error: "Unauthorized" }, 401);
    const user = (await userRes.json()) as { id?: string };
    if (!user?.id) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const video_path: string = body.video_path ?? "";
    const platform: string = body.platform ?? "auto";
    const frames: string[] = Array.isArray(body.frames) ? body.frames : [];
    const duration: number = Number(body.duration) || 15;
    const audio_path: string | null = typeof body.audio_path === "string" ? body.audio_path : null;
    if (!video_path) return json({ error: "video_path required" }, 400);
    if (frames.length === 0) return json({ error: "frames required" }, 400);

    // Persistent weekly rate limit via usage_counters table (service role).
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const week = weekStartISO();

    const { data: existing } = await admin
      .from("usage_counters")
      .select("used")
      .eq("user_id", user.id)
      .eq("week_start", week)
      .maybeSingle();

    const usedSoFar = existing?.used ?? 0;
    if (usedSoFar >= WEEKLY_LIMIT) {
      await logErr(supabaseUrl, serviceKey, {
        kind: "rate_limited_weekly",
        message: "User hit weekly analysis limit",
        severity: "warning",
        user_id: user.id,
        context: { limit: WEEKLY_LIMIT },
      });
      return json(
        { error: "rate_limited", usage: { used: WEEKLY_LIMIT, limit: WEEKLY_LIMIT, remaining: 0 } },
        429,
      );
    }

    // Optional STT step — non-fatal.
    let transcript = "";
    let sttError = "";
    if (audio_path) {
      try {
        const { data: audioBlob, error: dlErr } = await admin.storage
          .from("videos")
          .download(audio_path);
        if (dlErr) throw dlErr;
        const form = new FormData();
        form.append("model", STT_MODEL);
        form.append("file", audioBlob, "audio.wav");
        const sttRes = await fetch(STT_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}` },
          body: form,
        });
        if (sttRes.ok) {
          const payload = await sttRes.json().catch(() => ({}));
          transcript = String(payload?.text ?? "").trim();
        } else {
          sttError = `STT ${sttRes.status}`;
          console.error("STT failed", sttRes.status, (await sttRes.text().catch(() => "")).slice(0, 200));
          await logErr(supabaseUrl, serviceKey, {
            kind: "stt_http",
            message: `STT returned ${sttRes.status}`,
            severity: "warning",
            user_id: user.id,
            context: { status: sttRes.status },
          });
        }
      } catch (e) {
        sttError = (e as Error).message ?? "stt failed";
        console.error("STT exception", e);
        await logErr(supabaseUrl, serviceKey, {
          kind: "stt_exception",
          message: sttError,
          severity: "warning",
          user_id: user.id,
        });
      }
    }
    const transcriptForModel = transcript.slice(0, 2000);

    // Build multimodal user content: instruction + frames (cap at 8 to reduce latency)
    const userContent: any[] = [
      {
        type: "text",
        text:
          `Platform: ${platform}. Duration: ${duration.toFixed(1)}s. Frames sampled evenly across the clip (first frame ≈ start, last ≈ end). Analyze and respond with the JSON schema exactly.\n\n` +
          (transcriptForModel
            ? `Spoken content (verbatim transcript):\n"""${transcriptForModel}"""`
            : `Spoken content: (none available — score audio/language from visuals).`),
      },
      ...frames.slice(0, 8).map((url) => ({
        type: "image_url",
        image_url: { url },
      })),
    ];

    // Budget: primary Pro ~70s, fallback Flash uses whatever remains up to ~55s.
    // Edge function hard limit is 150s.
    const primary = await callGemini(MODEL, lovableKey, userContent, 70_000);
    const shouldFallback =
      primary.timedOut ||
      !primary.res ||
      primary.res.status === 429 ||
      primary.res.status >= 500;

    let aiRes: Response | null = primary.res;
    if (shouldFallback) {
      if (primary.timedOut) console.warn("Primary model timed out, falling back to", FALLBACK_MODEL);
      else if (!primary.res) console.warn("Primary model error, falling back:", primary.error);
      else console.warn("Primary model status", primary.res.status, "→ fallback");
      await logErr(supabaseUrl, serviceKey, {
        kind: "ai_primary_fallback",
        message: primary.timedOut
          ? "Primary AI model timed out"
          : primary.res
            ? `Primary AI model status ${primary.res.status}`
            : "Primary AI model network error",
        severity: "warning",
        user_id: user.id,
        context: { model: MODEL, fallback: FALLBACK_MODEL },
      });
      const fb = await callGemini(FALLBACK_MODEL, lovableKey, userContent, 55_000);
      if (fb.timedOut || !fb.res) {
        console.error("Fallback also failed", { timedOut: fb.timedOut, error: fb.error });
        await logErr(supabaseUrl, serviceKey, {
          kind: "ai_gateway_unavailable",
          message: "Both AI models failed",
          severity: "error",
          user_id: user.id,
          context: { primary: MODEL, fallback: FALLBACK_MODEL, timedOut: fb.timedOut },
        });
        return json({ error: "AI unavailable — please try again" }, 503);
      }
      aiRes = fb.res;
    }

    if (!aiRes) return json({ error: "AI unavailable — please try again" }, 503);
    if (aiRes.status === 402) {
      await logErr(supabaseUrl, serviceKey, {
        kind: "ai_credits_exhausted",
        message: "AI Gateway returned 402",
        severity: "error",
        user_id: user.id,
      });
      return json({ error: "AI credits exhausted" }, 402);
    }
    if (aiRes.status === 429) {
      await logErr(supabaseUrl, serviceKey, {
        kind: "ai_gateway_429",
        message: "AI Gateway rate-limited",
        severity: "warning",
        user_id: user.id,
      });
      return json({ error: "AI rate limit — try again in a minute" }, 429);
    }
    if (!aiRes.ok) {
      const t = await aiRes.text().catch(() => "");
      console.error("Gateway error", aiRes.status, t.slice(0, 500));
      await logErr(supabaseUrl, serviceKey, {
        kind: "ai_gateway_5xx",
        message: `AI Gateway returned ${aiRes.status}`,
        severity: "error",
        user_id: user.id,
        context: { status: aiRes.status, body: t.slice(0, 500) },
      });
      return json({ error: "AI unavailable" }, 502);
    }

    const payload = await aiRes.json();
    const text: string = payload?.choices?.[0]?.message?.content ?? "";
    let parsed = tryParseJson(text);
    if (!parsed) {
      console.error("Could not parse AI JSON, first 300 chars:", text.slice(0, 300));
      await logErr(supabaseUrl, serviceKey, {
        kind: "ai_invalid_json",
        message: "AI returned invalid JSON",
        severity: "error",
        user_id: user.id,
        context: { preview: text.slice(0, 300) },
      });
      return json({ error: "AI returned invalid JSON" }, 502);
    }

    const result = normalizeResult(parsed, duration, video_path, platform);
    (result as any).speech = buildSpeechInfo(transcript, duration, sttError, Boolean(audio_path));

    // Increment usage counter
    const newUsed = usedSoFar + 1;
    await admin.from("usage_counters").upsert({
      user_id: user.id,
      week_start: week,
      used: newUsed,
    }, { onConflict: "user_id,week_start" });

    const durationMs = Date.now() - startedAt;
    if (durationMs > 60_000) {
      await logErr(supabaseUrl, serviceKey, {
        kind: "analyze_slow",
        message: `Analysis took ${(durationMs / 1000).toFixed(1)}s`,
        severity: "warning",
        user_id: user.id,
        context: { durationMs },
      });
    }

    return json({
      result,
      usage: { used: newUsed, limit: WEEKLY_LIMIT, remaining: WEEKLY_LIMIT - newUsed },
    });
  } catch (e) {
    console.error("analyze-video error", e);
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceKey) {
        await logErr(supabaseUrl, serviceKey, {
          kind: "unhandled",
          message: (e as Error)?.message ?? "unknown",
          severity: "error",
          context: { stack: ((e as Error)?.stack ?? "").slice(0, 2000) },
        });
      }
    } catch (_) { /* noop */ }
    return json({ error: (e as Error).message ?? "unknown" }, 500);
  }
});