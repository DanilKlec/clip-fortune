import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Home, Plus, MessageSquare, Library, User } from "lucide-react";
import { getAuthState } from "@/lib/auth.functions";
import { SITE_LINKS } from "@/lib/site-links";

/**
 * Returns true while any Radix Dialog is open. Radix sets
 * `data-scroll-locked` on <body> for the lifetime of an open dialog.
 */
function useDialogOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () => setOpen(document.body.hasAttribute("data-scroll-locked"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    return () => observer.disconnect();
  }, []);
  return open;
}

type Tab = {
  label: string;
  icon: typeof Home;
  to: (loggedIn: boolean) => string;
  featured?: boolean;
};

const tabs: Tab[] = [
  { label: "Home", icon: Home, to: () => SITE_LINKS.home },
  {
    label: "Assist",
    icon: MessageSquare,
    to: (loggedIn) => (loggedIn ? SITE_LINKS.assist : SITE_LINKS.login),
  },
  {
    label: "Create",
    icon: Plus,
    to: () => SITE_LINKS.create,
    featured: true,
  },
  {
    label: "Creations",
    icon: Library,
    to: (loggedIn) => (loggedIn ? SITE_LINKS.creations : SITE_LINKS.create),
  },
  {
    label: "Profile",
    icon: User,
    to: (loggedIn) => (loggedIn ? SITE_LINKS.dashboard : SITE_LINKS.login),
  },
];

export default function MobileBottomNav() {
  const getAuthStateFn = useServerFn(getAuthState);
  const { data: auth } = useQuery({
    queryKey: ["auth-state"],
    queryFn: () => getAuthStateFn(),
    staleTime: 60_000,
  });
  const isLoggedIn = !!auth?.authenticated;
  const dialogOpen = useDialogOpen();

  if (dialogOpen) return null;

  return (
    <nav
      className="fixed left-0 right-0 z-[100] md:hidden"
      style={{ bottom: "max(0px, var(--vv-bottom, 0px))" }}
    >
      <div
        className="relative border-t border-white/10 bg-[rgba(13,14,28,0.92)] backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div className="flex items-end justify-around h-[72px] px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            if (tab.featured) {
              return (
                <a
                  key={tab.label}
                  href={tab.to(isLoggedIn)}
                  aria-label={tab.label}
                  className="relative flex h-full w-16 flex-col items-center justify-end pb-1.5"
                >
                  <div className="relative -mt-7">
                    <div
                      className="absolute -inset-1.5 rounded-[16px] bg-gradient-to-tr from-volt to-sky opacity-40 blur-lg animate-pulse"
                      aria-hidden
                    />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-[16px] border-2 border-black/10 bg-gradient-to-tr from-volt to-[#E5FF80] shadow-[0_8px_20px_rgba(200,255,0,0.35)] transition-transform active:scale-90">
                      <Icon className="h-6 w-6 text-[#070815]" strokeWidth={2.75} />
                    </div>
                  </div>
                  <span className="mt-1 text-[10px] font-bold tracking-tight text-white/80">
                    {tab.label}
                  </span>
                </a>
              );
            }

            return (
              <a
                key={tab.label}
                href={tab.to(isLoggedIn)}
                aria-label={tab.label}
                className="relative flex h-full flex-1 flex-col items-center justify-end gap-1 pb-2.5 transition-opacity opacity-70 hover:opacity-100"
              >
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <Icon
                    className="relative h-[22px] w-[22px] text-white"
                    fill="none"
                    strokeWidth={2}
                  />
                </span>
                <span className="text-[10px] tracking-tight font-medium text-white">
                  {tab.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
