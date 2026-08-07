// Server-only session config for the admin panel. Uses a SEPARATE cookie
// (`ss_admin`) so admin sign-in is independent of the app's subscriber
// session — signing in as admin does NOT sign you into the app, and vice
// versa. Access is gated by an email allowlist, not a paid subscription.
import { useSession } from "@tanstack/react-start/server";

export const ADMIN_EMAILS = new Set<string>([
  "yermakov.art@savva.tech",
]);

export interface AdminSessionData {
  email?: string;
  unlockedAt?: number;
}

function getAdminSessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password) throw new Error("SESSION_SECRET is not configured");
  return {
    password,
    name: "ss_admin",
    maxAge: 60 * 60 * 24 * 30,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
    },
  };
}

export async function readAdminSession() {
  return await useSession<AdminSessionData>(getAdminSessionConfig());
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}

export async function requireAdminSessionEmail(): Promise<string> {
  const session = await readAdminSession();
  const email = session.data.email?.toLowerCase();
  if (!email || !session.data.unlockedAt || !ADMIN_EMAILS.has(email)) {
    throw new Error("Forbidden");
  }
  return email;
}