import { useMemo, useState } from "react";

interface Point {
  second: number;
  value: number;
}

interface DropOff {
  timecode: string;
  reason: string;
}

interface Props {
  points: Point[];
  dropOffs: DropOff[];
  height?: number;
}

function parseTimecode(tc: string): number {
  // "0:04" or "0:06-0:10" or "throughout"
  const first = tc.split(/[–-]/)[0]?.trim();
  if (!first) return NaN;
  const parts = first.split(":").map((n) => parseInt(n, 10));
  if (parts.some(Number.isNaN)) return NaN;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

export function AttentionCurve({ points, dropOffs, height = 220 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 1000; // viewBox width, responsive via preserveAspectRatio
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 24;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const { pathD, areaD, xFor, yFor } = useMemo(() => {
    if (points.length === 0) {
      return { pathD: "", areaD: "", xFor: () => 0, yFor: () => 0 };
    }
    const minX = points[0].second;
    const maxX = points[points.length - 1].second;
    const spanX = Math.max(1, maxX - minX);
    const xFor = (s: number) => padL + ((s - minX) / spanX) * innerW;
    const yFor = (v: number) => padT + (1 - Math.max(0, Math.min(100, v)) / 100) * innerH;

    // Smooth path via Catmull-Rom to Bezier
    const pts = points.map((p) => ({ x: xFor(p.second), y: yFor(p.value) }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    const areaD =
      d +
      ` L ${pts[pts.length - 1].x} ${padT + innerH} L ${pts[0].x} ${padT + innerH} Z`;
    return { pathD: d, areaD, xFor, yFor };
  }, [points, innerH, innerW]);

  const gridYs = [0, 25, 50, 75, 100];
  const thresholdY = yFor(40);

  // Map drop offs onto curve x by matching to nearest point second
  const dropPoints = useMemo(() => {
    return dropOffs
      .map((d) => {
        const t = parseTimecode(d.timecode);
        if (!Number.isFinite(t)) return null;
        // find nearest point
        let nearest = points[0];
        let best = Infinity;
        for (const p of points) {
          const diff = Math.abs(p.second - t);
          if (diff < best) {
            best = diff;
            nearest = p;
          }
        }
        return {
          ...d,
          cx: xFor(nearest.second),
          cy: yFor(nearest.value),
        };
      })
      .filter((d): d is DropOff & { cx: number; cy: number } => d !== null);
  }, [dropOffs, points, xFor, yFor]);

  return (
    <div className="relative w-full px-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Predicted attention curve"
      >
        <defs>
          <linearGradient id="attnFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--sky)" }} stopOpacity="0.32" />
            <stop offset="100%" style={{ stopColor: "var(--sky)" }} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {gridYs.map((g) => {
          const y = yFor(g);
          return (
            <g key={g}>
              <line
                x1={padL}
                x2={width - padR}
                y1={y}
                y2={y}
                stroke="var(--tile)"
                strokeWidth="1"
              />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                style={{ fill: "var(--t2)" }}
                fontWeight="500"
              >
                {g}
              </text>
            </g>
          );
        })}

        {/* Swipe risk threshold */}
        <line
          x1={padL}
          x2={width - padR}
          y1={thresholdY}
          y2={thresholdY}
          style={{ stroke: "var(--volt)" }}
          strokeWidth="1.2"
          strokeDasharray="6 5"
          opacity="0.7"
        />
        <text
          x={width - padR - 6}
          y={thresholdY - 6}
          textAnchor="end"
          fontSize="10.5"
          style={{ fill: "var(--volt)" }}
          fontWeight="600"
        >
          swipe risk zone
        </text>

        {/* Area + line */}
        <path d={areaD} fill="url(#attnFill)" />
        <path
          d={pathD}
          fill="none"
          style={{ stroke: "var(--sky)" }}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X axis seconds */}
        {points.map((p, i) =>
          i % Math.max(1, Math.floor(points.length / 6)) === 0 ? (
            <text
              key={p.second}
              x={xFor(p.second)}
              y={height - 6}
              textAnchor="middle"
              fontSize="10.5"
              style={{ fill: "var(--t2)" }}
              fontWeight="500"
            >
              {p.second}s
            </text>
          ) : null,
        )}

        {/* Drop off markers */}
        {dropPoints.map((d, i) => (
          <g
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((v) => (v === i ? null : v))}
            style={{ cursor: "pointer" }}
          >
            <circle cx={d.cx} cy={d.cy} r={9} style={{ fill: "var(--volt-dim)" }} />
            <circle cx={d.cx} cy={d.cy} r={5} strokeWidth="1.5" style={{ fill: "var(--volt)", stroke: "var(--background)" }} />
            <title>{`${d.timecode} — ${d.reason}`}</title>
          </g>
        ))}
      </svg>

      {hover !== null && dropPoints[hover] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-md"
          style={{
            left: `${(dropPoints[hover].cx / width) * 100}%`,
            top: `${(dropPoints[hover].cy / height) * 100}%`,
            background: "var(--volt)",
            marginTop: -6,
            whiteSpace: "nowrap",
          }}
        >
          {dropPoints[hover].timecode} · {dropPoints[hover].reason}
        </div>
      )}
    </div>
  );
}