import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ResultsScreen } from "@/components/virality/ResultsScreen";
import { useViralitySession } from "@/lib/virality-session";

export const Route = createFileRoute("/_gated/report")({
  head: () => ({
    meta: [
      { title: "Your Video Report — Robinzone" },
      {
        name: "description",
        content:
          "Full AI virality report: hook, retention, audience, brain signals, and timestamped fixes for your video.",
      },
      { property: "og:title", content: "Your Video Report — Robinzone" },
      {
        property: "og:description",
        content: "Detailed AI virality report for your uploaded video.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const navigate = useNavigate();
  const { result, usage, reset, fileName } = useViralitySession();

  useEffect(() => {
    if (!result) navigate({ to: "/", replace: true });
  }, [result, navigate]);

  if (!result) return null;

  return (
    <ResultsScreen
      result={result}
      usage={usage}
      fileName={fileName}
      onReset={() => {
        reset();
        navigate({ to: "/" });
      }}
    />
  );
}