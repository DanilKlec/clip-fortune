export function RobinzoneMark({
  size = 36,
  radius,
  glow = true,
}: {
  size?: number;
  radius?: number;
  glow?: boolean;
}) {
  const r = radius ?? Math.round(size * 0.28);
  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center bg-primary text-primary-foreground${glow ? " shadow-glow-volt" : ""}`}
      style={{ width: size, height: size, borderRadius: r }}
    >
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="M3 15L13 7l4 4-2 7-12-3z" fill="currentColor" />
        <path d="M13 7l9-1-5 5z" fill="currentColor" opacity="0.7" />
        <path d="M3 15l12 3-4-6z" style={{ fill: "var(--background)" }} opacity="0.18" />
        <circle cx="14.4" cy="9.4" r="0.8" style={{ fill: "var(--background)" }} />
      </svg>
    </span>
  );
}
