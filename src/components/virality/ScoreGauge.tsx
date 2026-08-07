import { useEffect, useState } from "react";

interface Props {
  score: number;
  tierLabel: string;
  size?: number;
  compact?: boolean;
}

export function ScoreGauge({ score, tierLabel, size = 240, compact }: Props) {
  const [progress, setProgress] = useState(0);
  const stroke = compact ? 12 : 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // 3/4 arc
  const arcLength = circumference * 0.75;
  const offset = arcLength - (progress / 100) * arcLength;

  useEffect(() => {
    const t = setTimeout(() => setProgress(score), 80);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(135deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          style={{ stroke: "var(--tile)" }}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          style={{ stroke: "var(--volt)", transition: "stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)" }}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`font-bold tracking-tight text-foreground ${compact ? "text-[40px]" : "text-6xl"}`}>
          {Math.round(progress)}
        </div>
        <div className={`mt-1 font-medium text-muted-foreground ${compact ? "text-[10px]" : "text-[13px]"}`}>
          out of 100
        </div>
        <div
          className={`mt-2 rounded-full px-3 py-1 font-semibold ${compact ? "text-[8px]" : "text-[12px]"}`}
          style={{
            background: "var(--sky-dim)",
            border: "1px solid var(--sky-bdr)",
            color: "var(--sky)",
          }}
        >
          {tierLabel}
        </div>
      </div>
    </div>
  );
}