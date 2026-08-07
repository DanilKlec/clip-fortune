import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Enter a valid email" })
  .max(254);

const codeSchema = z.string().trim().regex(/^\d{4}$/, "Enter the 4-digit code");

const OTP_TTL_MS = 10 * 60 * 1000; // fresh code lifetime
const OTP_GRACE_MS = 5 * 60 * 1000; // previous codes stay valid this long after rotation
const MIN_REQUEST_INTERVAL_MS = 60 * 1000; // rate limit per email
const MAX_ATTEMPTS = 5;

// Bearer: none — public endpoint. Rate-limited and validated.
export const requestOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) =>
    z.object({ email: emailSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const email = data.email;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { default: bcrypt } = await import("bcryptjs");
    const now = new Date();

    // Rate limit: ignore very fresh codes (< MIN_REQUEST_INTERVAL_MS old).
    const recent = await supabaseAdmin
      .from("otp_codes")
      .select("created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent.data) {
      const age = now.getTime() - new Date(recent.data.created_at).getTime();
      if (age < MIN_REQUEST_INTERVAL_MS) {
        const retryInSec = Math.ceil((MIN_REQUEST_INTERVAL_MS - age) / 1000);
        const { logAppError } = await import("./error-log.server");
        await logAppError({
          source: "auth",
          severity: "warning",
          kind: "otp_rate_limited",
          message: `OTP request rate-limited (${retryInSec}s left)`,
          route: "requestOtp",
          userEmail: email,
          context: { retryInSec },
        });
        return {
          ok: false as const,
          reason: "rate_limited" as const,
          retryInSec,
        };
      }
    }

    // Generate 4-digit code.
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const code_hash = await bcrypt.hash(code, 10);
    const expires_at = new Date(now.getTime() + OTP_TTL_MS).toISOString();
    // grace_until for the NEW code = its own expiry (no grace beyond).
    // Existing older codes keep working for OTP_GRACE_MS from now: extend
    // their grace_until so the verify path accepts them briefly.
    const graceCutoff = new Date(now.getTime() + OTP_GRACE_MS).toISOString();

    // Extend older codes' grace window (only if their grace_until is sooner).
    await supabaseAdmin
      .from("otp_codes")
      .update({ grace_until: graceCutoff })
      .eq("email", email)
      .lt("grace_until", graceCutoff);

    // Prune fully-expired codes (grace_until in the past).
    await supabaseAdmin
      .from("otp_codes")
      .delete()
      .eq("email", email)
      .lt("grace_until", now.toISOString());

    // Insert new code.
    const insert = await supabaseAdmin.from("otp_codes").insert({
      email,
      code_hash,
      expires_at,
      grace_until: expires_at, // fresh code has no separate grace
      attempts: 0,
    });
    if (insert.error) {
      console.error("[requestOtp] insert failed", insert.error);
      throw new Error("Could not create login code");
    }

    const { sendOtpEmail } = await import("./otp-mail.server");
    try {
      await sendOtpEmail(email, code);
    } catch (err) {
      console.error("[requestOtp] email send failed", err);
      // Don't reveal failure specifics; the code is stored so a retry works.
    }

    return { ok: true as const };
  });

