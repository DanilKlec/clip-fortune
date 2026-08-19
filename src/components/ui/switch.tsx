import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";
import type { SliderVariant } from "@/components/ui/slider";

/** Same accent tokens as Slider so a group's Switch and Slider always match. */
const ACCENT: Record<SliderVariant, string> = {
  volt: "var(--volt)",
  primary: "var(--volt)",
  sky: "var(--sky)",
  plasma: "var(--plasma)",
};

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & { variant?: SliderVariant }
>(({ className, variant = "primary", style, ...props }, ref) => (
  <SwitchPrimitives.Root
    data-variant={variant}
    style={{ ["--switch-accent" as string]: ACCENT[variant], ...style }}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors duration-[180ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--switch-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--switch-accent)] data-[state=unchecked]:bg-input",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-[180ms] data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
