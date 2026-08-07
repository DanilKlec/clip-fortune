// Admin-only server functions for the email log dashboard.
// Auth model: a dedicated admin OTP session (cookie `ss_admin`), fully
// separate from the app's subscriber session. No subscription check.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function requireAdmin(): Promise<string> {
  const { requireAdminSessionEmail } = await import("./admin-auth.server");
  return await requireAdminSessionEmail();
}

export interface EmailLogRow {
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string | null;
  error_message: string | null;
  created_at: string;
}

export interface EmailLogStats {
  total: number;
  sent: number;
  failed: number;
  suppressed: number;
  pending: number;
}

export interface EmailLogResponse {
  rows: EmailLogRow[];
  stats: EmailLogStats;
  templates: string[];
  totalCount: number;
  limit: number;
  offset: number;
}

const filterSchema = z.object({
  rangeHours: z.number().int().positive().max(24 * 365).default(168), // 7d default
  template: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  limit: z.number().int().positive().max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export const listEmailLog = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof filterSchema>) =>
    filterSchema.parse(input),
  )
  .handler(async ({ data }): Promise<EmailLogResponse> => {
    await requireAdmin();
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const since = new Date(
      Date.now() - data.rangeHours * 60 * 60 * 1000,
    ).toISOString();

    // Pull a generous slice inside the time window and dedupe by message_id
    // in memory (keeping the latest status). Simpler than a Postgres view
    // and adequate for admin dashboard volumes.
    const raw = await supabaseAdmin
      .from("email_send_log")
      .select(
        "message_id, template_name, recipient_email, status, error_message, created_at",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (raw.error) {
      console.error("[listEmailLog] select failed", raw.error);
      throw new Error("Could not load email log");
    }

    const seen = new Set<string>();
    const deduped: EmailLogRow[] = [];
    for (const row of raw.data ?? []) {
      const key = row.message_id ?? `__no_id_${row.created_at}_${row.recipient_email}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(row as EmailLogRow);
    }

    // Templates for the filter dropdown (from the current window).
    const templates = Array.from(
      new Set(
        deduped
          .map((r) => r.template_name)
          .filter((t): t is string => Boolean(t)),
      ),
    ).sort();

    // Apply template / status filters.
    const filtered = deduped.filter((r) => {
      if (data.template && r.template_name !== data.template) return false;
      if (data.status) {
        if (data.status === "failed") {
          if (r.status !== "dlq" && r.status !== "failed" && r.status !== "bounced")
            return false;
        } else if (r.status !== data.status) {
          return false;
        }
      }
      return true;
    });

    const stats: EmailLogStats = {
      total: filtered.length,
      sent: filtered.filter((r) => r.status === "sent").length,
      failed: filtered.filter(
        (r) => r.status === "dlq" || r.status === "failed" || r.status === "bounced",
      ).length,
      suppressed: filtered.filter((r) => r.status === "suppressed").length,
      pending: filtered.filter((r) => r.status === "pending").length,
    };

    const totalCount = filtered.length;
    const rows = filtered.slice(data.offset, data.offset + data.limit);

    return {
      rows,
      stats,
      templates,
      totalCount,
      limit: data.limit,
      offset: data.offset,
    };
  });
