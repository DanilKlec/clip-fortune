import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Bug, Lightbulb, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Mode = "bug" | "idea";

interface FeedbackPopoverProps {
  mode: Mode;
  trigger: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

export function FeedbackPopover({
  mode,
  trigger,
  align = "end",
  side = "bottom",
}: FeedbackPopoverProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const value = text.trim();
    if (!value) {
      toast.error("Cannot submit", { description: "Please add a description." });
      return;
    }
    setSubmitting(true);
    // Storage is wired once both projects share one backend.
    await new Promise((r) => setTimeout(r, 400));
    setSubmitting(false);
    toast.success(mode === "bug" ? "Bug reported" : "Idea submitted", {
      description:
        mode === "bug"
          ? "Thanks — our team will take a look."
          : "Thanks — we'll review your suggestion.",
    });
    setText("");
    setOpen(false);
  };

  const heading = mode === "bug" ? "Report a bug" : "Suggest a feature";
  const placeholder =
    mode === "bug"
      ? "What went wrong? Steps to reproduce, what you expected, what happened…"
      : "What would make Robinzone better? Describe the feature, the use case, and why it matters…";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={8}
        collisionPadding={12}
        className="w-[min(20rem,calc(var(--vvw,100vw)-1.5rem))] p-4"
      >
        <div className="space-y-3">
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide">
              {heading}
            </h4>
            <p className="mt-1 text-xs text-muted-foreground break-all">
              Page: <span className="font-mono">{pathname}</span>
            </p>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            maxLength={2000}
            rows={5}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{text.length}/2000</span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || text.trim().length === 0}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2">Send</span>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Compact icon buttons for bug report & feature request. */
export function FeedbackIcons({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (!isLoggedIn) return null;

  const btnClass =
    "relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-foreground/80 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-foreground active:scale-95";

  return (
    <div className="flex items-center gap-1.5">
      <FeedbackPopover
        mode="bug"
        trigger={
          <button type="button" aria-label="Report a bug" className={btnClass}>
            <Bug className="h-4 w-4" strokeWidth={2.2} />
          </button>
        }
      />
      <FeedbackPopover
        mode="idea"
        trigger={
          <button type="button" aria-label="Suggest a feature" className={btnClass}>
            <Lightbulb className="h-4 w-4" strokeWidth={2.2} />
          </button>
        }
      />
    </div>
  );
}