import { useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { NAV_MENUS, type NavMenuModel, type NavVerb } from "./nav-menu-data";

function ModelLogo({ model }: { model: NavMenuModel }) {
  const [errored, setErrored] = useState(false);

  if (!model.logo || errored) {
    return (
      <div className="h-10 w-10 rounded-lg bg-tile flex items-center justify-center shrink-0 text-sm font-bold text-foreground">
        {model.provider.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="h-10 w-10 rounded-lg bg-tile flex items-center justify-center shrink-0 p-2">
      <img
        src={model.logo}
        alt={model.provider}
        className="h-full w-full object-contain grayscale"
        onError={() => setErrored(true)}
        loading="lazy"
      />
    </div>
  );
}

function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="badge-sky">
      {tag}
    </span>
  );
}

const sectionLabel =
  "text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em] mb-3 px-1";
const rowClass =
  "group flex items-center gap-3 p-3 rounded-lg border border-transparent hover:bg-surface-hover hover:border-card-border transition-all duration-150";
const itemName = "text-sm font-semibold text-foreground line-clamp-1 font-display tracking-tight";
const itemDesc = "text-xs text-muted-foreground line-clamp-2 mt-0.5 font-light";
const seeAll =
  "mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors px-3";

export function NavMegaMenu({ verb, onNavigate }: { verb: NavVerb; onNavigate?: () => void }) {
  const { models, modelsAllTo, label, subtitle, studioTo, studioLabel } = NAV_MENUS[verb];

  return (
    <div className="w-[460px] p-5 bg-popover border border-card-border rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
      <div className="mb-3 px-1">
        <p className="font-display font-bold text-[1rem] text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground font-light">{subtitle}</p>
      </div>
      <a
        href={studioTo}
        onClick={onNavigate}
        className="group mb-4 flex items-center justify-between gap-3 rounded-full border border-primary/30 bg-primary/10 px-4 py-3 transition-colors hover:border-primary/50 hover:bg-primary/15"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Studio</p>
          <p className="font-display text-sm font-semibold text-foreground">{studioLabel}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
      </a>
      <p className={sectionLabel}>Featured Models</p>
      <div className="space-y-0.5">
        {models.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-3">No models yet.</p>
        )}
        {models.map((m) => (
          <a key={m.id} href={m.href} onClick={onNavigate} className={rowClass}>
            <ModelLogo model={m} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className={itemName}>{m.name}</p>
                <div className="flex flex-wrap gap-1 shrink-0">
                  {m.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </div>
              </div>
              <p className={itemDesc}>{m.description || m.provider}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </a>
        ))}
      </div>
      <a href={modelsAllTo} onClick={onNavigate} className={seeAll}>
        See all models <ArrowRight className="h-3 w-3" />
      </a>
    </div>
  );
}

export default NavMegaMenu;