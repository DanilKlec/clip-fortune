import { createFileRoute } from "@tanstack/react-router";
import { UploadScreen } from "@/components/virality/UploadScreen";
import { RateLimitModal } from "@/components/virality/RateLimitModal";
import { useViralitySession } from "@/lib/virality-session";

export const Route = createFileRoute("/_gated/")({
  head: () => ({
    meta: [
      { title: "Viral Potential Predictor — Robinzone" },
      {
        name: "description",
        content:
          "Upload a short clip and get a modeled read on its hook strength, attention curve, and viral potential.",
      },
      { property: "og:title", content: "Viral Potential Predictor — Robinzone" },
      {
        property: "og:description",
        content:
          "Predict how viral your video hook is before you post — hook strength, attention curve, brain signals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { file, usage, rateLimit, clearRateLimit } = useViralitySession();
  return (
    <main className="min-h-screen">
      <UploadScreen initialFile={file} usage={usage} />
      <RateLimitModal
        open={rateLimit !== null}
        usage={rateLimit}
        onClose={clearRateLimit}
      />
    </main>
  );
}
