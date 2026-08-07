import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Public endpoint the client uses to report browser/runtime errors.
// Same-origin only (Origin header check). Rate-limited by in-worker
// dedupe over the last 60s.

const eventSchema = z.object({
  kind: z.string().min(1).max(80),
  severity: z.enum(["error", "warning", "info"]).default("error"),
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).nullable().optional(),
  route: z.string().max(500).nullable().optional(),
  context: z.record(z.string(), z.unknown()).nullable().optional(),
});

const bodySchema = z.object({
  events: z.array(eventSchema).min(1).max(20),
});

// dedupe: kind|message hash -> last insert epoch ms
const recent = new Map<string, number>();
const DEDUPE_MS = 60_000;

function allowed(origin: string | null, host: string | null): boolean {
  if (!origin) return true; // no Origin header on navigations from same origin
  try {
    const o = new URL(origin);
    if (host && o.host === host) return true;
    // Allow lovable preview/prod hosts as fallback so the client works during dev.
    if (o.host.endsWith(".lovable.app")) return true;
    if (o.host.endsWith(".lovableproject.com")) return true;
    if (o.host === "localhost:8080") return true;
  } catch {
    return false;
  }
  return false;
}

export const Route = createFileRoute("/api/public/errors/report")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get("origin") ?? "*";
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
            "Access-Control-Max-Age": "86400",
          },
        });
      },
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        const host = request.headers.get("host");
        if (!allowed(origin, host)) {
          return new Response("Forbidden", { status: 403 });
        }

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
          return new Response("Invalid payload", { status: 400 });
        }

        const { logAppError } = await import("@/lib/error-log.server");
        const ua = request.headers.get("user-agent") ?? undefined;
        const now = Date.now();

        for (const e of parsed.data.events) {
          const dedupeKey = `${e.kind}|${e.message}`;
          const last = recent.get(dedupeKey);
          if (last && now - last < DEDUPE_MS) continue;
          recent.set(dedupeKey, now);

          // eslint-disable-next-line no-await-in-loop
          await logAppError({
            source: "client",
            severity: e.severity,
            kind: e.kind,
            message: e.message,
            stack: e.stack ?? null,
            route: e.route ?? null,
            context: { ...(e.context ?? {}), userAgent: ua },
          });
        }

        // Cheap map pruning.
        if (recent.size > 500) {
          for (const [k, v] of recent) {
            if (now - v > DEDUPE_MS) recent.delete(k);
          }
        }

        return Response.json({ ok: true });
      },
    },
  },
});