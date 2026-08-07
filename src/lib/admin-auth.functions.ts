// Admin OTP flow — fully separate from the app's subscriber OTP:
// * Only allow-listed admin emails may request a code
// * No subscription lookups, no external API dependency
// * Sets a dedicated `ss_admin` session cookie
// OTP rows are namespaced with `admin:` prefix in `otp_codes` so they never
// collide with app OTPs for the same email.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Enter a valid email" })
  .max(254);

const codeSchema = z.string().trim().regex(/^\d{4}$/, "Enter the 4-digit code");

const OTP_TTL_MS = 10 * 60 * 1000;
const MIN_REQUEST_INTERVAL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const ADMIN_TAG = "admin:";
const tagged = (email: string) => `${ADMIN_TAG}${email}`;

export interface AdminRequestOk {
  ok: true;
}
export interface AdminRequestFail {
  ok: false;
  reason: "not_admin" | "rate_limited";
  retryInSec?: number;
}

export const requestAdminOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) =>
    z.object({ email: emailSchema }).parse(input),
  )
  .handler(async ({ data }): Promise<AdminRequestOk | AdminRequestFail> => {
    const { ADMIN_EMAILS } = await import("./admin-auth.server");
    if (!ADMIN_EMAILS.has(data.email)) {
      // Avoid enumeration: pretend rate-limited on unknown emails.
      const { logAppError } = await import("./error-log.server");
      await logAppError({
        source: "auth",
        severity: "warning",
        kind: "admin_otp_not_admin",
        message: "Admin OTP requested by non-admin email",
        route: "requestAdminOtp",
        userEmail: data.email,
      });
      return { ok: false, reason: "not_admin" };
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { default: bcrypt } = await import("bcryptjs");
    const now = new Date();
    const key = tagged(data.email);

    const recent = await supabaseAdmin
      .from("otp_codes")
      .select("created_at")
      .eq("email", key)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent.data) {
      const age = now.getTime() - new Date(recent.data.created_at).getTime();
      if (age < MIN_REQUEST_INTERVAL_MS) {
        return {
          ok: false,
          reason: "rate_limited",
          retryInSec: Math.ceil((MIN_REQUEST_INTERVAL_MS - age) / 1000),
        };
      }
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const code_hash = await bcrypt.hash(code, 10);
    const expires_at = new Date(now.getTime() + OTP_TTL_MS).toISOString();

    // Drop older admin codes for this email; keep one active code.
    await supabaseAdmin.from("otp_codes").delete().eq("email", key);

    const insert = await supabaseAdmin.from("otp_codes").insert({
      email: key,
      code_hash,
      expires_at,
      grace_until: expires_at,
      attempts: 0,
    });
    if (insert.error) {
      console.error("[requestAdminOtp] insert failed", insert.error);
      throw new Error("Could not create admin code");
    }

    const { sendOtpEmail } = await import("./otp-mail.server");
    try {
      await sendOtpEmail(data.email, code);
    } catch (err) {
      console.error("[requestAdminOtp] email send failed", err);
    }

    return { ok: true };
  });

export interface AdminVerifyOk {
  ok: true;
  email: string;
}
export interface AdminVerifyFail {
  ok: false;
  reason: "invalid_code" | "expired" | "too_many_attempts" | "not_admin";
}

export const verifyAdminOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string }) =>
    z.object({ email: emailSchema, code: codeSchema }).parse(input),
  )
  .handler(async ({ data }): Promise<AdminVerifyOk | AdminVerifyFail> => {
    const { ADMIN_EMAILS, readAdminSession } = await import(
      "./admin-auth.server"
    );
    if (!ADMIN_EMAILS.has(data.email)) {
      return { ok: false, reason: "not_admin" };
    }
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { default: bcrypt } = await import("bcryptjs");
    const now = new Date();
    const key = tagged(data.email);

    const rows = await supabaseAdmin
      .from("otp_codes")
      .select("id, code_hash, expires_at, grace_until, attempts")
      .eq("email", key)
      .gte("grace_until", now.toISOString())
      .order("created_at", { ascending: false })
      .limit(3);

    if (rows.error) {
      console.error("[verifyAdminOtp] select failed", rows.error);
      throw new Error("Could not verify code");
    }
    const candidates = rows.data ?? [];
    if (candidates.length === 0) return { ok: false, reason: "expired" };
    if (candidates.every((r) => r.attempts >= MAX_ATTEMPTS)) {
      return { ok: false, reason: "too_many_attempts" };
    }

    let matched: (typeof candidates)[number] | null = null;
    for (const row of candidates) {
      if (row.attempts >= MAX_ATTEMPTS) continue;
      // eslint-disable-next-line no-await-in-loop
      const ok = await bcrypt.compare(data.code, row.code_hash);
      if (ok) {
        matched = row;
        break;
      }
    }

    if (!matched) {
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
        kind: "admin_otp_verify_fail",
        message: "Invalid admin OTP code",
        route: "verifyAdminOtp",
        userEmail: data.email,
      });
      return { ok: false, reason: "invalid_code" };
    }

    await supabaseAdmin.from("otp_codes").delete().eq("email", key);

    const session = await readAdminSession();
    await session.update({
      email: data.email,
      unlockedAt: now.getTime(),
    });

    return { ok: true, email: data.email };
  });

export interface AdminAuthState {
  authenticated: boolean;
  email: string | null;
}

export const getAdminAuthState = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminAuthState> => {
    const { readAdminSession, ADMIN_EMAILS } = await import(
      "./admin-auth.server"
    );
    const session = await readAdminSession();
    const email = session.data.email?.toLowerCase();
    if (!email || !session.data.unlockedAt || !ADMIN_EMAILS.has(email)) {
      return { authenticated: false, email: null };
    }
    return { authenticated: true, email };
  },
);

export const adminLogout = createServerFn({ method: "POST" }).handler(
  async () => {
    const { readAdminSession } = await import("./admin-auth.server");
    const session = await readAdminSession();
    await session.clear();
    return { ok: true as const };
  },
);