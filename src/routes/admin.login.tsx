import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getAdminAuthState,
  requestAdminOtp,
  verifyAdminOtp,
} from "@/lib/admin-auth.functions";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin sign-in" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAdminAuthState().then((s) => {
      if (s.authenticated) navigate({ to: "/admin/emails", replace: true });
    });
  }, [navigate]);

  async function onRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await requestAdminOtp({ data: { email: email.trim() } });
      if (res.ok) {
        setStep("code");
        setInfo("Code sent. Check your inbox.");
      } else if (res.reason === "rate_limited") {
        setError(`Wait ${res.retryInSec ?? 60}s before requesting again.`);
        setStep("code");
      } else {
        setError("This email is not authorized.");
      }
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await verifyAdminOtp({
        data: { email: email.trim(), code: code.trim() },
      });
      if (res.ok) {
        navigate({ to: "/admin/emails", replace: true });
      } else {
        setError(
          res.reason === "invalid_code"
            ? "Invalid code."
            : res.reason === "expired"
              ? "Code expired — request a new one."
              : res.reason === "too_many_attempts"
                ? "Too many attempts — request a new code."
                : "Not authorized.",
        );
      }
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <h1
        className="mb-2 text-[28px] leading-[1.05] tracking-tight text-foreground"
      >
        Admin <span style={{ fontStyle: "italic" }}>sign-in</span>
      </h1>
      <p className="mb-6 text-[13px] text-[color:var(--muted-foreground)]">
        Separate from the app login. Only admin emails can sign in here.
      </p>

      {step === "email" ? (
        <form onSubmit={onRequest} className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 rounded-full border bg-transparent px-3 text-[14px]"
            style={{ borderColor: "var(--card-border)" }}
          />
          <button
            disabled={busy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-purple)]"
            style={{ background: "var(--brand-purple, #4FC3F7)", color: "var(--primary-foreground)" }}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Send code
          </button>
        </form>
      ) : (
        <form onSubmit={onVerify} className="flex flex-col gap-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            required
            autoFocus
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="4-digit code"
            className="h-11 rounded-full border bg-transparent px-3 text-center text-[18px] tracking-[0.4em]"
            style={{ borderColor: "var(--card-border)" }}
          />
          <button
            disabled={busy || code.length !== 4}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-purple)] disabled:opacity-50"
            style={{ background: "var(--brand-purple, #4FC3F7)", color: "var(--primary-foreground)" }}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Verify
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
              setInfo(null);
            }}
            className="text-[12px] text-[color:var(--muted-foreground)] underline"
          >
            Use a different email
          </button>
        </form>
      )}

      {info && (
        <p className="mt-3 text-[12px] text-[color:var(--muted-foreground)]">
          {info}
        </p>
      )}
      {error && (
        <p className="mt-3 text-[12px] text-red-600">{error}</p>
      )}
    </main>
  );
}