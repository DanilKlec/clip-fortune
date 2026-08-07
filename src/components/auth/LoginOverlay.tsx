import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail, X, Check } from "lucide-react";

import { requestOtp, verifyOtp, getAuthState } from "@/lib/auth.functions";
import { attachEmailToOwnedAnalysesFn } from "@/lib/analyses.functions";
import { supabase } from "@/integrations/supabase/client";
import { useLegalModal } from "@/components/virality/legal/LegalModal";
import iconAsset from "@/assets/robinzone-icon.svg.asset.json";

type Step = "email" | "code" | "no_subscription";

function isAuthPath(pathname: string) {
  return pathname.startsWith("/auth") || pathname.startsWith("/lovable/");
}

export function LoginOverlay() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const requestOtpFn = useServerFn(requestOtp);
  const verifyOtpFn = useServerFn(verifyOtp);
  const attachEmailFn = useServerFn(attachEmailToOwnedAnalysesFn);
  const { open: openLegal } = useLegalModal();

  const pathname = router.state.location.pathname;

  const { data: authState } = useQuery({
    queryKey: ["auth-state"],
    queryFn: () => getAuthState(),
    staleTime: 30_000,
  });

  const authenticated = authState?.authenticated === true;
  const shouldShow = !isAuthPath(pathname) && authState !== undefined && !authenticated;

  // Block body scroll while shown.
  useEffect(() => {
    if (!shouldShow) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [shouldShow]);

  // Block Escape key.
  useEffect(() => {
    if (!shouldShow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true } as never);
  }, [shouldShow]);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Reset overlay to the email step whenever it (re)appears — e.g. after logout.
  useEffect(() => {
    if (!shouldShow) return;
    setStep("email");
    setDigits(["", "", "", ""]);
    setError(null);
    setResendIn(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShow]);

  if (!shouldShow) return null;

  const code = digits.join("");
  const codeComplete = code.length === 4;

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await requestOtpFn({ data: { email } });
      if (!res.ok) {
        if (res.reason === "rate_limited") {
          setError(`Please wait ${res.retryInSec}s before requesting a new code.`);
          setResendIn(res.retryInSec);
          setStep("code");
        }
        return;
      }
      setResendIn(60);
      setDigits(["", "", "", ""]);
      setStep("code");
      setToast("Check your mail");
      setTimeout(() => codeRefs.current[0]?.focus(), 50);
    } catch (err) {
      console.error(err);
      setError("Couldn't send the code. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function submitCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!codeComplete) return;
    setError(null);
    setVerifying(true);
    try {
      const res = await verifyOtpFn({ data: { email, code } });
      if (!res.ok) {
        if (res.reason === "invalid_code") setError("Invalid code. Try again.");
        else if (res.reason === "expired") setError("Code expired. Request a new one.");
        else if (res.reason === "too_many_attempts")
          setError("Too many attempts. Request a new code.");
        return;
      }
      if (!res.subscriptionActive) {
        setStep("no_subscription");
        return;
      }
      // Best-effort: pull existing anon-owned analyses on THIS device under the account.
      try {
        const { data: userData } = await supabase.auth.getUser();
        const anonId = userData.user?.id;
        if (anonId) {
          await attachEmailFn({ data: { anonUserId: anonId } });
        }
      } catch (err) {
        console.warn("attachEmail failed", err);
      }
      await queryClient.invalidateQueries({ queryKey: ["auth-state"] });
      await router.invalidate();
    } catch (err) {
      console.error(err);
      setError("Couldn't verify code. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function resend() {
    if (resendIn > 0 || sending) return;
    setError(null);
    setSending(true);
    try {
      const res = await requestOtpFn({ data: { email } });
      if (!res.ok && res.reason === "rate_limited") {
        setResendIn(res.retryInSec);
        setError(`Please wait ${res.retryInSec}s.`);
      } else if (res.ok) {
        setResendIn(60);
        setDigits(["", "", "", ""]);
        setToast("Check your mail");
        codeRefs.current[0]?.focus();
      }
    } finally {
      setSending(false);
    }
  }

  function handleDigitChange(i: number, raw: string) {
    // Handle paste of full code
    const clean = raw.replace(/\D/g, "");
    if (clean.length > 1) {
      const next = clean.slice(0, 4).padEnd(4, "").split("");
      const filled = Array.from({ length: 4 }, (_, k) => next[k] ?? "");
      setDigits(filled);
      setError(null);
      const focusIdx = Math.min(clean.length, 3);
      codeRefs.current[focusIdx]?.focus();
      return;
    }
    const d = clean.slice(-1);
    setDigits((prev) => {
      const copy = [...prev];
      copy[i] = d;
      return copy;
    });
    setError(null);
    if (d && i < 3) codeRefs.current[i + 1]?.focus();
  }

  function handleDigitKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      codeRefs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      codeRefs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 3) {
      codeRefs.current[i + 1]?.focus();
    } else if (e.key === "Enter" && codeComplete) {
      submitCode();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-3 py-6"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="glass relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{ maxHeight: "calc(100dvh - 32px)" }}
      >
        {/* Form column */}
        <div className="relative flex w-full flex-col">
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
            <div className="flex flex-1 flex-col justify-center">
              {step === "email" && <EmailStep
                email={email}
                setEmail={setEmail}
                sending={sending}
                error={error}
                onSubmit={submitEmail}
              />}
              {step === "code" && <CodeStep
                email={email}
                digits={digits}
                error={error}
                resendIn={resendIn}
                verifying={verifying}
                sending={sending}
                codeRefs={codeRefs}
                onDigitChange={handleDigitChange}
                onDigitKeyDown={handleDigitKeyDown}
                onVerify={submitCode}
                onBack={() => {
                  setStep("email");
                  setDigits(["", "", "", ""]);
                  setError(null);
                }}
                onResend={resend}
                completed={codeComplete}
              />}
              {step === "no_subscription" && <NoSubStep
                onTryAnother={() => {
                  setStep("email");
                  setEmail("");
                  setDigits(["", "", "", ""]);
                  setError(null);
                }}
              />}
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-[12px]">
              <button
                type="button"
                onClick={() => openLegal("terms")}
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Terms of Use
              </button>
              <button
                type="button"
                onClick={() => openLegal("privacy")}
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Privacy Policy
              </button>
            </div>
          </div>

          {/* Toast: "Check your mail" */}
          {toast && (
            <div className="pointer-events-none absolute right-6 top-6 lg:right-8 lg:top-8">
              <div
                className="button-cta flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold shadow-lg"
              >
                <Check size={16} strokeWidth={3} />
                {toast}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function EmailStep({
  email,
  setEmail,
  sending,
  error,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  sending: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const canSubmit = /.+@.+\..+/.test(email) && !sending;
  return (
    <div className="flex flex-col items-center text-center">
      <img src={iconAsset.url} alt="Robinzone" className="h-16 w-16 rounded-2xl" />
      <h1 className="mt-6 text-[26px] font-bold leading-tight text-foreground">
        Continue with Email
      </h1>
      <p className="mt-2 max-w-[360px] text-[14px] leading-snug text-muted-foreground">
        Save your analyses, track changes over time, and access advanced Instagram analytics.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex w-full max-w-[400px] flex-col gap-3">
        <div
          className={`flex h-12 items-center gap-2 rounded-full border bg-secondary px-4 transition-colors ${email ? "border-primary" : "border-white/10"}`}
        >
          <Mail size={18} className="text-muted-foreground" />
          <input
            type="email"
            required
            autoFocus
            autoComplete="email"
            inputMode="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-full flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          {email && (
            <button
              type="button"
              onClick={() => setEmail("")}
              className="rounded-full p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear email"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {error && (
          <div className="text-[13px] font-medium text-destructive">{error}</div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`mt-8 inline-flex h-12 items-center justify-center rounded-full text-[15px] font-semibold transition-all disabled:cursor-not-allowed ${canSubmit ? "button-cta" : "button-utility opacity-60"}`}
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : "Continue"}
        </button>
      </form>
    </div>
  );
}

function CodeStep({
  email,
  digits,
  error,
  resendIn,
  verifying,
  sending,
  codeRefs,
  onDigitChange,
  onDigitKeyDown,
  onVerify,
  onBack,
  onResend,
  completed,
}: {
  email: string;
  digits: string[];
  error: string | null;
  resendIn: number;
  verifying: boolean;
  sending: boolean;
  codeRefs: React.MutableRefObject<Array<HTMLInputElement | null>>;
  onDigitChange: (i: number, v: string) => void;
  onDigitKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onVerify: (e?: React.FormEvent) => void;
  onBack: () => void;
  onResend: () => void;
  completed: boolean;
}) {
  const hasError = Boolean(error);

  // Cell state: error > completed (all filled, no error) > default
  const cellStyle = (val: string) => {
    if (hasError) {
      return {
        borderColor: "var(--destructive)",
        color: "var(--destructive)",
        background: "var(--danger-tint)",
      };
    }
    if (completed) {
      return {
        borderColor: "var(--volt)",
        color: "var(--volt)",
        background: "var(--volt-dim)",
      };
    }
    return {
      borderColor: val ? "var(--volt-bdr)" : "var(--card-border)",
      color: "var(--foreground)",
      background: "var(--tile)",
    };
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-[26px] font-bold leading-tight text-foreground">
        Enter Verification Code
      </h1>
      <p className="mt-2 text-[14px] leading-snug text-muted-foreground">
        4-digit code sent to{" "}
        <span className="font-medium text-primary">{email}</span>
        <br />
        Enter it below to continue.
      </p>

      <form onSubmit={onVerify} className="mt-8 flex w-full max-w-[400px] flex-col items-center gap-6">
        <div className="flex items-center justify-center gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                codeRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={d}
              onChange={(e) => onDigitChange(i, e.target.value)}
              onKeyDown={(e) => onDigitKeyDown(i, e)}
              autoComplete="one-time-code"
              className="h-14 w-14 rounded-xl border-2 text-center text-[22px] font-semibold caret-[color:var(--volt)] outline-none transition-colors"
              style={cellStyle(d)}
            />
          ))}
        </div>

        {hasError && (
          <div className="-mt-3 text-[13px] font-medium text-destructive">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onResend}
          disabled={resendIn > 0 || sending}
          className="button-utility rounded-full px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resendIn > 0 ? `Resend code in 0:${String(resendIn).padStart(2, "0")}` : "Resend code"}
        </button>

        <div className="mt-4 flex w-full flex-col gap-3">
          <button
            type="submit"
            disabled={!completed || verifying}
            className={`inline-flex h-12 items-center justify-center rounded-full text-[15px] font-semibold transition-all disabled:cursor-not-allowed ${completed && !verifying ? "button-cta" : "button-utility opacity-60"}`}
          >
            {verifying ? <Loader2 size={16} className="animate-spin" /> : "Verify"}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="button-utility inline-flex h-12 items-center justify-center rounded-full text-[15px] font-semibold"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}

function NoSubStep({ onTryAnother }: { onTryAnother: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <img src={iconAsset.url} alt="" className="h-16 w-16 rounded-2xl opacity-70" />
      <h1 className="mt-6 text-[24px] font-bold leading-tight text-foreground">
        Subscription Required
      </h1>
      <p className="mt-3 max-w-[360px] text-[14px] text-muted-foreground">
        Your subscription isn&rsquo;t active right now. Contact us to reactivate it.
      </p>
      <a
        href="mailto:support@socialsensor.io"
        className="button-cta mt-6 inline-flex h-12 w-full max-w-[400px] items-center justify-center rounded-full text-[15px] font-semibold"
      >
        Contact Us
      </a>
      <button
        type="button"
        onClick={onTryAnother}
        className="mt-4 text-[13px] font-medium text-muted-foreground underline underline-offset-2"
      >
        Try a different email
      </button>
    </div>
  );
}