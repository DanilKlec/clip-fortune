import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { adminLogout } from "@/lib/admin-auth.functions";

const tabs = [
  { to: "/admin/emails", label: "Emails" },
  { to: "/admin/errors", label: "Errors" },
] as const;

export function AdminNav({ active }: { active: "emails" | "errors" }) {
  const navigate = useNavigate();
  return (
    <div className="mb-4 flex items-center justify-between gap-3 border-b pb-3" style={{ borderColor: "var(--card-border)" }}>
      <nav className="flex items-center gap-1">
        {tabs.map((t) => {
          const isActive = t.label.toLowerCase() === active;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="h-9 rounded-[10px] px-3 text-[13px] font-semibold inline-flex items-center"
              style={{
                background: isActive ? "var(--brand-purple, #4FC3F7)" : "transparent",
                color: isActive ? "#fff" : "var(--foreground)",
                border: "1px solid var(--card-border)",
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={async () => {
          await adminLogout();
          navigate({ to: "/admin/login", replace: true });
        }}
        className="inline-flex h-9 items-center gap-2 rounded-[10px] border px-3 text-[13px] font-semibold"
        style={{ borderColor: "var(--card-border)" }}
      >
        <LogOut size={14} />
        Sign out
      </button>
    </div>
  );
}

/**
 * Small info tooltip next to a stat/label. Explains what a metric watches
 * and what it means if it is misbehaving — so an admin can read the
 * dashboard without prior context.
 */
export function InfoTip({ text }: { text: string }) {
  return (
    <span
      title={text}
      aria-label={text}
      className="ml-1 inline-flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full text-[10px] font-bold"
      style={{
        border: "1px solid var(--card-border)",
        color: "var(--muted-foreground)",
        lineHeight: 1,
      }}
    >
      i
    </span>
  );
}