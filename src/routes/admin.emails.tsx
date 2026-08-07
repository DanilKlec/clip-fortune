import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { listEmailLog } from "@/lib/admin-emails.functions";
import { getAdminAuthState } from "@/lib/admin-auth.functions";
import { AdminNav, InfoTip } from "@/components/admin/AdminNav";

const STAT_TIPS = {
  total:
    "All unique emails sent in the selected time window. Baseline volume — a sharp drop can mean the queue is stuck or an integration broke.",
  sent:
    "Successfully delivered to the mail provider. If Sent stops growing while Total keeps rising, delivery is failing downstream.",
  pending:
    "Queued but not yet delivered. A few is normal; a growing backlog means the cron job or the sender is stuck.",
  failed:
    "Ended up in the dead-letter queue after retries (or bounced / hard-failed). These emails did NOT reach the user — action required.",
  suppressed:
    "Blocked because the recipient previously bounced/complained/unsubscribed. If a real user is here, they'll never get OTP or notifications until removed from the suppression list.",
} as const;

export const Route = createFileRoute("/admin/emails")({
  head: () => ({
    meta: [
      { title: "Email log — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EmailLogPage,
});

const RANGES: { label: string; hours: number }[] = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
  { label: "90d", hours: 24 * 90 },
];

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "sent", label: "Sent" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed / DLQ" },
  { value: "suppressed", label: "Suppressed" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "unknown";
  const isSent = s === "sent";
  const isFailed = s === "dlq" || s === "failed" || s === "bounced";
  const isSuppressed = s === "suppressed" || s === "complained";
  const isPending = s === "pending";

  const bg = isSent
    ? "#DCFCE7"
    : isFailed
      ? "#FEE2E2"
      : isSuppressed
        ? "#FEF9C3"
        : isPending
          ? "#DBEAFE"
          : "#E5E7EB";
  const color = isSent
    ? "#15803D"
    : isFailed
      ? "#B91C1C"
      : isSuppressed
        ? "#854D0E"
        : isPending
          ? "#1D4ED8"
          : "#374151";

  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ background: bg, color }}
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

function EmailLogPage() {
  const navigate = useNavigate();
  const [rangeHours, setRangeHours] = useState(24 * 7);
  const [template, setTemplate] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    getAdminAuthState().then((s) => {
      if (!s.authenticated) navigate({ to: "/admin/login", replace: true });
    });
  }, [navigate]);

  const query = useQuery({
    queryKey: ["admin-email-log", rangeHours, template, status, page],
    queryFn: () =>
      listEmailLog({
        data: {
          rangeHours,
          template: template || null,
          status: status || null,
          limit,
          offset: page * limit,
        },
      }),
    staleTime: 15_000,
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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <AdminNav active="emails" />
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-[28px] leading-[1.05] tracking-tight text-foreground sm:text-[36px]"
          >
            Email <span style={{ fontStyle: "italic" }}>log</span>
          </h1>
          <p className="mt-1 text-[13px] font-medium text-[color:var(--muted-foreground)]">
            Deduplicated per email — shows the latest status for every send.
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {isForbidden ? (
        <div
          className="flex items-start gap-3 rounded-[14px] border p-5"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--card-border)",
          }}
        >
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0"
            color="#B91C1C"
          />
          <div>
            <div className="text-[15px] font-semibold text-foreground">
              Access denied
            </div>
            <p className="mt-1 text-[13px] text-[color:var(--muted-foreground)]">
              You need to be signed in as an admin to view the email log.
            </p>
          </div>
        </div>
      ) : (
        <>
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
                    color:
                      rangeHours === r.hours
                        ? "#fff"
                        : "var(--foreground)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <select
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value);
                setPage(0);
              }}
              className="h-8 rounded-[8px] border bg-transparent px-2 text-[12px] font-medium"
              style={{ borderColor: "var(--card-border)" }}
            >
              <option value="">All templates</option>
              {(query.data?.templates ?? []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="h-8 rounded-[8px] border bg-transparent px-2 text-[12px] font-medium"
              style={{ borderColor: "var(--card-border)" }}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="Total" value={query.data?.stats.total ?? 0} tip={STAT_TIPS.total} />
            <StatCard label="Sent" value={query.data?.stats.sent ?? 0} accent="#15803D" tip={STAT_TIPS.sent} />
            <StatCard label="Pending" value={query.data?.stats.pending ?? 0} accent="#1D4ED8" tip={STAT_TIPS.pending} />
            <StatCard label="Failed / DLQ" value={query.data?.stats.failed ?? 0} accent="#B91C1C" tip={STAT_TIPS.failed} />
            <StatCard label="Suppressed" value={query.data?.stats.suppressed ?? 0} accent="#854D0E" tip={STAT_TIPS.suppressed} />
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
                No emails matched these filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
                    <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                      <th className="px-4 py-2 font-semibold">When</th>
                      <th className="px-4 py-2 font-semibold">Template</th>
                      <th className="px-4 py-2 font-semibold">Recipient</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                      <th className="px-4 py-2 font-semibold">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data!.rows.map((r, idx) => (
                      <tr
                        key={(r.message_id ?? "no-id") + idx}
                        style={{ borderBottom: "1px solid var(--card-border)" }}
                        className="align-top"
                      >
                        <td className="whitespace-nowrap px-4 py-2 text-[12px] text-[color:var(--muted-foreground)]">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-4 py-2 font-medium text-foreground">
                          {r.template_name ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-foreground">
                          {r.recipient_email ?? "—"}
                        </td>
                        <td className="px-4 py-2">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="max-w-[320px] px-4 py-2 text-[12px] text-red-600">
                          {r.error_message ? (
                            <span title={r.error_message} className="line-clamp-2">
                              {r.error_message}
                            </span>
                          ) : (
                            <span className="text-[color:var(--muted-foreground)]">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
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
        </>
      )}
    </main>
  );
}
