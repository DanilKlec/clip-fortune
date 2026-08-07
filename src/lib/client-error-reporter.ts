// Client-side error capture: window errors, unhandled promise rejections,
// chunk load failures. Batches events and POSTs them to
// /api/public/errors/report. Safe to call in the browser only.

interface ErrorEventPayload {
  kind: string;
  severity?: "error" | "warning" | "info";
  message: string;
  stack?: string | null;
  route?: string | null;
  context?: Record<string, unknown>;
}

const ENDPOINT = "/api/public/errors/report";
const BATCH_INTERVAL_MS = 3000;
const MAX_BATCH = 10;

let queue: ErrorEventPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let installed = false;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, BATCH_INTERVAL_MS);
}

async function flush() {
  flushTimer = null;
  if (queue.length === 0) return;
  const events = queue.splice(0, MAX_BATCH);
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
      keepalive: true,
    });
  } catch {
    // network error — drop; we don't want to loop.
  }
  if (queue.length > 0) scheduleFlush();
}

export function reportClientError(payload: ErrorEventPayload) {
  if (typeof window === "undefined") return;
  const enriched: ErrorEventPayload = {
    severity: "error",
    route: typeof location !== "undefined" ? location.pathname : null,
    ...payload,
    context: {
      ...(payload.context ?? {}),
      url: typeof location !== "undefined" ? location.href : undefined,
      ts: new Date().toISOString(),
    },
  };
  queue.push(enriched);
  if (queue.length >= MAX_BATCH) flush();
  else scheduleFlush();
}

function classify(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("chunkloaderror") || m.includes("failed to fetch dynamically imported module"))
    return "chunk_load";
  if (m.includes("networkerror") || m.includes("failed to fetch") || m.includes("load failed"))
    return "network";
  if (m.includes("quotaexceedederror")) return "storage_quota";
  return "js_runtime";
}

export function installClientErrorReporter() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    const err = (event as ErrorEvent).error;
    const message =
      (err instanceof Error ? err.message : (event as ErrorEvent).message) ||
      "Unknown error";
    reportClientError({
      kind: classify(message),
      message,
      stack: err instanceof Error ? err.stack ?? null : null,
      context: {
        filename: (event as ErrorEvent).filename,
        lineno: (event as ErrorEvent).lineno,
        colno: (event as ErrorEvent).colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    const message =
      reason instanceof Error ? reason.message : String(reason ?? "Unhandled rejection");
    reportClientError({
      kind: "unhandled_rejection",
      message,
      stack: reason instanceof Error ? reason.stack ?? null : null,
    });
  });

  window.addEventListener("beforeunload", () => {
    if (queue.length > 0) flush();
  });
}

export function reportBoundaryError(error: unknown, componentStack?: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  reportClientError({
    kind: "react_boundary",
    message,
    stack: error instanceof Error ? error.stack ?? null : null,
    context: componentStack ? { componentStack } : undefined,
  });
}