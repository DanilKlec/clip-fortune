// Server-only helper: talks to the internal subscription API.
// Never import this from client-reachable modules.

// The product name can change on the backend side. Update this constant
// (or override with SUBSCRIPTION_PRODUCT env var) to match.
const DEFAULT_PRODUCT = "Robinzone";
const API_BASE = "https://solidgate-service.savva.tech/api/subscriptions/search";

export interface SubscriptionInfo {
  active: boolean;
  subscriptionId: string | null;
  nextChargeAt: string | null; // ISO
  status: string | null;
}

interface RawSubscription {
  product: string;
  id: string;
  status: string;
  nextChargeAt: string | null;
  expireAt: string | null;
}

interface RawResponse {
  subscriptions?: RawSubscription[];
}

function toIso(value: string | null): string | null {
  if (!value) return null;
  // Backend returns "YYYY-MM-DD HH:mm:ss" (UTC assumed).
  const withT = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  const d = new Date(withT);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function fetchSubscription(
  email: string,
): Promise<SubscriptionInfo> {
  const product = process.env.SUBSCRIPTION_PRODUCT || DEFAULT_PRODUCT;
  const url = `${API_BASE}?email=${encodeURIComponent(email)}&product=${encodeURIComponent(product)}`;
  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(url, { headers: { accept: "application/json" } });
  } catch (err) {
    const { logAppError, extractError } = await import("./error-log.server");
    const info = extractError(err);
    await logAppError({
      source: "auth",
      severity: "error",
      kind: "subscription_api_network",
      message: info.message,
      stack: info.stack,
      route: "subscriptions.fetch",
      userEmail: email,
      context: { product, durationMs: Date.now() - started },
    });
    throw err;
  }
  if (!res.ok) {
    const { logAppError } = await import("./error-log.server");
    await logAppError({
      source: "auth",
      severity: "error",
      kind: "subscription_api_http",
      message: `Subscription API returned ${res.status}`,
      route: "subscriptions.fetch",
      userEmail: email,
      context: { product, status: res.status, durationMs: Date.now() - started },
    });
    throw new Error(`Subscription API returned ${res.status}`);
  }
  const body = (await res.json()) as RawResponse;
  const subs = body?.subscriptions ?? [];
  const match =
    subs.find((s) => s.product === product && s.status === "active") ??
    subs.find((s) => s.product === product) ??
    null;
  if (!match) {
    return { active: false, subscriptionId: null, nextChargeAt: null, status: null };
  }
  return {
    active: match.status === "active",
    subscriptionId: match.id,
    nextChargeAt: toIso(match.nextChargeAt),
    status: match.status,
  };
}