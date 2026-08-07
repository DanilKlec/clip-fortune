// Admin-only server functions for the error log dashboard.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function requireAdmin(): Promise<string> {
  const { requireAdminSessionEmail } = await import("./admin-auth.server");
  return await requireAdminSessionEmail();
}

export interface ErrorLogRow {
  id: string;
  created_at: string;
  source: string;
  severity: string;
  kind: string;
  message: string;
  stack: string | null;
  route: string | null;
  user_email: string | null;
  request_id: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any;
}

export interface ErrorLogStats {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  bySource: Record<string, number>;
  byKind: { kind: string; count: number }[];
}

export interface ErrorLogBucket {
  bucket: string; // ISO
  errors: number;
  warnings: number;
}

export interface ErrorAnomaly {
  kind: string;
  severity: "error" | "warning" | "info";
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
}

export interface ErrorLogResponse {
  rows: ErrorLogRow[];
  stats: ErrorLogStats;
  buckets: ErrorLogBucket[];
  anomalies: ErrorAnomaly[];
  sources: string[];
  kinds: string[];
  totalCount: number;
  limit: number;
  offset: number;
}

const filterSchema = z.object({
  rangeHours: z.number().int().positive().max(24 * 365).default(24),
  source: z.string().nullable().optional(),
  severity: z.enum(["error", "warning", "info"]).nullable().optional(),
  kind: z.string().nullable().optional(),
  search: z.string().max(200).nullable().optional(),
  limit: z.number().int().positive().max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

function bucketSize(hours: number): { ms: number; label: "minute" | "hour" | "day" } {
  if (hours <= 6) return { ms: 60_000, label: "minute" };
  if (hours <= 72) return { ms: 60 * 60_000, label: "hour" };
  return { ms: 24 * 60 * 60_000, label: "day" };
}

export const listErrorLog = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof filterSchema>) =>
    filterSchema.parse(input),
  )
  .handler(async ({ data }): Promise<ErrorLogResponse> => {
    await requireAdmin();
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const since = new Date(
      Date.now() - data.rangeHours * 60 * 60 * 1000,
    ).toISOString();

    // Pull the window (capped) and do filtering/aggregation in-memory.
    // With reasonable volume this stays fast; can be pushed into SQL later.
    const raw = await supabaseAdmin
      .from("app_error_log")
      .select(
        "id, created_at, source, severity, kind, message, stack, route, user_email, request_id, context",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (raw.error) {
      console.error("[listErrorLog] select failed", raw.error);
      throw new Error("Could not load error log");
    }
    const all = (raw.data ?? []) as ErrorLogRow[];

    const filtered = all.filter((r) => {
      if (data.source && r.source !== data.source) return false;
      if (data.severity && r.severity !== data.severity) return false;
      if (data.kind && r.kind !== data.kind) return false;
      if (data.search) {
        const q = data.search.toLowerCase();
        if (!r.message.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const stats: ErrorLogStats = {
      total: filtered.length,
      errors: filtered.filter((r) => r.severity === "error").length,
      warnings: filtered.filter((r) => r.severity === "warning").length,
      info: filtered.filter((r) => r.severity === "info").length,
      bySource: {},
      byKind: [],
    };
    for (const r of filtered) {
      stats.bySource[r.source] = (stats.bySource[r.source] ?? 0) + 1;
    }
    const kindMap = new Map<string, number>();
    for (const r of filtered) {
      kindMap.set(r.kind, (kindMap.get(r.kind) ?? 0) + 1);
    }
    stats.byKind = Array.from(kindMap.entries())
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Buckets for a mini chart. Fixed number of buckets across the window.
    const { ms: bucketMs } = bucketSize(data.rangeHours);
    const bucketCount = Math.max(
      12,
      Math.min(120, Math.ceil((data.rangeHours * 60 * 60_000) / bucketMs)),
    );
    const end = Date.now();
    const start = end - bucketCount * bucketMs;
    const buckets: ErrorLogBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
      bucket: new Date(start + i * bucketMs).toISOString(),
      errors: 0,
      warnings: 0,
    }));
    for (const r of filtered) {
      const t = new Date(r.created_at).getTime();
      const idx = Math.floor((t - start) / bucketMs);
      if (idx < 0 || idx >= bucketCount) continue;
      if (r.severity === "error") buckets[idx].errors += 1;
      else if (r.severity === "warning") buckets[idx].warnings += 1;
    }

    // Anomalies.
    const anomalies: ErrorAnomaly[] = [];
    const now = Date.now();

    // OTP brute force: >20 verify fails from same email in last 15 min.
    const otpWindow = all.filter(
      (r) =>
        (r.kind === "otp_verify_fail" || r.kind === "admin_otp_verify_fail") &&
        now - new Date(r.created_at).getTime() < 15 * 60_000,
    );
    const otpByEmail = new Map<string, number>();
    for (const r of otpWindow) {
      const key = r.user_email ?? "(unknown)";
      otpByEmail.set(key, (otpByEmail.get(key) ?? 0) + 1);
    }
    for (const [email, count] of otpByEmail) {
      if (count >= 20) {
        anomalies.push({
          kind: "otp_bruteforce",
          severity: "error",
          message: `${count} failed OTP attempts for ${email} in the last 15 minutes`,
          details: { email, count },
        });
      }
    }

    // Subscription API failing.
    const subFails = all.filter(
      (r) =>
        (r.kind === "subscription_api_http" ||
          r.kind === "subscription_api_network") &&
        now - new Date(r.created_at).getTime() < 30 * 60_000,
    );
    if (subFails.length >= 5) {
      anomalies.push({
        kind: "subscription_api_down",
        severity: "error",
        message: `Subscription API failing (${subFails.length} errors in last 30 min)`,
      });
    }

    // AI Gateway issues (edge fn).
    const aiFails = all.filter(
      (r) =>
        (r.kind === "ai_gateway_5xx" ||
          r.kind === "ai_gateway_unavailable" ||
          r.kind === "ai_credits_exhausted") &&
        now - new Date(r.created_at).getTime() < 30 * 60_000,
    );
    if (aiFails.length >= 3) {
      anomalies.push({
        kind: "ai_gateway_issues",
        severity: "error",
        message: `AI Gateway problems (${aiFails.length} events in last 30 min)`,
      });
    }

    // Client-side chunk-load errors after a deploy.
    const chunkFails = all.filter(
      (r) =>
        r.kind === "chunk_load" &&
        now - new Date(r.created_at).getTime() < 30 * 60_000,
    );
    if (chunkFails.length >= 5) {
      anomalies.push({
        kind: "stale_client_versions",
        severity: "warning",
        message: `${chunkFails.length} chunk-load errors — users may be on a stale build`,
      });
    }

    const sources = Array.from(new Set(all.map((r) => r.source))).sort();
    const kinds = Array.from(new Set(all.map((r) => r.kind))).sort();

    const totalCount = filtered.length;
    const rows = filtered.slice(data.offset, data.offset + data.limit);

    return {
      rows,
      stats,
      buckets,
      anomalies,
      sources,
      kinds,
      totalCount,
      limit: data.limit,
      offset: data.offset,
    };
  });