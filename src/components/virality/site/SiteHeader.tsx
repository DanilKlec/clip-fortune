import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAuthState, logout } from "@/lib/auth.functions";
import { RobinzoneMark } from "./RobinzoneMark";
import { FeedbackIcons } from "./FeedbackPopover";
import { CreditBalanceWidget } from "./CreditBalanceWidget";
import { NavMegaMenu } from "./NavMegaMenu";
import type { NavVerb } from "./nav-menu-data";

const triggerBase =
  "inline-flex items-center gap-2 h-9 rounded-full px-5 text-sm font-medium transition-colors duration-150";
const triggerInactive = "text-muted-foreground hover:text-foreground";
const triggerActive = "text-foreground";

// Transparent fill, only the outline is tinted, 26px tall.
const badgeClass =
  "inline-flex items-center rounded-full border border-primary/25 bg-transparent px-2 py-0.5 text-[9px] leading-[20px] font-bold uppercase tracking-[0.12em] text-primary";

const NAV_VERB_DEFS: { verb: NavVerb; label: string }[] = [
  { verb: "image", label: "Image" },
  { verb: "video", label: "Video" },
];

const tailLinks: { label: string; badge?: string }[] = [
  { label: "Assist", badge: "NEW" },
  { label: "Studio" },
  { label: "Pricing" },
];

function ClickMenuTrigger({
  label,
  active,
  open,
}: {
  label: string;
  active: boolean;
  open: boolean;
}) {
  return (
    <button
      type="button"
      data-state={open ? "open" : "closed"}
      className={`${triggerBase} ${open || active ? triggerActive : triggerInactive}`}
    >
      {label}
      <ChevronDown
        className={`h-3 w-3 opacity-40 transition-transform ${open ? "rotate-180" : ""}`}
      />
    </button>
  );
}

function VerbMenuItem({ verb, label }: { verb: NavVerb; label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span>
          <ClickMenuTrigger label={label} active={false} open={open} />
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        className="w-auto p-0 border-none bg-transparent shadow-none"
      >
        <NavMegaMenu verb={verb} onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const getAuthStateFn = useServerFn(getAuthState);
  const logoutFn = useServerFn(logout);
  const { data: auth } = useQuery({
    queryKey: ["auth-state"],
    queryFn: () => getAuthStateFn(),
    staleTime: 60_000,
  });
  const isLoggedIn = !!auth?.authenticated;
  const email = auth?.email ?? "";
  const displayName = email ? email.split("@")[0] : "Account";

  async function handleLogout() {
    await logoutFn();
    await queryClient.cancelQueries();
    queryClient.removeQueries({ queryKey: ["auth-state"] });
    queryClient.clear();
    await router.invalidate();
    router.navigate({ to: "/", replace: true });
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[rgba(6,8,15,0.88)] backdrop-blur-[32px] backdrop-saturate-150"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="relative flex h-16 items-center overflow-visible">
        <div className="sticky left-0 z-20 flex items-center gap-2.5 shrink-0 pl-4 sm:pl-6 lg:pl-8 pr-3 sm:pr-6 h-16 bg-gradient-to-r from-[#06080f] via-[#06080f] to-transparent">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <RobinzoneMark size={36} radius={10} />
            <div className="hidden lg:block">
              <span className="font-display text-xl font-extrabold tracking-[-0.04em] text-foreground">
                Robinzone
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="hidden md:inline-flex items-center h-11 rounded-full border border-white/[0.08] bg-[rgba(13,15,26,0.6)] px-1 backdrop-blur-xl whitespace-nowrap shrink-0">
          {NAV_VERB_DEFS.map(({ verb, label }, idx) => (
            <span key={verb} className="inline-flex items-center">
              {idx > 0 && <span className="w-px h-4 bg-white/[0.06]" aria-hidden />}
              <VerbMenuItem verb={verb} label={label} />
            </span>
          ))}

          <span className="w-px h-4 bg-white/[0.06]" aria-hidden />
          <span aria-disabled="true" className={`${triggerBase} ${triggerInactive}`}>
            AI Models
          </span>

          {tailLinks.map((link) => (
            <span key={link.label} className="inline-flex items-center">
              <span className="w-px h-4 bg-white/[0.06]" aria-hidden />
              <span
                aria-disabled="true"
                className={`relative ${triggerBase} ${triggerInactive}`}
              >
                {link.label}
                {link.badge && <span className={badgeClass}>{link.badge}</span>}
              </span>
            </span>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="sticky right-0 ml-auto flex max-w-[calc(100%-64px)] items-center gap-1.5 sm:gap-3 shrink-0 pl-2 md:pl-10 pr-3 sm:pr-6 lg:pr-8 h-16 bg-gradient-to-l from-[#06080f] via-[#06080f] to-transparent z-10">
          {/* Bug report & feature request icons */}
          <FeedbackIcons isLoggedIn={isLoggedIn} />

          {isLoggedIn ? (
            <>
              <div className="hidden md:flex items-center gap-3">
                <CreditBalanceWidget />
              </div>
              <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 h-11 pl-1.5 pr-5 rounded-full border border-white/[0.08] bg-[rgba(13,15,26,0.6)] backdrop-blur-xl hover:bg-white/[0.04] hover:border-white/20 transition-all cursor-pointer">
                  <Avatar className="h-8 w-8 border border-primary/40 bg-background">
                    <AvatarFallback className="bg-transparent text-[10px] font-bold uppercase text-primary font-display">
                      {displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline max-w-[7rem] truncate text-[13px] font-medium tracking-tight text-foreground/90">
                    {displayName}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <span aria-disabled="true" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <span aria-disabled="true" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Settings
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 cursor-pointer text-destructive"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <button
              type="button"
              aria-disabled="true"
              className="button-cta inline-flex items-center gap-2 h-11 py-2 px-3.5 sm:px-4 rounded-full bg-primary text-primary-foreground font-extrabold uppercase text-[11px] tracking-[-0.02em] transition-all hover:brightness-110 hover:-translate-y-px active:scale-[0.97]"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}