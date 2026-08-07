import { createFileRoute, redirect } from "@tanstack/react-router";

// The dedicated login page has been replaced by the global <LoginOverlay />
// mounted in __root.tsx. Keep this route for backwards compatibility and
// redirect any old links back to the home page.
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});