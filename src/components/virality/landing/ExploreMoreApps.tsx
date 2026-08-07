import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { APPS_CATALOG, type AppCatalogItem } from "@/lib/apps-catalog";

function Badge({ label }: { label: NonNullable<AppCatalogItem["badge"]> }) {
  const isSoon = label === "SOON";
  return (
    <span
      className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.18em]"
      style={{
        background: isSoon ? "var(--tile)" : "var(--volt)",
        color: isSoon ? "var(--text-secondary)" : "var(--primary-foreground)",
        border: isSoon ? "1px solid var(--card-border)" : "1px solid transparent",
      }}
    >
      {label === "SOON" ? "Coming soon" : label}
    </span>
  );
}

function CardBody({ app }: { app: AppCatalogItem }) {
  return (
    <>
      <div
        className="relative flex h-[128px] items-center justify-center overflow-hidden rounded-xl sm:h-[150px]"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, var(--volt-dim), var(--tile) 70%)",
        }}
      >
        {app.badge && <Badge label={app.badge} />}
        <Sparkles
          size={26}
          strokeWidth={1.5}
          className={app.to ? "text-volt" : "text-muted-foreground"}
        />
      </div>
      <h3 className="mt-3 px-1 text-[15px] font-semibold text-foreground">
        {app.title}
      </h3>
      <p className="mt-1 line-clamp-2 px-1 pb-1 text-[13px] font-medium text-muted-foreground">
        {app.description}
      </p>
    </>
  );
}

export function ExploreMoreApps() {
  return (
    <section
      id="explore-apps"
      className="page-shell mx-auto w-full max-w-6xl py-12 sm:py-16 md:py-20"
    >
      <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground">
        Explore more{" "}
        <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
          apps
        </span>
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {APPS_CATALOG.map((app) =>
          app.to ? (
            <Link
              key={app.id}
              to={app.to}
              className="glass rounded-2xl p-3 transition-colors hover:bg-[color:var(--surface-hover)]"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <CardBody app={app} />
            </Link>
          ) : (
            <div
              key={app.id}
              aria-disabled
              className="glass cursor-not-allowed rounded-2xl p-3 opacity-60"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <CardBody app={app} />
            </div>
          ),
        )}
      </div>
    </section>
  );
}