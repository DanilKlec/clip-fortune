import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Play,
  Pause,
} from "lucide-react";
import { listErrorLog } from "@/lib/admin-errors.functions";
import { getAdminAuthState } from "@/lib/admin-auth.functions";
import { AdminNav, InfoTip } from "@/components/admin/AdminNav";

export const Route = createFileRoute("/admin/errors")({
  head: () => ({
    meta: [
      { title: "Error log — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ErrorLogPage,
});

const RANGES: { label: string; hours: number }[] = [
  { label: "1h", hours: 1 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
];

const SEVERITIES = [
  { value: "", label: "All severities" },
  { value: "error", label: "Errors" },
  { value: "warning", label: "Warnings" },
  { value: "info", label: "Info" },
];

// Human-friendly explanations for the info tooltip next to each stat.
// Cover: what it watches, why it matters, and the visible symptom if broken.
const STAT_TIPS = {
  total:
    "Total events captured in the selected time window (errors + warnings + info). Baseline volume — a sudden spike is your first signal something is off.",
  errors:
    "Real failures the user (or the system) hit. If this number climbs, users are seeing something broken right now — check the anomalies and the table below.",
  warnings:
    "Non-fatal issues we still want to track: rate-limits, retries, invalid OTP codes, brute-force attempts. High numbers may indicate abuse or degraded external services.",
  client:
    "Errors thrown in the user's browser (JS crashes, unhandled promises, chunk-load failures). A spike right after a deploy usually means users are on a stale bundle.",
  server_fn:
    "Errors inside our TanStack server functions (login, saving analyses, admin panel). If this rises, some button in the app is failing for real users.",
  edge_fn:
    "Errors from the /analyze-video edge function: AI Gateway 5xx, invalid JSON from the model, storage failures, timeouts. Directly reflects analysis success rate.",
  auth:
    "Auth-related events: OTP rate-limits, invalid codes, subscription API failures. Watch here when users say 'I can't log in'.",
  email:
    "Delivery pipeline issues (a copy also lives in the Emails tab as DLQ). Useful for correlating email failures with login problems.",
  business:
    "Bespoke business anomalies (paid but not logged in, mismatch between charged users and successful verifies).",
} as const;

const RANGE_TIP =
  "Time window everything on this page is computed for. Shorter windows = fresher signal; longer windows = trend view.";

const ANOMALY_TIP =
  "Automatic red flags computed from recent events (brute-force OTP, subscription API down, AI Gateway problems, mass chunk-load failures after a deploy).";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function SeverityBadge({ s }: { s: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    error: { bg: "#FEE2E2", color: "#B91C1C" },
    warning: { bg: "#FEF9C3", color: "#854D0E" },
    info: { bg: "#DBEAFE", color: "#1D4ED8" },
  };
  const c = map[s] ?? { bg: "#E5E7EB", color: "#374151" };
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ background: c.bg, color: c.color }}
    >
      {s}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
  tip,
}: {
  label: string;
  value: number;
  accent?: string;
  tip?: string;
}) {
  return (
    <div
      className="rounded-[14px] border p-4"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="flex items-center text-[11px] font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">
        <span>{label}</span>
        {tip ? <InfoTip text={tip} /> : null}
      </div>
      <div
        className="mt-1 text-[26px] font-bold leading-none"
        style={{ color: accent ?? "var(--foreground)" }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function MiniChart({
  buckets,
}: {
  buckets: { bucket: string; errors: number; warnings: number }[];
}) {
  const max = Math.max(1, ...buckets.map((b) => b.errors + b.warnings));
  return (
    <div
      className="rounded-[14px] border p-3"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="mb-2 flex items-center text-[11px] font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">
        <span>Timeline</span>
        <InfoTip text="Events per bucket across the selected time window. Red = errors, yellow = warnings. A visible spike means something started failing at that moment — click a filter to isolate the source." />
      </div>
      <div className="flex h-[80px] items-end gap-[2px]">
        {buckets.map((b) => {
          const errH = Math.round(((b.errors) / max) * 76);
          const warnH = Math.round(((b.warnings) / max) * 76);
          return (
            <div
              key={b.bucket}
              className="flex flex-1 flex-col justify-end"
              title={`${new Date(b.bucket).toLocaleString()}  •  errors: ${b.errors}  warnings: ${b.warnings}`}
            >
              {warnH > 0 && (
                <div
                  style={{ height: warnH, background: "#EAB308" }}
                  className="w-full"
                />
              )}
              {errH > 0 && (
                <div
                  style={{ height: errH, background: "#DC2626" }}
                  className="w-full"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ErrorLogPage() {
  const navigate = useNavigate();
  const [rangeHours, setRangeHours] = useState(24);
  const [source, setSource] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [kind, setKind] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const limit = 50;

  useEffect(() => {
    getAdminAuthState().then((s) => {
      if (!s.authenticated) navigate({ to: "/admin/login", replace: true });
    });
  }, [navigate]);

  const query = useQuery({
    queryKey: [
      "admin-error-log",
      rangeHours,
      source,
      severity,
      kind,
      search,
      page,
    ],
    queryFn: () =>
      listErrorLog({
        data: {
          rangeHours,
          source: source || null,
          severity: (severity as "error" | "warning" | "info" | "") || null,
          kind: kind || null,
          search: search || null,
          limit,
          offset: page * limit,
        },
      }),
    staleTime: 10_000,
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  const err = query.error as Error | null;
  const isForbidden =
    err && (/Unauthorized|Forbidden/.test(err.message) || err.message === "");
  useEffect(() => {
    if (isForbidden) navigate({ to: "/admin/login", replace: true });
  }, [isForbidden, navigate]);

  const totalPages = useMemo(() => {
    if (!query.data) return 1;
    return Math.max(1, Math.ceil(query.data.totalCount / limit));
  }, [query.data]);

  const bySource = query.data?.stats.bySource ?? {};

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <AdminNav active="errors" />

      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-[28px] leading-[1.05] tracking-tight text-foreground sm:text-[36px]"
          >
            Error <span style={{ fontStyle: "italic" }}>monitor</span>
          </h1>
          <p className="mt-1 text-[13px] font-medium text-[color:var(--muted-foreground)]">
            All captured issues — client, server, edge, auth, email. Hover any
            <span className="mx-1 inline-flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold" style={{ borderColor: "var(--card-border)" }}>i</span>
            for a plain-English explanation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] border px-3 text-[13px] font-semibold"
            style={{
              borderColor: "var(--card-border)",
              background: autoRefresh ? "var(--brand-purple, #4FC3F7)" : "transparent",
              color: autoRefresh ? "#fff" : "var(--foreground)",
            }}
          >
            {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
            Auto 30s
          </button>
          <button
            onClick={() => query.refetch()}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] border px-3 text-[13px] font-semibold"
            style={{ borderColor: "var(--card-border)" }}
            disabled={query.isFetching}
          >
            {query.isFetching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Anomalies */}
      {(query.data?.anomalies ?? []).length > 0 && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center text-[11px] font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">
            <span>Anomalies</span>
            <InfoTip text={ANOMALY_TIP} />
          </div>
          {query.data!.anomalies.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-[14px] border p-3"
              style={{
                background: "var(--card-bg)",
                borderColor: a.severity === "error" ? "#FCA5A5" : "#FCD34D",
              }}
            >
              <AlertTriangle
                size={18}
                color={a.severity === "error" ? "#B91C1C" : "#B45309"}
                className="mt-0.5 shrink-0"
              />
              <div className="text-[13px] font-medium text-foreground">
                {a.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div
        className="mb-5 flex flex-wrap items-center gap-3 rounded-[14px] border p-4"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r.hours}
              onClick={() => {
                setRangeHours(r.hours);
                setPage(0);
              }}
              className="h-8 rounded-[8px] px-3 text-[12px] font-semibold"
              style={{
                background:
                  rangeHours === r.hours
                    ? "var(--brand-purple, #4FC3F7)"
                    : "transparent",
                color: rangeHours === r.hours ? "#fff" : "var(--foreground)",
                border: "1px solid var(--card-border)",
              }}
            >
              {r.label}
            </button>
          ))}
          <InfoTip text={RANGE_TIP} />
        </div>

        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setPage(0);
          }}
          className="h-8 rounded-[8px] border bg-transparent px-2 text-[12px] font-medium"
          style={{ borderColor: "var(--card-border)" }}
        >
          <option value="">All sources</option>
          {(query.data?.sources ?? []).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={severity}
          onChange={(e) => {
            setSeverity(e.target.value);
            setPage(0);
          }}
          className="h-8 rounded-[8px] border bg-transparent px-2 text-[12px] font-medium"
          style={{ borderColor: "var(--card-border)" }}
        >
          {SEVERITIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setPage(0);
          }}
          className="h-8 rounded-[8px] border bg-transparent px-2 text-[12px] font-medium"
          style={{ borderColor: "var(--card-border)" }}
        >
          <option value="">All kinds</option>
          {(query.data?.kinds ?? []).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search message…"
          className="h-8 flex-1 min-w-[160px] rounded-[8px] border bg-transparent px-2 text-[12px]"
          style={{ borderColor: "var(--card-border)" }}
        />
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total"
          value={query.data?.stats.total ?? 0}
          tip={STAT_TIPS.total}
        />
        <StatCard
          label="Errors"
          value={query.data?.stats.errors ?? 0}
          accent="#B91C1C"
          tip={STAT_TIPS.errors}
        />
        <StatCard
          label="Warnings"
          value={query.data?.stats.warnings ?? 0}
          accent="#B45309"
          tip={STAT_TIPS.warnings}
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Client" value={bySource.client ?? 0} tip={STAT_TIPS.client} />
        <StatCard label="Server fn" value={bySource.server_fn ?? 0} tip={STAT_TIPS.server_fn} />
        <StatCard label="Edge fn" value={bySource.edge_fn ?? 0} tip={STAT_TIPS.edge_fn} />
        <StatCard label="Auth" value={bySource.auth ?? 0} tip={STAT_TIPS.auth} />
        <StatCard label="Email" value={bySource.email ?? 0} tip={STAT_TIPS.email} />
        <StatCard label="Business" value={bySource.business ?? 0} tip={STAT_TIPS.business} />
      </div>

      <div className="mb-6">
        <MiniChart buckets={query.data?.buckets ?? []} />
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-[14px] border"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        {query.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : query.isError && !isForbidden ? (
          <div className="p-6 text-[13px] text-red-600">
            Failed to load: {err?.message ?? "unknown error"}
          </div>
        ) : (query.data?.rows.length ?? 0) === 0 ? (
          <div className="p-10 text-center text-[13px] text-[color:var(--muted-foreground)]">
            No events matched these filters. 🎉
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <th className="px-3 py-2 font-semibold">When</th>
                  <th className="px-3 py-2 font-semibold">Source</th>
                  <th className="px-3 py-2 font-semibold">Severity</th>
                  <th className="px-3 py-2 font-semibold">Kind</th>
                  <th className="px-3 py-2 font-semibold">Message</th>
                  <th className="px-3 py-2 font-semibold">User</th>
                  <th className="px-3 py-2 font-semibold">Route</th>
                </tr>
              </thead>
              <tbody>
                {query.data!.rows.map((r) => {
                  const isOpen = !!expanded[r.id];
                  return (
                    <>
                      <tr
                        key={r.id}
                        style={{ borderBottom: "1px solid var(--card-border)" }}
                        className="align-top hover:bg-black/[0.02] cursor-pointer"
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [r.id]: !prev[r.id],
                          }))
                        }
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-[12px] text-[color:var(--muted-foreground)]">
                          <ChevronRight
                            size={12}
                            className="mr-1 inline"
                            style={{
                              transform: isOpen ? "rotate(90deg)" : "none",
                              transition: "transform 120ms",
                            }}
                          />
                          {formatTime(r.created_at)}
                        </td>
                        <td className="px-3 py-2 text-[12px] font-medium text-foreground">
                          {r.source}
                        </td>
                        <td className="px-3 py-2">
                          <SeverityBadge s={r.severity} />
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-foreground">
                          {r.kind}
                        </td>
                        <td className="max-w-[360px] px-3 py-2 text-foreground">
                          <div className="line-clamp-2">{r.message}</div>
                        </td>
                        <td className="px-3 py-2 text-[12px] text-[color:var(--muted-foreground)]">
                          {r.user_email ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-[12px] text-[color:var(--muted-foreground)]">
                          {r.route ?? "—"}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                          <td colSpan={7} className="bg-black/[0.02] px-6 py-3">
                            {r.stack && (
                              <div className="mb-2">
                                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">
                                  Stack
                                </div>
                                <pre className="max-h-64 overflow-auto rounded bg-black/5 p-2 text-[11px] leading-tight">
                                  {r.stack}
                                </pre>
                              </div>
                            )}
                            {r.context && Object.keys(r.context).length > 0 && (
                              <div>
                                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">
                                  Context
                                </div>
                                <pre className="max-h-48 overflow-auto rounded bg-black/5 p-2 text-[11px] leading-tight">
                                  {JSON.stringify(r.context, null, 2)}
                                </pre>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {query.data && query.data.totalCount > limit && (
        <div className="mt-4 flex items-center justify-between text-[12px] text-[color:var(--muted-foreground)]">
          <span>
            Showing {page * limit + 1}–
            {Math.min((page + 1) * limit, query.data.totalCount)} of{" "}
            {query.data.totalCount}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 rounded-[8px] border px-3 text-[12px] font-semibold disabled:opacity-40"
              style={{ borderColor: "var(--card-border)" }}
            >
              Prev
            </button>
            <button
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={page >= totalPages - 1}
              className="h-8 rounded-[8px] border px-3 text-[12px] font-semibold disabled:opacity-40"
              style={{ borderColor: "var(--card-border)" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  );
}