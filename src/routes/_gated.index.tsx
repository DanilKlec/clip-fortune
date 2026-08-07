import { createFileRoute } from "@tanstack/react-router";
import { ColorGradingPage } from "@/components/color-grading/ColorGradingPage";
import { RateLimitModal } from "@/components/virality/RateLimitModal";
import { useViralitySession } from "@/lib/virality-session";

export const Route = createFileRoute("/_gated/")({
  head: () => ({
    meta: [
      { title: "AI Color Grading — Robinzone" },
      {
        name: "description",
        content:
          "Upload your images and grade them in the browser: presets, live temperature, contrast, highlights and film grain, with before/after compare.",
      },
      { property: "og:title", content: "AI Color Grading — Robinzone" },
      {
        property: "og:description",
        content:
          "Cinematic color grading for your stills — live presets, precise sliders, instant before/after and one-click download.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { rateLimit, clearRateLimit } = useViralitySession();
  return (
    <main className="min-h-screen">
      <ColorGradingPage />
      <RateLimitModal
        open={rateLimit !== null}
        usage={rateLimit}
        onClose={clearRateLimit}
      />
    </main>
  );
}