export interface VerifyOk {
  ok: true;
  subscriptionActive: boolean;
  status: string | null;
}
export interface VerifyFail {
  ok: false;
  reason: "invalid_code" | "expired" | "too_many_attempts";
}

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string }) =>
    z.object({ email: emailSchema, code: codeSchema }).parse(input),
  )
  .handler(async ({ data }): Promise<VerifyOk | VerifyFail> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { default: bcrypt } = await import("bcryptjs");
    const now = new Date();

    // Fetch all still-valid codes for this email (fresh OR in grace window).
    const rows = await supabaseAdmin
      .from("otp_codes")
      .select("id, code_hash, expires_at, grace_until, attempts")
      .eq("email", data.email)
      .gte("grace_until", now.toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    if (rows.error) {
      console.error("[verifyOtp] select failed", rows.error);
      throw new Error("Could not verify code");
    }
    const candidates = rows.data ?? [];
    if (candidates.length === 0) {
      return { ok: false, reason: "expired" };
    }
    if (candidates.every((r) => r.attempts >= MAX_ATTEMPTS)) {
      return { ok: false, reason: "too_many_attempts" };
    }

    let matched: (typeof candidates)[number] | null = null;
    for (const row of candidates) {
      if (row.attempts >= MAX_ATTEMPTS) continue;
      // Also enforce fresh expiry OR grace window individually.
      const graceOk = new Date(row.grace_until).getTime() >= now.getTime();
      if (!graceOk) continue;
      // eslint-disable-next-line no-await-in-loop
      const ok = await bcrypt.compare(data.code, row.code_hash);
      if (ok) {
        matched = row;
        break;
      }
    }

    if (!matched) {
      // Increment attempts on all active candidates to slow brute force.
      await supabaseAdmin
        .from("otp_codes")
        .update({ attempts: (candidates[0]?.attempts ?? 0) + 1 })
        .in(
          "id",
          candidates.map((c) => c.id),
        );
      const { logAppError } = await import("./error-log.server");
      await logAppError({
        source: "auth",
        severity: "warning",
        kind: "otp_verify_fail",
        message: "Invalid OTP code",
        route: "verifyOtp",
        userEmail: data.email,
        context: { attempts: (candidates[0]?.attempts ?? 0) + 1 },
      });
      return { ok: false, reason: "invalid_code" };
    }

    // Success: drop all codes for this email.
    await supabaseAdmin.from("otp_codes").delete().eq("email", data.email);

    // Re-check subscription and set session.
    const { fetchSubscription } = await import("./subscriptions.server");
    let sub;
    try {
      sub = await fetchSubscription(data.email);
    } catch (err) {
      console.error("[verifyOtp] subscription fetch failed", err);
      throw new Error("Could not verify subscription — try again");
    }

    const { readAuthSession } = await import("./auth-session.server");
    const session = await readAuthSession();
    await session.update({
      email: data.email,
      subscriptionId: sub.subscriptionId ?? undefined,
      nextChargeAt: sub.nextChargeAt,
      unlockedAt: now.getTime(),
    });

    return {
      ok: true,
      subscriptionActive: sub.active,
      status: sub.status,
    };
  });

export interface AuthState {
  authenticated: boolean;
  subscriptionActive: boolean;
  email: string | null;
  status: string | null;
  nextChargeAt: string | null;
}

export const getAuthState = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthState> => {
    const { readAuthSession } = await import("./auth-session.server");
    const session = await readAuthSession();
    const { email, nextChargeAt, subscriptionId, unlockedAt } = session.data;
    if (!email || !unlockedAt) {
      return {
        authenticated: false,
        subscriptionActive: false,
        email: null,
        status: null,
        nextChargeAt: null,
      };
    }

    // Lazy re-check: only when nextChargeAt has passed (or is missing).
    const now = Date.now();
    const needsRecheck =
      !nextChargeAt || new Date(nextChargeAt).getTime() <= now;

    if (needsRecheck) {
      const { fetchSubscription } = await import("./subscriptions.server");
      try {
        const sub = await fetchSubscription(email);
        if (!sub.active) {
          await session.clear();
          return {
            authenticated: false,
            subscriptionActive: false,
            email: null,
            status: sub.status,
            nextChargeAt: null,
          };
        }
        await session.update({
          email,
          subscriptionId: sub.subscriptionId ?? subscriptionId,
          nextChargeAt: sub.nextChargeAt,
          unlockedAt,
        });
        return {
          authenticated: true,
          subscriptionActive: true,
          email,
          status: sub.status,
          nextChargeAt: sub.nextChargeAt,
        };
      } catch (err) {
        // Network hiccup: keep the user in until the next request.
        console.error("[getAuthState] recheck failed", err);
      }
    }

    return {
      authenticated: true,
      subscriptionActive: true,
      email,
      status: null,
      nextChargeAt: nextChargeAt ?? null,
    };
  },
);

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const { readAuthSession } = await import("./auth-session.server");
  const session = await readAuthSession();
  await session.clear();
  return { ok: true as const };
});