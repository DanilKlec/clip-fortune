import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Film, ArrowRight, Loader2 } from "lucide-react";
import {
  listAnalyses,
  deleteAnalysis,
  type AnalysisRecord,
} from "@/lib/analyses-store";
import { useViralitySession } from "@/lib/virality-session";

export const Route = createFileRoute("/_gated/history")({
  head: () => ({
    meta: [
      { title: "Analysis History — Robinzone" },
      {
        name: "description",
        content: "All your previous video analyses in one place.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HistoryPage,
});

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryPage() {
  const navigate = useNavigate();
  const { loadFromRecord } = useViralitySession();
  const [items, setItems] = useState<AnalysisRecord[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const rows = await listAnalyses();
        setItems(rows);
      } catch (err) {
        console.error(err);
        toast.error("Couldn't load history");
        setItems([]);
      }
    })();
  }, []);

  const openReport = (rec: AnalysisRecord) => {
    loadFromRecord(rec);
    navigate({ to: "/report" });
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteAnalysis(id);
      setItems((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    } catch (err) {
      console.error(err);
      toast.error("Couldn't delete");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="page-shell mx-auto w-full max-w-5xl py-8 sm:py-12 md:py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1
            className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.025em] text-foreground sm:text-[44px]"
          >
            Your <span style={{ fontStyle: "italic" }}>history</span>
          </h1>
          <p className="mt-2 text-[14px] font-medium text-[color:var(--muted-foreground)]">
            Every video you&rsquo;ve analyzed, ready to reopen.
          </p>
        </div>
      </div>

      {items === null && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin" size={22} />
        </div>
      )}

      {items !== null && items.length === 0 && (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--card-border)",
          }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--tile)" }}
          >
            <Film size={22} strokeWidth={1.75} className="text-volt" />
          </div>
          <div className="mt-4 text-[16px] font-semibold text-foreground">
            No analyses yet
          </div>
          <p className="mt-1 text-[13px] font-medium text-[color:var(--muted-foreground)]">
            Upload your first video to see it here.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="button-cta mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Analyze a video
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((rec) => (
            <li
              key={rec.id}
              className="group flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-[var(--shadow-card)]"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <button
                onClick={() => openReport(rec)}
                className="relative block aspect-[9/12] w-full overflow-hidden text-left"
                style={{ background: "var(--tile)" }}
              >
                {rec.poster ? (
                  <img
                    src={rec.poster}
                    alt={rec.file_name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film size={28} strokeWidth={1.5} className="text-muted-foreground" />
                  </div>
                )}
                {rec.overall_score !== null && (
                  <div
                    className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[12px] font-bold text-foreground"
                    style={{
                      background: "var(--volt)",
                    }}
                  >
                    {rec.overall_score}
                  </div>
                )}
                <div className="absolute bottom-2 left-2 rounded-md bg-background/70 px-2 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur">
                  {formatDuration(rec.duration)}
                </div>
              </button>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div
                  className="truncate text-[13px] font-semibold text-foreground"
                  title={rec.file_name}
                >
                  {rec.file_name}
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>{formatDate(rec.created_at)}</span>
                  <span>{formatSize(rec.file_size)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openReport(rec)}
                    className="button-utility inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-colors hover:bg-[color:var(--surface-hover)]"
                  >
                    Open report
                    <ArrowRight size={14} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    disabled={busyId === rec.id}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[color:var(--tile)]"
                    aria-label="Delete analysis"
                  >
                    {busyId === rec.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}