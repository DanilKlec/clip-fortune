import { useEffect, useRef, useState, type CSSProperties, type DragEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { AlertTriangle, Columns2, Download, ImagePlus, Loader2, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { GradedImage } from "./GradedImage";
import { BeforeAfter } from "./BeforeAfter";
import { ImageStage, useImageAspect } from "./ImageStage";
import { ImageTray } from "./ImageTray";
import { AdjustmentPanel } from "./AdjustmentPanel";
import { PresetPicker } from "./PresetPicker";
import { MobilePresetStrip } from "./MobilePresetStrip";
import { CollapsibleSection } from "./CollapsibleSection";
import { MobileControlPanel } from "./MobileControlPanel";
import {
  ACCEPTED_LABEL,
  MAX_BYTES,
  MAX_IMAGES,
  createImageState,
  fileKey,
  isAccepted,
  useImageLibrary,
  type GradeRequestSnapshot,
  type ImageState,
} from "./useImageLibrary";
import { generateColorGrade } from "./adapter";
import {
  DEFAULT_ENABLED,
  NEUTRAL,
  PRESETS,
  allEnabled,
  effectiveAdjustments,
  isNeutral,
  sameValues,
  type AdjustmentKey,
  type Preset,
} from "./grading";
import { ThreeSteps } from "./sections/ThreeSteps";
import { SeeItInAction } from "./sections/SeeItInAction";
import { BuiltForCinematicLooks } from "./sections/BuiltForCinematicLooks";
import { ExploreMoreApps } from "@/components/virality/landing/ExploreMoreApps";
import demoImage from "@/assets/grading-demo.jpg";

export function ColorGradingPage() {
  const { images, active, activeId, activeState, states, setActiveId, add, remove, replace, patchState, addResult } =
    useImageLibrary();

  const [dragOver, setDragOver] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(true);
  // Sections start collapsed — sliders appear only when a section is expanded.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ color: false });

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const runSeq = useRef(0);
  const statesRef = useRef(states);
  useEffect(() => {
    statesRef.current = states;
  }, [states]);

  /** Settings are editable before any upload; they carry over to the first image. */
  const [draft, setDraft] = useState<ImageState>(() => createImageState());
  const st: ImageState = activeState ?? draft;
  const status = activeState ? activeState.status : "ready";
  const busy = status === "generating";
  const custom = !allEnabled(st.enabled);

  const ratio = useImageAspect(active?.url);
  const effective = effectiveAdjustments(st.adjustments, st.enabled);
  /** Session history of AI results for the active image. */
  const results = activeState?.results ?? [];
  /** Selected AI version, or null when the live local grade is shown. */
  const aiUrl = activeState && st.resultIndex >= 0 ? (results[st.resultIndex] ?? null) : null;
  const canCompare = Boolean(aiUrl) || !isNeutral(effective);
  const showOriginal = st.view === "original";
  const compareOn = st.compare;
  const comparing = compareOn && canCompare && !showOriginal;

  /** View-only switches: they never touch the grade, result or Fal.ai. */
  const setView = (view: "original" | "edited") => {
    if (!activeId) return;
    patchState(activeId, (s) => ({ ...s, view }));
  };
  const toggleCompare = () => {
    if (!activeId) return;
    patchState(activeId, (s) => ({ ...s, compare: !s.compare, view: "edited" }));
  };
  /** Pick a version to preview: -1 is the live local grade, else an AI result. */
  const selectVersion = (index: number) => {
    if (!activeId) return;
    patchState(activeId, (s) => ({ ...s, resultIndex: index, view: "edited" }));
  };

  /** Any input change invalidates the current result for the active image only. */
  const editActive = (patch: (s: ImageState) => Partial<ImageState>) => {
    if (!activeId) {
      setDraft((s) => ({ ...s, ...patch(s), error: null, status: "ready" }));
      return;
    }
    const id = activeId;
    const run = ++runSeq.current;
    // Editing never discards existing AI results — it only switches the preview
    // back to the live local grade.
    patchState(id, (s) => ({
      ...s,
      ...patch(s),
      run,
      error: null,
      status: s.status === "generating" ? s.status : "ready",
      resultIndex: -1,
    }));
  };

  const acceptFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    const typed = files.filter(isAccepted);
    if (typed.length < files.length) {
      toast.error(`Only ${ACCEPTED_LABEL} images are supported`);
    }
    const sized = typed.filter((f) => f.size <= MAX_BYTES);
    if (sized.length < typed.length) {
      toast.error("Some files are larger than 20MB and were skipped");
    }
    const seen = new Set(images.map((i) => fileKey(i.file)));
    const unique = sized.filter((f) => {
      const k = fileKey(f);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (unique.length < sized.length) {
      toast("Duplicate images were skipped");
    }
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`You can work with up to ${MAX_IMAGES} images`);
      return;
    }
    if (unique.length > room) {
      toast.error(`Only ${MAX_IMAGES} images can be used — extras were skipped`);
    }
    const ok = unique.slice(0, room);
    if (ok.length === 0) return;
    add(
      ok,
      images.length === 0
        ? {
            prompt: draft.prompt,
            presetId: draft.presetId,
            adjustments: { ...draft.adjustments },
            enabled: { ...draft.enabled },
          }
        : undefined,
    );
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    acceptFiles(e.dataTransfer.files);
  };

  const updateAdjustment = (key: AdjustmentKey, value: number) => {
    editActive((s) => {
      const adjustments = { ...s.adjustments, [key]: value };
      const match = PRESETS.find((p) => sameValues(p.values, adjustments));
      return { adjustments, presetId: match?.id ?? null };
    });
  };

  const toggleEffect = (key: AdjustmentKey, on: boolean) => {
    editActive((s) => ({ enabled: { ...s.enabled, [key]: on } }));
  };

  const resetKey = (key: AdjustmentKey) => updateAdjustment(key, NEUTRAL[key]);

  const resetAll = () => {
    editActive(() => ({
      adjustments: { ...NEUTRAL },
      enabled: { ...DEFAULT_ENABLED },
      presetId: PRESETS[0].id,
    }));
  };

  const pickPreset = (preset: Preset) => {
    editActive(() => ({ adjustments: { ...preset.values }, presetId: preset.id }));
  };

  const generate = async (id: string | null, snapshot?: GradeRequestSnapshot | null) => {
    if (!id) return;
    const img = images.find((i) => i.id === id);
    const current = statesRef.current[id];
    if (!img || !current || current.status === "generating") return;

    const snap: GradeRequestSnapshot = snapshot ?? {
      prompt: current.prompt,
      presetId: current.presetId,
      adjustments: current.adjustments,
      enabled: current.enabled,
    };
    const run = ++runSeq.current;
    patchState(id, (s) => ({
      ...s,
      status: "generating",
      error: null,
      run,
      lastRequest: snap,
    }));

    try {
      // The selected image is primary; the others travel as reference frames.
      const ordered = [img.file, ...images.filter((i) => i.id !== id).map((i) => i.file)];
      const res = await generateColorGrade({
        images: ordered.slice(0, MAX_IMAGES),
        prompt: snap.prompt,
        presetId: snap.presetId,
        adjustments: effectiveAdjustments(snap.adjustments, snap.enabled),
      });
      // Discard responses that belong to a superseded request or a deleted image.
      if (statesRef.current[id]?.run !== run) {
        if (res.imageUrl.startsWith("blob:")) URL.revokeObjectURL(res.imageUrl);
        return;
      }
      addResult(id, res.imageUrl);
      patchState(id, (s) =>
        s.run === run ? { ...s, status: "success", error: null, comparePos: 50, view: "edited" } : s,
      );
    } catch (err) {
      if (statesRef.current[id]?.run !== run) return;
      const message = err instanceof Error ? err.message : "Something went wrong while grading";
      patchState(id, (s) => (s.run === run ? { ...s, status: "error", error: message } : s));
    }
  };

  const hasImages = images.length > 0;
  const hasResult = Boolean(aiUrl);

  const download = async () => {
    const url = aiUrl;
    if (!url) return;
    let href = url;
    let temp: string | null = null;
    if (!url.startsWith("blob:")) {
      try {
        const blob = await (await fetch(url)).blob();
        temp = URL.createObjectURL(blob);
        href = temp;
      } catch {
        toast.error("Could not download the image");
        return;
      }
    }
    const a = document.createElement("a");
    a.href = href;
    a.download = `color-grade-${Date.now()}.jpg`;
    a.click();
    if (temp) setTimeout(() => URL.revokeObjectURL(temp), 4000);
  };

  const tray = (orientation: "horizontal" | "vertical") => (
    <ImageTray
      orientation={orientation}
      images={images}
      activeId={activeId}
      onSelect={setActiveId}
      onRemove={remove}
      onReplace={replace}
      onAdd={acceptFiles}
    />
  );

  /** Single source for every control — rendered either in the desktop rail or the mobile panel. */
  const adjustmentsNode = (grouped: boolean) => (
    <AdjustmentPanel
      values={st.adjustments}
      enabled={st.enabled}
      onChange={updateAdjustment}
      onToggle={toggleEffect}
      onResetKey={resetKey}
      onResetAll={resetAll}
      grouped={grouped}
      hideResetAll={grouped}
      openGroups={openGroups}
      onToggleGroup={(gid) => setOpenGroups((prev) => ({ ...prev, [gid]: !prev[gid] }))}
    />
  );

  const generateButton = (
    <button
      type="button"
      disabled={!active || busy}
      onClick={() => void generate(activeId)}
      className="button-cta flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-45"
    >
      {busy ? <Loader2 size={18} strokeWidth={2} className="animate-spin" /> : <Sparkles size={18} strokeWidth={2} />}
      {busy ? "Generating…" : "Generate"}
    </button>
  );

  const promptBlockNode = (withGenerate: boolean) => (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <label
          htmlFor="grade-prompt"
          className="font-display text-[13px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground"
        >
          Describe your look
        </label>
        <span className="badge-sky">AI</span>
      </div>
      <Textarea
        id="grade-prompt"
        value={st.prompt}
        onChange={(e) => editActive(() => ({ prompt: e.target.value }))}
        placeholder="Describe the color grade you want…"
        rows={3}
        className="mt-3 w-full rounded-xl border text-[16px] sm:text-[15px]"
        style={{ background: "var(--tile)", borderColor: "var(--card-border)" }}
      />
      {withGenerate && <div className="mt-3">{generateButton}</div>}
      <p className="mt-2 text-[12px] font-medium text-muted-foreground">
        {!active
          ? "Add an image to unlock grading."
          : status === "success"
            ? "Result ready — drag the handle to compare."
            : "Optional. Combined with your preset and the enabled adjustments."}
      </p>
    </div>
  );

  const presetsNode = (
    <CollapsibleSection id="presets" label="Presets" open={presetsOpen} onToggle={() => setPresetsOpen((v) => !v)}>
      <PresetPicker activeId={st.presetId} custom={custom} onPick={pickPreset} hideHeading />
    </CollapsibleSection>
  );

  const resultActions = (
    <div className="grid min-w-0 gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={resetAll}
          className="button-utility flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw size={15} strokeWidth={2} />
          Reset
        </button>
        <button
          type="button"
          onClick={() => void download()}
          disabled={!hasResult}
          className="button-cta flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download size={16} strokeWidth={2} />
          Download
        </button>
      </div>
      {results.length > 0 && (
        <button
          type="button"
          onClick={() => void generate(activeId, st.lastRequest)}
          className="button-utility flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw size={16} strokeWidth={2} />
          Generate again
        </button>
      )}
    </div>
  );

  const errorBlock = status === "error" && (
    <div
      className="grid min-w-0 gap-3 rounded-xl border p-3"
      style={{ borderColor: "var(--coral-bdr)", background: "var(--coral-dim)" }}
    >
      <div className="flex min-w-0 items-start gap-2">
        <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-destructive" />
        <p className="min-w-0 flex-1 text-[13px] font-medium text-foreground">{st.error ?? "Generation failed"}</p>
      </div>
      <button
        type="button"
        onClick={() => void generate(activeId, st.lastRequest)}
        className="button-utility flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RefreshCw size={15} strokeWidth={2} />
        Retry
      </button>
    </div>
  );

  return (
    <div className="w-full">
      <section className="page-shell mx-auto w-full max-w-[1600px] pt-2 sm:pt-8 md:pt-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-3 hidden items-center gap-2 text-[13px] font-medium text-muted-foreground sm:mb-6 sm:flex"
        >
          <span className="transition-colors">Apps</span>
          <span aria-hidden>/</span>
          <span className="text-foreground">AI Color Grading</span>
        </nav>

        <h1 className="font-display text-[clamp(1.35rem,5.5vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground [text-wrap:balance]">
          AI Color <span className="bg-gradient-to-b from-volt to-volt/60 bg-clip-text text-transparent">Grading</span>
        </h1>
        <p className="mt-3 hidden max-w-2xl text-[14px] font-medium leading-relaxed text-muted-foreground sm:block sm:text-[15px]">
          Drop your stills, dial in the look with live controls, and export a cinematic grade. Every change previews
          instantly — nothing is uploaded until you generate.
        </p>

        {/* The shared parent owns the workspace height; every column stretches to it. */}
        <div
          className="mt-2 grid w-full min-w-0 grid-cols-1 items-start gap-2 sm:mt-6 sm:gap-4 lg:h-[var(--cg-workspace-h)] lg:min-h-[var(--cg-workspace-min-h)] lg:max-h-[900px] lg:items-stretch lg:grid-cols-[120px_minmax(0,1fr)_320px] xl:grid-cols-[140px_minmax(0,1fr)_340px]"
          style={
            {
              "--cg-workspace-h": "clamp(560px, calc(100dvh - 220px), 900px)",
              "--cg-workspace-min-h": "min(720px, calc(100dvh - 150px))",
            } as CSSProperties
          }
        >
          {/* Left rail — uploaded images plus the compact add button.
              Always visible so the add entry point is present even before
              the first upload, on both desktop and mobile. */}
          <aside
            aria-label="Uploaded images"
            className="order-1 flex h-[96px] min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl p-2 sm:h-[112px] sm:p-3 lg:order-none lg:h-full"
            style={{ background: "var(--tile)" }}
          >
            <h2 className="button-meta mb-2 hidden px-1 text-muted-foreground lg:block">Images</h2>
            <div className="min-w-0 lg:hidden">{tray("horizontal")}</div>
            <div className="hidden min-h-0 flex-1 lg:flex lg:flex-col">{tray("vertical")}</div>
          </aside>

          {/* Center workspace — preview / comparison only */}
          <div
            className="glass order-2 flex min-h-0 min-w-0 flex-col rounded-2xl p-2 sm:p-4 lg:order-none lg:h-full"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div
              ref={dropRef}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className="relative flex h-[40dvh] w-full min-w-0 items-center justify-center overflow-hidden rounded-xl sm:h-auto sm:min-h-[320px] lg:flex-1 lg:min-h-0"
              style={{
                // Identical shell for empty and loaded states — only the inner
                // content changes, so uploading never shifts the layout.
                background: dragOver ? "var(--volt-dim)" : "var(--tile)",
                border: `1.5px dashed ${dragOver ? "var(--volt)" : "var(--card-border)"}`,
              }}
            >
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  acceptFiles(e.target.files);
                  e.target.value = "";
                }}
              />

              {!active && (
                <>
                  {/* Mobile — compact content inside the same-sized block */}
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden px-4 py-3 text-center sm:hidden">
                    <img
                      src={demoImage}
                      alt="Example of a graded frame"
                      draggable={false}
                      className="max-h-[42%] w-auto max-w-[180px] rounded-lg object-contain"
                    />
                    <h2 className="font-display text-[14px] font-extrabold uppercase tracking-[-0.01em] text-foreground">
                      Color Grading
                    </h2>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="button-cta flex h-9 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ImagePlus size={16} strokeWidth={2} />
                      Upload media
                    </button>
                    <p className="text-[10px] font-medium text-muted-foreground/75">
                      {ACCEPTED_LABEL} · up to {MAX_IMAGES} files
                    </p>
                  </div>
                  {/* Desktop — centered card */}
                  <div className="hidden w-full max-w-[300px] flex-col items-center justify-center px-4 py-8 text-center sm:flex">
                    <img
                      src={demoImage}
                      alt="Example of a graded frame"
                      draggable={false}
                      className="h-[132px] w-full rounded-xl object-cover"
                    />
                    <h2 className="font-display mt-4 text-[17px] font-extrabold uppercase tracking-[-0.01em] text-foreground">
                      Color Grading
                    </h2>
                    <p className="mx-auto mt-2 max-w-[240px] text-[13px] font-medium leading-relaxed text-muted-foreground">
                      Upgraded tools, effortless control and cinematic looks — upload, tweak, done.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="button-cta mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ImagePlus size={16} strokeWidth={2} />
                      Upload media
                    </button>
                    <p className="mt-2 text-[11px] font-medium text-muted-foreground/75">
                      {ACCEPTED_LABEL} · up to {MAX_IMAGES} files
                    </p>
                  </div>
                </>
              )}

              {active && st && showOriginal && (
                <ImageStage ratio={ratio} maxHeight="100%">
                  <img
                    src={active.url}
                    alt="Original image"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-contain object-center"
                  />
                </ImageStage>
              )}

              {active && st && !showOriginal && !comparing && (
                <ImageStage ratio={ratio} maxHeight="100%">
                  <GradedImage
                    src={aiUrl ?? active.url}
                    alt={active.file.name}
                    adjustments={aiUrl ? NEUTRAL : effective}
                    className="absolute inset-0 h-full w-full"
                    imgClassName="h-full w-full object-contain object-center"
                  />
                </ImageStage>
              )}

              {active && st && comparing && (
                <BeforeAfter
                  label="Compare original and graded image"
                  ratio={ratio}
                  maxHeight="100%"
                  position={st.comparePos}
                  onPositionChange={(pos) => activeId && patchState(activeId, (s) => ({ ...s, comparePos: pos }))}
                  before={
                    <img
                      src={active.url}
                      alt="Original"
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-contain object-center"
                    />
                  }
                  after={
                    aiUrl ? (
                      <img
                        src={aiUrl}
                        alt="Graded result"
                        draggable={false}
                        className="absolute inset-0 h-full w-full object-contain object-center"
                      />
                    ) : (
                      <GradedImage
                        src={active.url}
                        alt="Local preview"
                        adjustments={effective}
                        className="absolute inset-0 h-full w-full"
                        imgClassName="h-full w-full object-contain object-center"
                      />
                    )
                  }
                />
              )}

              {busy && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 px-6 text-center backdrop-blur-sm">
                  <Loader2 size={26} strokeWidth={2} className="animate-spin text-volt" />
                  <p className="text-[14px] font-semibold text-foreground">Applying your grade…</p>
                  <p className="text-[13px] font-medium text-muted-foreground">
                    Rendering tone, colour and grain. This takes a moment.
                  </p>
                </div>
              )}
            </div>

            {active && st && (
              <div className="mt-2 flex w-full min-w-0 flex-row items-center gap-2 sm:mt-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
                {/* Left — Compare switch (view-only, never calls the API) */}
                <div className="order-2 flex shrink-0 justify-center sm:order-none sm:w-auto sm:justify-start">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={comparing}
                    disabled={!canCompare}
                    onClick={toggleCompare}
                    className="flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-semibold transition-colors disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:gap-2 sm:px-3 sm:text-[13px]"
                    style={{
                      borderColor: comparing ? "var(--volt)" : "var(--card-border)",
                      background: comparing ? "var(--volt-dim)" : "var(--tile)",
                      color: comparing ? "var(--volt)" : undefined,
                    }}
                  >
                    <Columns2 size={15} strokeWidth={2} />
                    Compare
                    <span
                      aria-hidden
                      className="relative ml-0.5 hidden h-5 w-9 shrink-0 items-center rounded-full transition-colors sm:ml-1 sm:inline-flex"
                      style={{
                        background: comparing ? "var(--volt)" : "var(--card-border)",
                      }}
                    >
                      <span
                        className="absolute h-4 w-4 rounded-full bg-background transition-transform"
                        style={{ transform: `translateX(${comparing ? 18 : 2}px)` }}
                      />
                    </span>
                  </button>
                </div>

                {/* Center — Original / Edited / AI history switches */}
                <div className="scrollbar-hide order-1 flex min-w-0 flex-1 items-end justify-start gap-2 overflow-x-auto px-1 sm:order-none sm:flex-none sm:justify-center sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setView("original")}
                    aria-pressed={showOriginal}
                    className="flex shrink-0 flex-col items-center gap-1 focus-visible:outline-none"
                  >
                    <span
                      className="block h-10 w-10 overflow-hidden rounded-lg border-2 transition-colors sm:h-14 sm:w-14"
                      style={{ borderColor: showOriginal ? "var(--volt)" : "var(--card-border)" }}
                    >
                      <img src={active.url} alt="Original" draggable={false} className="h-full w-full object-cover" />
                    </span>
                    <span
                      className="text-[10px] font-semibold sm:text-[11px]"
                      style={{ color: showOriginal ? "var(--volt)" : undefined }}
                    >
                      Original
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!canCompare}
                    onClick={() => selectVersion(-1)}
                    aria-pressed={!showOriginal && st.resultIndex === -1}
                    className="flex shrink-0 flex-col items-center gap-1 disabled:opacity-45 focus-visible:outline-none"
                  >
                    <span
                      className="block h-10 w-10 overflow-hidden rounded-lg border-2 transition-colors sm:h-14 sm:w-14"
                      style={{
                        borderColor:
                          !showOriginal && st.resultIndex === -1 && canCompare ? "var(--volt)" : "var(--card-border)",
                      }}
                    >
                      <GradedImage
                        src={active.url}
                        alt="Edited"
                        adjustments={effective}
                        className="h-full w-full"
                        imgClassName="h-full w-full object-cover"
                      />
                    </span>
                    <span
                      className="text-[10px] font-semibold sm:text-[11px]"
                      style={{
                        color: !showOriginal && st.resultIndex === -1 && canCompare ? "var(--volt)" : undefined,
                      }}
                    >
                      Edited
                    </span>
                  </button>

                  {/* AI history — every successful result of this session */}
                  {results.map((url, i) => {
                    const picked = !showOriginal && st.resultIndex === i;
                    return (
                      <button
                        key={url}
                        type="button"
                        onClick={() => selectVersion(i)}
                        aria-pressed={picked}
                        className="flex shrink-0 flex-col items-center gap-1 focus-visible:outline-none"
                      >
                        <span
                          className="block h-10 w-10 overflow-hidden rounded-lg border-2 transition-colors sm:h-14 sm:w-14"
                          style={{ borderColor: picked ? "var(--volt)" : "var(--card-border)" }}
                        >
                          <img
                            src={url}
                            alt={`AI result ${i + 1}`}
                            draggable={false}
                            className="h-full w-full object-cover"
                          />
                        </span>
                        <span
                          className="text-[10px] font-semibold sm:text-[11px]"
                          style={{ color: picked ? "var(--volt)" : undefined }}
                        >
                          AI {i + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <span className="hidden sm:block" />
              </div>
            )}
          </div>

          {/* Controls — desktop right rail, mobile compact collapsible panel */}
          {isDesktop ? (
            <aside
              className="glass order-3 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl lg:order-none lg:h-full"
              style={{
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
                {promptBlockNode(true)}
                {presetsNode}
                {adjustmentsNode(true)}
              </div>
              <div
                className="shrink-0 space-y-3 border-t px-4 py-3 sm:px-5"
                style={{ borderColor: "var(--card-border)", background: "var(--tile)" }}
              >
                {errorBlock}
                {resultActions}
              </div>
            </aside>
          ) : (
            <>
              {/* Mobile first screen — presets strip and the compact AI prompt row */}
              <div className="order-3 min-w-0">
                <MobilePresetStrip activeId={st.presetId} custom={custom} onPick={pickPreset} />
              </div>

              <div className="order-4 min-w-0">
                <MobileControlPanel
                  open={panelOpen}
                  onToggle={() => setPanelOpen((v) => !v)}
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={resetAll}
                        disabled={!active}
                        className="button-utility flex h-10 min-w-0 shrink items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <RotateCcw size={15} strokeWidth={2} />
                        <span className="truncate">Reset</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void download()}
                        disabled={!hasResult}
                        className="button-cta flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Download size={15} strokeWidth={2} />
                        <span className="truncate">Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void generate(activeId, st?.lastRequest)}
                        disabled={!active || busy || !st?.lastRequest}
                        aria-label="Generate again"
                        title="Generate again"
                        className="button-utility flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <RefreshCw size={15} strokeWidth={2} />
                      </button>
                    </>
                  }
                >
                  {promptBlockNode(true)}
                  {adjustmentsNode(true)}
                  {errorBlock}
                </MobileControlPanel>
              </div>
            </>
          )}
        </div>
      </section>

      <ThreeSteps />
      <SeeItInAction />
      <BuiltForCinematicLooks onCTA={() => dropRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />
      <ExploreMoreApps />
    </div>
  );
}
