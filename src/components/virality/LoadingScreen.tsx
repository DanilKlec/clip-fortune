import { useEffect, useState } from "react";

const messages = [
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
  "Finalizing your report…",
  "Almost there…",
];

interface Props {
  phase?: "sampling" | "uploading" | "analyzing";
}

export function LoadingScreen({ phase = "analyzing" }: Props) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (phase !== "analyzing") return;
    const i = setInterval(() => setIdx((v) => (v + 1) % messages.length), 3000);
    return () => clearInterval(i);
  }, [phase]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <div className="relative h-24 w-24">
        <svg
          className="animate-spin"
          width={96}
          height={96}
          viewBox="0 0 96 96"
          style={{ animationDuration: "1.4s" }}
        >
          <defs>
            <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "var(--sky)" }} />
              <stop offset="100%" style={{ stopColor: "var(--volt)" }} />
            </linearGradient>
          </defs>
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="var(--tile)"
            strokeWidth="8"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="url(#loaderGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="80 251"
          />
        </svg>
      </div>
      <div className="mt-8 text-[22px] font-semibold text-foreground">
        {phase === "sampling"
          ? "Extracting frames & audio..."
          : phase === "uploading"
          ? "Uploading video..."
          : "Analyzing your video"}
      </div>
      <div
        key={idx + phase}
        className="mt-2 text-[14px] font-medium text-[color:var(--muted-foreground)]"
        style={{ animation: "fadeIn .4s ease" }}
      >
        {phase === "sampling"
          ? "Reading key moments and transcribing speech..."
          : phase === "uploading"
          ? "Sending your clip securely..."
          : messages[idx]}
      </div>
      {phase === "analyzing" && (
        <div className="mt-4 text-[12px] font-medium text-muted-foreground">
          This usually takes about 30 seconds
        </div>
      )}
      <style>{`@keyframes fadeIn { from {opacity:0; transform:translateY(4px)} to {opacity:1; transform:none} }`}</style>
    </div>
  );
}