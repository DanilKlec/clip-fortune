import { createFileRoute, Outlet } from "@tanstack/react-router";

// Auth gating is handled globally by <LoginOverlay /> in __root.tsx.
// Unauthenticated users see the non-dismissible login banner overlaid on any page.
export const Route = createFileRoute("/_gated")({
  component: () => <Outlet />,
});