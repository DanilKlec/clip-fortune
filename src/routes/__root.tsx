import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import {
  installClientErrorReporter,
  reportBoundaryError,
} from "../lib/client-error-reporter";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/virality/site/SiteHeader";
import { SiteFooter } from "@/components/virality/site/SiteFooter";
import { ViralitySessionProvider } from "@/lib/virality-session";
import { LegalModalProvider } from "@/components/virality/legal/LegalModal";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
    reportBoundaryError(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Virality Predictor by Robinzone" },
      {
        name: "description",
        content:
          "AI video audit in 30 seconds — get a virality score, target audience, weak spots, and timestamped fixes for your TikTok, Reels, and Shorts.",
      },
      { name: "author", content: "Robinzone" },
      { property: "og:title", content: "Virality Predictor by Robinzone" },
      {
        property: "og:description",
        content:
          "AI video audit in 30 seconds — get a virality score, target audience, weak spots, and timestamped fixes for your TikTok, Reels, and Shorts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Virality Predictor by Robinzone" },
      { name: "twitter:description", content: "AI video audit in 30 seconds — get a virality score, target audience, weak spots, and timestamped fixes for your TikTok, Reels, and Shorts." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/572ec148-48a3-4b44-a538-371708ddce44/id-preview-c57126f4--9bb29aca-7c8b-46c9-a065-5ea328558011.lovable.app-1783688354220.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/572ec148-48a3-4b44-a538-371708ddce44/id-preview-c57126f4--9bb29aca-7c8b-46c9-a065-5ea328558011.lovable.app-1783688354220.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=JetBrains+Mono:wght@300;400;500&display=swap",
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    installClientErrorReporter();
  }, []);

  // Keeps the mobile tab bar pinned to the visible viewport when the browser
  // chrome (iOS Safari toolbar / soft keyboard) shrinks it.
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const update = () => {
      const bottom = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      document.documentElement.style.setProperty("--vv-bottom", `${bottom}px`);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ViralitySessionProvider>
        <LegalModalProvider>
          <SiteHeader />
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <SiteFooter />
          {/* Reserve space on mobile so the bottom tab bar never covers content */}
          <div
            className="md:hidden"
            aria-hidden
            style={{
              height: "calc(60px + env(safe-area-inset-bottom) + var(--vv-bottom, 0px))",
            }}
          />
          <MobileBottomNav />
          <Toaster position="top-center" richColors />
        </LegalModalProvider>
      </ViralitySessionProvider>
    </QueryClientProvider>
  );
}
