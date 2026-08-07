export interface AppCatalogItem {
  id: string;
  title: string;
  description: string;
  badge?: "NEW" | "PRO" | "SOON";
  to?: string;
}

export const APPS_CATALOG: AppCatalogItem[] = [
  {
    id: "virality-predictor",
    title: "Virality Predictor",
    description: "Predict how viral your video hook is before you post",
    badge: "NEW",
    to: "/",
  },
  {
    id: "hook-rewriter",
    title: "Hook Rewriter",
    description: "Rewrite the first three seconds into stronger openings",
    badge: "SOON",
  },
  {
    id: "thumbnail-scorer",
    title: "Thumbnail Scorer",
    description: "Rank thumbnail variants by predicted click-through",
    badge: "SOON",
  },
  {
    id: "caption-studio",
    title: "Caption Studio",
    description: "Generate captions tuned for retention and reach",
    badge: "SOON",
  },
  {
    id: "audience-fit",
    title: "Audience Fit",
    description: "See which audience segment your clip resonates with",
    badge: "SOON",
  },
  {
    id: "trend-radar",
    title: "Trend Radar",
    description: "Track rising formats and sounds before they peak",
    badge: "SOON",
  },
  {
    id: "cut-planner",
    title: "Cut Planner",
    description: "Timestamped edit suggestions to hold attention longer",
    badge: "SOON",
  },
  {
    id: "ab-tester",
    title: "A/B Tester",
    description: "Compare two cuts and see which one wins",
    badge: "SOON",
  },
];