import { Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SITE_LINKS } from "@/lib/site-links";

/**
 * Visual parity with the main site's credit pill. Presentation-only:
 * balance data lives on robinzone.ai, so the pill links to pricing.
 */
export function CreditBalanceWidget({ compact = false }: { compact?: boolean }) {
  const balance = 0;
  const allowance = 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={SITE_LINKS.pricing}
            aria-label={`${balance} of ${allowance} credits remaining`}
            className={`relative inline-flex items-center rounded-full border border-white/[0.08] bg-[rgba(13,15,26,0.6)] backdrop-blur-xl hover:bg-white/[0.04] transition-colors ${
              compact ? "h-9 px-3 gap-2" : "h-11 px-5 gap-3"
            }`}
          >
            <Zap
              className={`text-primary fill-primary drop-shadow-[0_0_8px_rgba(200,255,0,0.4)] ${
                compact ? "h-3.5 w-3.5" : "h-4 w-4"
              }`}
            />
            <div className="flex items-center gap-1.5 text-[13px] tracking-tight">
              <span className="font-semibold text-foreground tabular-nums">
                {balance.toLocaleString()}
              </span>
              {!compact && (
                <>
                  <span className="text-foreground/60">/</span>
                  <span className="text-foreground/60 tabular-nums">
                    {allowance.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            <strong>{balance.toLocaleString()}</strong> of {allowance.toLocaleString()} credits
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Manage credits on Robinzone</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CreditBalanceWidget;