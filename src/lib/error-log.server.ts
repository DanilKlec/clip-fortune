// Server-only helper for writing to public.app_error_log. Safe to call
// from any server function or server route — never throws, so a logging
// failure can't take down the main request. Load inside handlers only.

export type ErrorSource =
  | "client"
  | "server_fn"
  | "edge_fn"
  | "auth"
  | "email"
  | "business"
  | "infra";

export type ErrorSeverity = "error" | "warning" | "info";

export interface LogAppErrorInput {
  source: ErrorSource;
  severity?: ErrorSeverity;
  kind: string;
  message: string;
  stack?: string | null;
  route?: string | null;
  userEmail?: string | null;
  requestId?: string | null;
  context?: Record<string, unknown> | null;
}

function trunc(s: string | null | undefined, max: number): string | null {
  if (s == null) return null;
  const str = String(s);
  if (str.length <= max) return str;
  return str.slice(0, max);
}

export async function logAppError(input: LogAppErrorInput): Promise<void> {
  try {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const payload = {
      source: input.source,
      severity: input.severity ?? "error",
      kind: trunc(input.kind, 80) ?? "unknown",
      message: trunc(input.message, 2000) ?? "(no message)",
      stack: trunc(input.stack ?? null, 8000),
      route: trunc(input.route ?? null, 500),
      user_email: input.userEmail ?? null,
      request_id: input.requestId ?? null,
      context: (input.context ?? {}) as never,
    };
    const res = await supabaseAdmin.from("app_error_log").insert(payload);
    if (res.error) {
      // eslint-disable-next-line no-console
      console.error("[logAppError] insert failed", res.error);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[logAppError] unexpected", err);
  }
}

// Turn an unknown thrown value into { message, stack } safely.
export function extractError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack };
  }
  try {
    return { message: typeof err === "string" ? err : JSON.stringify(err) };
  } catch {
    return { message: String(err) };
  }
}