import { Loader2, Sparkles, Wand2 } from "lucide-react";
import type { GradingMode } from "./useImageLibrary";

interface Props {
  mode: GradingMode;
  busy: boolean;
  /** No image selected yet. */
  disabled?: boolean;
  onGenerate: () => void;
  className?: string;
}

/**
 * The single Generate CTA shared by the desktop panel and the mobile card.
 * Manual finalises the local grade; AI calls the server endpoint.
 */
export function GenerateAction({ mode, busy, disabled = false, onGenerate, className }: Props) {
  const label = busy
    ? mode === "manual"
      ? "Applying…"
      : "Generating…"
    : mode === "manual"
      ? "Generate"
      : "Generate";
  const Icon = mode === "manual" ? Wand2 : Sparkles;
  return (
    <button
      type="button"
      disabled={disabled || busy}
      aria-busy={busy}
      aria-label={mode === "manual" ? "Generate manual grade" : "Generate AI color grade"}
      onClick={onGenerate}
      className={`button-cta flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-45 ${className ?? ""}`}
    >
      {busy ? (
        <Loader2 size={18} strokeWidth={2} className="animate-spin" />
      ) : (
        <Icon size={18} strokeWidth={2} />
      )}
      {label}
    </button>
  );
}
