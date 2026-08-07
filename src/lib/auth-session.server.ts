// Session config + helpers shared by auth server functions and middleware.
// Server-only (relies on process.env and AsyncLocalStorage).
import { useSession } from "@tanstack/react-start/server";
import { createMiddleware } from "@tanstack/react-start";

export interface AuthSessionData {
  email?: string;
  subscriptionId?: string;
  nextChargeAt?: string | null; // ISO
  unlockedAt?: number;
}

export function getSessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return {
    password,
    name: "ss_auth",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
    },
  };
}

export async function readAuthSession() {
  return await useSession<AuthSessionData>(getSessionConfig());
}

// Server-function middleware: requires an unlocked session. Attaches
// { email, subscriptionId, nextChargeAt } to context. Throws 401 otherwise.
// The lazy subscription re-check lives in the getAuthState server function,
// which the client polls before entering gated routes.
export const requireAuthSession = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const session = await readAuthSession();
    if (!session.data.email || !session.data.unlockedAt) {
      throw new Error("Unauthorized");
    }
    return next({
      context: {
        email: session.data.email,
        subscriptionId: session.data.subscriptionId ?? null,
        nextChargeAt: session.data.nextChargeAt ?? null,
      },
    });
  },
);