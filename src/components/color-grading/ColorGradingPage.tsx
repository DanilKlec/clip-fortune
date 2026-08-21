import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Columns2,
  Download,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  UploadCloud,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { GradedImage } from "./GradedImage";
import { BeforeAfter } from "./BeforeAfter";
import { ImageStage, useImageAspect } from "./ImageStage";
import { ImageTray } from "./ImageTray";
import { AdjustmentPanel } from "./AdjustmentPanel";
import { PresetPicker } from "./PresetPicker";
import { MobilePresetStrip } from "./MobilePresetStrip";
import { MobileControlPanel } from "./MobileControlPanel";
import { GenerateAction } from "./GenerateAction";
import { CollapsibleSection } from "./CollapsibleSection";
import { GradingHistory } from "./GradingHistory";
import { useGradingHistory, type HistoryItem } from "./history-store";
import { gradeFileName, uniqueGradeName } from "./grade-name";
import {
  ACCEPTED_LABEL,
  MAX_IMAGES,
  createImageState,
  useImageLibrary,
  validateFiles,
  type GradingMode,
  type ImageState,
} from "./useImageLibrary";
import { generateColorGrade, renderManualGrade } from "./adapter";
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
    addResult,
  } = useImageLibrary();

  const history = useGradingHistory();

  const [dragOver, setDragOver] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(true);
  // Mobile-only collapsible controls card; closed by default.
  const [panelOpen, setPanelOpen] = useState(false);
  // Sections start collapsed — sliders appear only when a section is expanded.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ color: false });
  const [activeGroup, setActiveGroup] = useState("color");

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
  const mode = st.mode;

  const ratio = useImageAspect(active?.url);
  const effective = effectiveAdjustments(st.adjustments, st.enabled);
  /** Session history of AI results for the active image. */
  const results = activeState?.results ?? [];
  const resultNames = activeState?.resultNames ?? [];
  /** Selected AI version, or null when the live manual grade is shown. */
  const aiUrl = activeState && st.resultIndex >= 0 ? (results[st.resultIndex] ?? null) : null;
  const aiName =
    activeState && st.resultIndex >= 0 ? (resultNames[st.resultIndex] ?? "AI Color Grade") : null;
  const canCompare = Boolean(aiUrl) || !isNeutral(effective);
  const showOriginal = st.view === "original";
  const comparing = st.compare && canCompare && !showOriginal;

  /** Mode is remembered per image; switching never resets anything. */
  const setMode = (next: GradingMode) => {
    if (!activeId) {
      setDraft((s) => ({ ...s, mode: next }));
      return;
    }
    patchState(activeId, (s) => ({ ...s, mode: next }));
  };

  /** View-only switches: they never touch the grade, result or the AI API. */
  const setView = (view: "original" | "edited") => {
    if (!activeId) return;
    patchState(activeId, (s) => ({ ...s, view }));
  };
  const toggleCompare = () => {
    if (!activeId) return;
    patchState(activeId, (s) => ({ ...s, compare: !s.compare, view: "edited" }));
  };
  /** Pick a version to preview: -1 is the live manual grade, else an AI result. */
  const selectVersion = (index: number) => {
    if (!activeId) return;
    patchState(activeId, (s) => ({ ...s, resultIndex: index, view: "edited" }));
  };

  /**
   * Manual edit — presets, sliders and switches. It only changes the local
   * live preview: no AI request, no prompt change, no AI history change.
   */
  const editManual = (patch: (s: ImageState) => Partial<ImageState>) => {
    if (!activeId) {
      setDraft((s) => ({ ...s, ...patch(s) }));
      return;
    }
    patchState(activeId, (s) => ({ ...s, ...patch(s), resultIndex: -1, view: "edited" }));
  };

  /** AI prompt edit — never touches manual adjustments. */
  const setPrompt = (prompt: string) => {
    if (!activeId) {
      setDraft((s) => ({ ...s, prompt }));
      return;
    }
    patchState(activeId, (s) => ({ ...s, prompt, error: null }));
  };

  const acceptFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const { accepted: ok, errors } = validateFiles(
      Array.from(list),
      images.map((i) => i.file),
    );
    errors.forEach((m) => toast.error(m));
    if (ok.length === 0) return;
    add(
      ok,
      images.length === 0
        ? {
            prompt: draft.prompt,
            presetId: draft.presetId,
            adjustments: { ...draft.adjustments },
            enabled: { ...draft.enabled },
            mode: draft.mode,
          }
        : undefined,
    );
  };

  /**
   * Replacement uses the very same validation. A rejected file leaves the
   * previously loaded image untouched.
   */
  const replaceFile = (id: string, file: File) => {
    const { accepted, errors } = validateFiles(
      [file],
      images.filter((i) => i.id !== id).map((i) => i.file),
      { room: 1 },
    );
    errors.forEach((m) => toast.error(m));
    if (accepted.length === 0) return;
    replace(id, accepted[0]);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    acceptFiles(e.dataTransfer.files);
  };

  const updateAdjustment = (key: AdjustmentKey, value: number) => {
    editManual((s) => {
      const adjustments = { ...s.adjustments, [key]: value };
      const match = PRESETS.find((p) => sameValues(p.values, adjustments));
      return { adjustments, presetId: match?.id ?? null };
    });
  };

  const toggleEffect = (key: AdjustmentKey, on: boolean) => {
    editManual((s) => ({ enabled: { ...s.enabled, [key]: on } }));
  };

  const resetKey = (key: AdjustmentKey) => updateAdjustment(key, NEUTRAL[key]);

  const resetAll = () => {
    editManual(() => ({
      adjustments: { ...NEUTRAL },
      enabled: { ...DEFAULT_ENABLED },
      presetId: PRESETS[0].id,
    }));
  };

  const pickPreset = (preset: Preset) => {
    editManual(() => ({ adjustments: { ...preset.values }, presetId: preset.id }));
  };

  /** AI generation — original files plus the prompt, nothing else. */
  const generate = async (id: string | null, promptOverride?: string) => {
    if (!id) return;
    const img = images.find((i) => i.id === id);
    const current = statesRef.current[id];
    if (!img || !current || current.status === "generating") return;

    const prompt = promptOverride ?? current.prompt;
    const run = ++runSeq.current;
    patchState(id, (s) => ({
      ...s,
      status: "generating",
      error: null,
      run,
      lastRequest: { prompt },
    }));

    try {
      // The selected image is primary; the others travel as reference frames.
      const ordered = [img.file, ...images.filter((i) => i.id !== id).map((i) => i.file)];
      const res = await generateColorGrade({
        images: ordered.slice(0, MAX_IMAGES),
        prompt,
      });
      // Discard responses that belong to a superseded request or a deleted image.
      if (statesRef.current[id]?.run !== run) {
        if (res.imageUrl.startsWith("blob:")) URL.revokeObjectURL(res.imageUrl);
        return;
      }
      const taken = [
        ...(statesRef.current[id]?.resultNames ?? []),
        ...history.items.map((h) => h.name),
      ];
      const name = uniqueGradeName(prompt, taken);
      addResult(id, res.imageUrl, name);
      patchState(id, (s) =>
        s.run === run
          ? { ...s, status: "success", error: null, comparePos: 50, view: "edited" }
          : s,
      );
      // Persist to the local history right away.
      try {
        const blob = await (await fetch(res.imageUrl)).blob();
        await history.add(
          { name, kind: "ai", sourceName: img.file.name, prompt, blob },
          `ai-${id}-${res.imageUrl}`,
        );
      } catch {
        /* history is best effort */
      }
    } catch (err) {
      if (statesRef.current[id]?.run !== run) return;
      const message = err instanceof Error ? err.message : "Something went wrong while grading";
      patchState(id, (s) => (s.run === run ? { ...s, status: "error", error: message } : s));
    }
  };

  const hasAiResult = Boolean(aiUrl);

  const saveBlob = (blob: Blob, name: string) => {
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = gradeFileName(name);
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  };

  /** Download the selected AI result and remember it in the history. */
  const downloadAi = async () => {
    if (!aiUrl || !active) return;
    try {
      const blob = await (await fetch(aiUrl)).blob();
      const name = aiName ?? "AI Color Grade";
      saveBlob(blob, name);
      await history.add(
        { name, kind: "ai", sourceName: active.file.name, prompt: st.prompt, blob },
        `ai-${activeId}-${aiUrl}`,
      );
    } catch {
      toast.error("Could not download the image");
    }
  };

  /** Download the manual grade rendered locally from the original file. */
  const downloadManual = async () => {
    if (!active) return;
    try {
      const blob = await renderManualGrade(active.file, effective);
      const preset = PRESETS.find((p) => p.id === st.presetId);
      const name = preset ? `${preset.name} Manual` : "Manual Color Grade";
      saveBlob(blob, name);
      await history.add(
        {
          name,
          kind: "manual",
          sourceName: active.file.name,
          presetId: st.presetId,
          adjustments: { ...st.adjustments },
          blob,
        },
        `manual-${activeId}-${JSON.stringify(effective)}`,
      );
    } catch {
      toast.error("Could not render the manual result");
    }
  };

  /** Open a stored result as the active version of the current image. */
  const useHistoryItem = (item: HistoryItem) => {
    if (!activeId) {
      toast("Upload an image to apply a saved result");
      return;
    }
    addResult(activeId, URL.createObjectURL(item.blob), item.name);
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

  const modeSwitch = (
    <div
      role="tablist"
      aria-label="Grading mode"
      className="flex w-full min-w-0 gap-1 rounded-full p-1"
      style={{ background: "var(--tile)" }}
    >
      {[
        { id: "manual" as const, label: "Manual", Icon: SlidersHorizontal },
        { id: "ai" as const, label: "AI", Icon: Sparkles },
      ].map(({ id, label, Icon }) => {
        const on = mode === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setMode(id)}
            className="flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[13px]"
            style={{
              background: on ? "var(--volt-dim)" : "transparent",
              color: on ? "var(--volt)" : undefined,
            }}
          >
            <Icon size={14} strokeWidth={2} />
            {label}
          </button>
        );
      })}
    </div>
  );

  const adjustmentsNode = (
    <AdjustmentPanel
      values={st.adjustments}
      enabled={st.enabled}
      onChange={updateAdjustment}
      onToggle={toggleEffect}
      onResetKey={resetKey}
      onResetAll={resetAll}
      grouped
      hideResetAll
      tabbed={!isDesktop}
      activeGroup={activeGroup}
      onSelectGroup={setActiveGroup}
      openGroups={openGroups}
      onToggleGroup={(gid) => setOpenGroups((prev) => ({ ...prev, [gid]: !prev[gid] }))}
    />
  );

  const presetsNode = (
    <CollapsibleSection
      id="presets"
      label="Presets"
      open={presetsOpen}
      onToggle={() => setPresetsOpen((v) => !v)}
    >
      <PresetPicker activeId={st.presetId} custom={custom} onPick={pickPreset} hideHeading />
    </CollapsibleSection>
  );

  const manualActions = (
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
        onClick={() => void downloadManual()}
        disabled={!active}
        className="button-cta flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Download size={16} strokeWidth={2} />
        Download
      </button>
    </div>
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

  const errorBlock = status === "error" && (
    <div
      className="grid min-w-0 gap-3 rounded-xl border p-3"
      style={{ borderColor: "var(--coral-bdr)", background: "var(--coral-dim)" }}
    >
      <div className="flex min-w-0 items-start gap-2">
        <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-destructive" />
        <p className="min-w-0 flex-1 text-[13px] font-medium text-foreground">
          {st.error ?? "Generation failed"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void generate(activeId, st.lastRequest?.prompt)}
        className="button-utility flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RefreshCw size={15} strokeWidth={2} />
        Retry
      </button>
    </div>
  );

  /** Primary mobile action: always visible, no need to open the settings panel. */
  const mobileCta =
    mode === "manual" ? (
      <button
        type="button"
        onClick={() => void downloadManual()}
        disabled={!active}
        className="button-cta flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Download size={18} strokeWidth={2} />
        Download
      </button>
    ) : (
      <GenerateAction
        mode="ai"
        busy={busy}
        disabled={!active}
        onGenerate={() => void generate(activeId)}
      />
    );

  const aiPanel = (showGenerate: boolean) => (
    <div className="min-w-0 space-y-3">
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
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the color grade you want…"
          rows={3}
          className="mt-3 w-full rounded-xl border text-[16px] placeholder:text-muted-foreground focus-visible:ring-2 sm:text-[15px]"
          style={{ background: "var(--tile)", borderColor: "var(--card-border)" }}
        />
        <p className="mt-2 text-[12px] font-medium text-muted-foreground">
          {!active
            ? "Add an image to unlock AI grading."
            : "The AI works from your original files and this prompt only — manual presets and sliders are not sent."}
        </p>
      </div>
      {showGenerate && generateButton}
      {errorBlock}
      {results.length > 0 && (
        <>
          <div className="grid min-w-0 gap-2">
            <button
              type="button"
              onClick={() => void downloadAi()}
              disabled={!hasAiResult}
              className="button-cta flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download size={16} strokeWidth={2} />
              Download {aiName ?? "result"}
            </button>
            <button
              type="button"
              onClick={() => void generate(activeId, st.lastRequest?.prompt)}
              className="button-utility flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RefreshCw size={16} strokeWidth={2} />
              Generate again
            </button>
          </div>
          <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1">
            {results.map((url, i) => {
              const picked = st.resultIndex === i && !showOriginal;
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => selectVersion(i)}
                  aria-pressed={picked}
                  className="flex w-[74px] shrink-0 flex-col items-center gap-1 focus-visible:outline-none"
                >
                  <span
                    className="block h-14 w-full overflow-hidden rounded-lg border-2 transition-colors"
                    style={{ borderColor: picked ? "var(--volt)" : "var(--card-border)" }}
                  >
                    <img
                      src={url}
                      alt={resultNames[i] ?? `AI result ${i + 1}`}
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span
                    className="w-full truncate text-center text-[10px] font-semibold"
                    title={resultNames[i]}
                    style={{ color: picked ? "var(--volt)" : undefined }}
                  >
                    {resultNames[i] ?? `AI ${i + 1}`}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  const previewCard = (
    <div
      className={`glass order-2 flex min-h-0 min-w-0 flex-col rounded-2xl p-2 sm:p-4 lg:order-none lg:h-full ${
        !isDesktop && mode === "manual" ? "sticky top-[68px] z-20" : ""
      }`}
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
        onClick={active ? undefined : () => fileRef.current?.click()}
        onKeyDown={
          active
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileRef.current?.click();
                }
              }
        }
        role={active ? undefined : "button"}
        tabIndex={active ? undefined : 0}
        aria-label={active ? undefined : "Drop images or click to upload"}
        className={`cg-dropzone relative flex h-[40dvh] w-full min-w-0 items-center justify-center overflow-hidden sm:h-auto sm:min-h-[320px] lg:flex-1 lg:min-h-0 ${
          active ? "" : "cg-dropzone-interactive cursor-pointer"
        } ${dragOver ? "cg-dropzone-active" : ""}`}
        style={{ backgroundColor: "var(--tile)" }}
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
          <div className="flex h-full w-full flex-col items-center justify-center px-4 py-6 text-center sm:px-6 sm:py-10">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "var(--tile)" }}
            >
              <UploadCloud size={24} strokeWidth={1.5} className="text-volt" />
            </div>
            <div className="mt-4 text-[13px] font-medium text-foreground">
              Drop images or click to upload
            </div>
            <div className="font-mono mt-1 text-[11px] font-medium text-muted-foreground">
              {ACCEPTED_LABEL} · up to {MAX_IMAGES} files · max 20MB
            </div>
          </div>
        )}

        {active && showOriginal && (
          <ImageStage ratio={ratio} maxHeight="100%">
            <img
              src={active.url}
              alt="Original image"
              draggable={false}
              className="absolute inset-0 h-full w-full object-contain object-center"
            />
          </ImageStage>
        )}

        {active && !showOriginal && !comparing && (
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

        {active && comparing && (
          <BeforeAfter
            label="Compare original and graded image"
            ratio={ratio}
            maxHeight="100%"
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

      {active && (
        <div className="mt-2 flex w-full min-w-0 flex-wrap items-center justify-between gap-2 sm:mt-3">
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
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setView("original")}
              aria-pressed={showOriginal}
              className="flex h-9 items-center rounded-full border px-3 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:text-[13px]"
              style={{
                borderColor: showOriginal ? "var(--volt)" : "var(--card-border)",
                background: showOriginal ? "var(--volt-dim)" : "var(--tile)",
                color: showOriginal ? "var(--volt)" : undefined,
              }}
            >
              Original
            </button>
            <button
              type="button"
              onClick={() => selectVersion(-1)}
              aria-pressed={!showOriginal && st.resultIndex === -1}
              className="flex h-9 items-center rounded-full border px-3 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:text-[13px]"
              style={{
                borderColor:
                  !showOriginal && st.resultIndex === -1 ? "var(--volt)" : "var(--card-border)",
                background:
                  !showOriginal && st.resultIndex === -1 ? "var(--volt-dim)" : "var(--tile)",
                color: !showOriginal && st.resultIndex === -1 ? "var(--volt)" : undefined,
              }}
            >
              Edited
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <section className="page-shell mx-auto w-full max-w-[1600px] pt-2 sm:pt-8 md:pt-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-3 hidden items-center gap-2 text-[13px] font-medium text-muted-foreground sm:mb-6 sm:flex"
        >
          <a href="#explore-apps" className="transition-colors hover:text-foreground">
            Apps
          </a>
          <span aria-hidden>/</span>
          <span className="text-foreground">AI Color Grading</span>
        </nav>

        {/* One card holds the feature title, its description and the workspace. */}
        <div
          className="glass min-w-0 rounded-2xl p-3 sm:p-5 lg:p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h1 className="font-display text-[clamp(1.35rem,5.5vw,2.75rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-foreground [text-wrap:balance]">
            AI Color{" "}
            <span className="bg-gradient-to-b from-volt to-volt/60 bg-clip-text text-transparent">
              Grading
            </span>
          </h1>
          <p className="mt-3 hidden max-w-2xl text-[14px] font-medium leading-relaxed text-muted-foreground sm:block sm:text-[15px]">
            Drop your stills, dial in the look with live manual controls, or describe a look and let
            the AI grade the original file. Manual and AI stay independent.
          </p>

          {/* The shared parent owns the workspace height; every column stretches to it. */}
          <div
            className="mt-2 grid w-full min-w-0 grid-cols-1 items-start gap-2 sm:mt-6 sm:gap-4 lg:h-[var(--cg-workspace-h)] lg:min-h-[var(--cg-workspace-min-h)] lg:max-h-[900px] lg:items-stretch lg:grid-cols-[120px_minmax(0,1fr)_320px] xl:grid-cols-[140px_minmax(0,1fr)_340px]"
            style={
              {
                "--cg-workspace-h": "clamp(560px, calc(100dvh - 260px), 900px)",
                "--cg-workspace-min-h": "min(720px, calc(100dvh - 180px))",
              } as CSSProperties
            }
          >
            <aside
              aria-label="Uploaded images"
              className="order-1 flex h-[96px] min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl p-2 sm:h-[112px] sm:p-3 lg:order-none lg:h-full"
              style={{ background: "var(--tile)" }}
            >
              <h2 className="button-meta mb-2 hidden px-1 text-muted-foreground lg:block">
                Images
              </h2>
              <div className="min-w-0 lg:hidden">{tray("horizontal")}</div>
              <div className="hidden min-h-0 flex-1 lg:flex lg:flex-col">{tray("vertical")}</div>
            </aside>

            {previewCard}

            {!isDesktop && mode === "manual" && (
              <div className="order-3 min-w-0 lg:hidden">
                <MobilePresetStrip activeId={st.presetId} custom={custom} onPick={pickPreset} />
              </div>
            )}

            {isDesktop ? (
              <aside
                className="glass order-3 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl lg:order-none lg:h-full"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div
                  className="shrink-0 border-b p-3 sm:p-4"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  {modeSwitch}
                </div>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
                  {mode === "manual" ? (
                    <>
                      {presetsNode}
                      {adjustmentsNode}
                    </>
                  ) : (
                    aiPanel(true)
                  )}
                </div>
                {mode === "manual" && (
                  <div
                    className="shrink-0 border-t px-4 py-3 sm:px-5"
                    style={{ borderColor: "var(--card-border)", background: "var(--tile)" }}
                  >
                    {manualActions}
                  </div>
                )}
              </aside>
            ) : (
              <div className="order-4 min-w-0">
                <MobileControlPanel
                  open={panelOpen}
                  onToggle={() => setPanelOpen((v) => !v)}
                  subtitle={mode === "manual" ? "Manual grading" : "AI color grading"}
                  cta={mobileCta}
                  actions={mode === "manual" ? manualActions : undefined}
                >
                  {modeSwitch}
                  {mode === "manual" ? (
                    <div className="min-w-0 space-y-3">{adjustmentsNode}</div>
                  ) : (
                    <div className="min-w-0">{aiPanel(false)}</div>
                  )}
                </MobileControlPanel>
              </div>
            )}
          </div>

          <GradingHistory
            items={history.items}
            onUse={useHistoryItem}
            onDownload={(item) => saveBlob(item.blob, item.name)}
            onRemove={(id) => void history.remove(id)}
            onClear={() => void history.clear()}
          />
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
