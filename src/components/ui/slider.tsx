import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

/** Design-system accent variants. Only fill, thumb border and focus ring change. */
export type SliderVariant = "volt" | "primary" | "sky" | "plasma";

const ACCENT: Record<SliderVariant, string> = {
  volt: "var(--volt)",
  primary: "var(--volt)",
  sky: "var(--sky)",
  plasma: "var(--plasma)",
};

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { variant?: SliderVariant }
>(({ className, variant = "volt", style, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    data-variant={variant}
    style={{ ["--slider-accent" as string]: ACCENT[variant], ...style }}
    // touch-pan-y: a vertical swipe scrolls the page/panel, a horizontal drag
    // still changes the value.
    className={cn(
      "relative flex h-5 w-full touch-pan-y select-none items-center data-[disabled]:opacity-45",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-[var(--slider-accent)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[var(--slider-accent)] bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slider-accent)] disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
