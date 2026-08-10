import { useEffect, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronDown,
  Columns2,
  Download,
  ImagePlus,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { GradedImage } from "./GradedImage";
import { BeforeAfter } from "./BeforeAfter";
import { ImageStage, useImageAspect } from "./ImageStage";
import { ImageTray } from "./ImageTray";
import { AdjustmentPanel } from "./AdjustmentPanel";
import { PresetPicker } from "./PresetPicker";
import { MobileControlPanel } from "./MobileControlPanel";
import {
  ACCEPTED_LABEL,
  MAX_BYTES,
  MAX_IMAGES,
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

export function ColorGradingPage() {
  const {
    images,
    active,
    activeId,
    activeState,
    states,
    setActiveId,
    add,
    remove,
    replace,
    patchState,
    setResult,
  } = useImageLibrary();

  const [dragOver, setDragOver] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ color: true });

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

  const st: ImageState | null = activeState;
  const status = st?.status ?? "ready";
  const busy = status === "generating";
  const custom = st ? !allEnabled(st.enabled) : false;

  const ratio = useImageAspect(active?.url);
  const effective = st ? effectiveAdjustments(st.adjustments, st.enabled) : NEUTRAL;
  /** Priority: AI result for this image, else the live local grade, else none. */
  const aiUrl = st && st.status === "success" ? st.resultUrl : null;
  const canCompare = Boolean(aiUrl) || !isNeutral(effective);
  const showOriginal = st?.view === "original";
  const compareOn = st?.compare ?? false;
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

  /** Any input change invalidates the current result for the active image only. */
  const editActive = (patch: (s: ImageState) => Partial<ImageState>) => {
    if (!activeId) return;
    const id = activeId;
    const run = ++runSeq.current;
    setResult(id, null);
    patchState(id, (s) => ({
      ...s,
      ...patch(s),
      run,
      error: null,
      status: "ready",
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
    if (ok.length > 0) add(ok);
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
    setResult(id, null);
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
      setResult(id, res.imageUrl);
      patchState(id, (s) =>
        s.run === run ? { ...s, status: "success", error: null, comparePos: 50 } : s,
      );
    } catch (err) {
      if (statesRef.current[id]?.run !== run) return;
      setResult(id, null);
      const message = err instanceof Error ? err.message : "Something went wrong while grading";
      patchState(id, (s) => (s.run === run ? { ...s, status: "error", error: message } : s));
    }
  };

  const download = async () => {
    const url = st?.resultUrl;
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
      values={st?.adjustments ?? NEUTRAL}
      enabled={st?.enabled ?? DEFAULT_ENABLED}
      disabled={!active}
      onChange={updateAdjustment}
      onToggle={toggleEffect}
      onResetKey={resetKey}
      onResetAll={resetAll}
      grouped={grouped}
      hideResetAll={grouped}
      openGroups={openGroups}
      onToggleGroup={(gid) =>
        setOpenGroups((prev) => ({ ...prev, [gid]: !(prev[gid] ?? gid === "color") }))
      }
    />
  );

  const generateButton = (
    <button
      type="button"
      disabled={!active || busy}
      onClick={() => void generate(activeId)}
      className="button-cta flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-45"
    >
      {busy ? (
        <Loader2 size={18} strokeWidth={2} className="animate-spin" />
      ) : (
        <Sparkles size={18} strokeWidth={2} />
      )}
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
        value={st?.prompt ?? ""}
        disabled={!active}
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
    <PresetPicker activeId={st?.presetId ?? null} custom={custom} onPick={pickPreset} />
  );

  const resultActions = status === "success" && (
    <div className="grid min-w-0 gap-2">
      <button
        type="button"
        onClick={() => void download()}
        className="button-cta flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Download size={16} strokeWidth={2} />
        Download
      </button>
      <button
        type="button"
        onClick={() => void generate(activeId, st?.lastRequest)}
        className="button-utility flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RefreshCw size={16} strokeWidth={2} />
        Generate again
      </button>
    </div>
  );

  const errorBlock = status === "error" && (
    <div
      className="grid min-w-0 gap-3 rounded-xl border p-3"
      style={{ borderColor: "var(--coral-bdr)", background: "var(--coral-dim)" }}
    >
      <div className="flex min-w-0 items-start gap-2">
        <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-destructive" />
        <p className="min-w-0 flex-1 text-[13px] font-medium text-foreground">
          {st?.error ?? "Generation failed"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void generate(activeId, st?.lastRequest)}
        className="button-utility flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RefreshCw size={15} strokeWidth={2} />
        Retry
      </button>
    </div>
  );

  return (
    <div className="w-full">
      <section className="page-shell mx-auto w-full max-w-[1600px] pt-6 sm:pt-8 md:pt-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-[13px] font-medium text-muted-foreground sm:mb-6"
        >
          <span className="transition-colors">Apps</span>
          <span aria-hidden>/</span>
          <span className="text-foreground">AI Color Grading</span>
        </nav>

        <h1 className="font-display text-[clamp(1.75rem,6vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground [text-wrap:balance]">
          AI Color{" "}
          <span className="bg-gradient-to-b from-volt to-volt/60 bg-clip-text text-transparent">
            Grading
          </span>
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] font-medium leading-relaxed text-muted-foreground sm:text-[15px]">
          Drop your stills, dial in the look with live controls, and export a cinematic grade. Every
          change previews instantly — nothing is uploaded until you generate.
        </p>

        <div
          className={`mt-6 grid w-full min-w-0 grid-cols-1 items-start gap-4 ${
            images.length > 0
              ? "lg:grid-cols-[120px_minmax(0,1fr)_320px] xl:grid-cols-[140px_minmax(0,1fr)_340px]"
              : "lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]"
          }`}
        >
          {/* Left rail — uploaded images only (hidden until something is uploaded) */}
          {images.length > 0 && (
            <aside
              aria-label="Uploaded images"
              className="order-1 flex min-h-0 min-w-0 flex-col rounded-2xl p-2 sm:p-3 lg:order-none"
              style={{ background: "var(--tile)" }}
            >
              <h2 className="button-meta mb-2 hidden px-1 text-muted-foreground lg:block">
                Images
              </h2>
              <div className="min-w-0 lg:hidden">{tray("horizontal")}</div>
              <div className="hidden min-h-0 flex-1 lg:flex lg:flex-col">{tray("vertical")}</div>
            </aside>
          )}

          {/* Center workspace — preview / comparison only */}
          <div
            className="glass order-2 flex min-w-0 flex-col rounded-2xl p-3 sm:p-4 lg:order-none"
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
              className="relative flex min-h-[240px] w-full min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl sm:min-h-[320px] lg:min-h-[380px] lg:max-h-[760px]"
              style={{
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
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 py-10 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: "var(--tile)" }}
                  >
                    <ImagePlus size={22} strokeWidth={1.5} className="text-volt" />
                  </span>
                  <span className="text-[15px] font-medium text-foreground">
                    Drop images to start grading
                  </span>
                  <span className="text-[13px] font-medium text-muted-foreground">
                    Upload from device · {ACCEPTED_LABEL} · multiple files
                  </span>
                </button>
              )}

              {active && st && showOriginal && (
                <ImageStage ratio={ratio} maxHeight="min(72vh, 740px)">
                  <img
                    src={active.url}
                    alt="Original image"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-contain object-center"
                  />
                </ImageStage>
              )}

              {active && st && !showOriginal && !comparing && (
                <ImageStage ratio={ratio} maxHeight="min(72vh, 740px)">
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
                  maxHeight="min(72vh, 740px)"
                  position={st.comparePos}
                  onPositionChange={(pos) =>
                    activeId && patchState(activeId, (s) => ({ ...s, comparePos: pos }))
                  }
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
              <div className="mt-3 flex w-full min-w-0 flex-col items-center gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                {/* Left — Compare switch (view-only, never calls the API) */}
                <div className="order-2 flex w-full justify-center sm:order-none sm:w-auto sm:justify-start">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={comparing}
                    disabled={!canCompare}
                    onClick={toggleCompare}
                    className="flex h-10 items-center gap-2 rounded-full border px-3 text-[13px] font-semibold transition-colors disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="relative ml-1 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
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

                {/* Center — Original / Edited preview switches */}
                <div className="order-1 flex items-end justify-center gap-3 sm:order-none">
                  <button
                    type="button"
                    onClick={() => setView("original")}
                    aria-pressed={showOriginal}
                    className="flex flex-col items-center gap-1 focus-visible:outline-none"
                  >
                    <span
                      className="block h-12 w-12 overflow-hidden rounded-lg border-2 transition-colors sm:h-14 sm:w-14"
                      style={{ borderColor: showOriginal ? "var(--volt)" : "var(--card-border)" }}
                    >
                      <img
                        src={active.url}
                        alt="Original"
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: showOriginal ? "var(--volt)" : undefined }}
                    >
                      Original
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!canCompare}
                    onClick={() => setView("edited")}
                    aria-pressed={!showOriginal}
                    className="flex flex-col items-center gap-1 disabled:opacity-45 focus-visible:outline-none"
                  >
                    <span
                      className="block h-12 w-12 overflow-hidden rounded-lg border-2 transition-colors sm:h-14 sm:w-14"
                      style={{
                        borderColor:
                          !showOriginal && canCompare ? "var(--volt)" : "var(--card-border)",
                      }}
                    >
                      {aiUrl ? (
                        <img
                          src={aiUrl}
                          alt="Edited"
                          draggable={false}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <GradedImage
                          src={active.url}
                          alt="Edited"
                          adjustments={effective}
                          className="h-full w-full"
                          imgClassName="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span
                      className="text-[11px] font-semibold"
                      style={{
                        color: !showOriginal && canCompare ? "var(--volt)" : undefined,
                      }}
                    >
                      Edited
                    </span>
                  </button>
                </div>

                <span className="hidden sm:block" />
              </div>
            )}
          </div>

          {/* Controls — desktop right rail, mobile compact collapsible panel */}
          {isDesktop ? (
            <aside
              className="glass order-3 min-w-0 space-y-5 overflow-x-hidden rounded-2xl p-4 sm:p-5 lg:order-none lg:max-h-[min(82vh,820px)] lg:overflow-y-auto"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {promptBlockNode(true)}
              {presetsNode}
              {adjustmentsNode(false)}
              {resultActions}
              {errorBlock}
            </aside>
          ) : (
            <div className="order-3 min-w-0">
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
                      disabled={status !== "success"}
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
                <div
                  className="min-w-0 overflow-hidden rounded-xl border"
                  style={{ borderColor: "var(--card-border)", background: "var(--tile)" }}
                >
                  <button
                    type="button"
                    onClick={() => setPresetsOpen((v) => !v)}
                    aria-expanded={presetsOpen}
                    aria-controls="cg-mobile-presets"
                    className="flex h-11 w-full items-center justify-between gap-2 px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="font-display truncate text-[12px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                      Presets
                    </span>
                    <ChevronDown
                      size={15}
                      strokeWidth={2}
                      aria-hidden
                      className={`shrink-0 text-muted-foreground transition-transform ${presetsOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {presetsOpen && (
                    <div id="cg-mobile-presets" className="px-2 pb-2">
                      <PresetPicker
                        activeId={st?.presetId ?? null}
                        custom={custom}
                        onPick={pickPreset}
                        hideHeading
                      />
                    </div>
                  )}
                </div>
                {adjustmentsNode(true)}
                {errorBlock}
              </MobileControlPanel>
            </div>
          )}
        </div>
      </section>

      <ThreeSteps />
      <SeeItInAction />
      <BuiltForCinematicLooks
        onCTA={() => dropRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />
      <ExploreMoreApps />
    </div>
  );
}
