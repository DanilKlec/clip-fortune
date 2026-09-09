import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { toast } from "sonner";
import { GradedImage } from "./GradedImage";
import { BeforeAfter } from "./BeforeAfter";
import { ImageStage, useImageAspect } from "./ImageStage";
import { WorkRail } from "./WorkRail";
import { ControlsPanel, type PanelTab } from "./ControlsPanel";
import { ValueEditor } from "./ValueEditor";
import { GradingHistory } from "./GradingHistory";
import { useGradingHistory, type HistoryItem } from "./history-store";
import { gradeFileName, promptFileName, uniqueGradeName } from "./grade-name";
import {
  ACCEPTED_LABEL,
  MAX_IMAGES,
  createImageState,
  useImageLibrary,
  validateFiles,
  type ImageState,
} from "./useImageLibrary";
import { generateColorGrade, renderManualGrade } from "./adapter";
import {
  DEFAULT_ENABLED,
  NEUTRAL,
  PRESETS,
  effectiveAdjustments,
  isNeutral,
  sameValues,
  type AdjustmentKey,
  type Adjustments,
  type EffectToggles,
  type Preset,
} from "./grading";
import { ThreeSteps } from "./sections/ThreeSteps";
import { SeeItInAction } from "./sections/SeeItInAction";
import { BuiltForCinematicLooks } from "./sections/BuiltForCinematicLooks";
import { ExploreMoreApps } from "@/components/virality/landing/ExploreMoreApps";
import "./work.css";

interface Snapshot {
  adjustments: Adjustments;
  enabled: EffectToggles;
  presetId: string | null;
}

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
  const [tab, setTab] = useState<PanelTab>("prompt");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    bloom: true,
    halation: true,
    haze: true,
    grain: true,
  });
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<AdjustmentKey | null>(null);
  const editorBackup = useRef<{ value: number; enabled: boolean } | null>(null);

  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const runSeq = useRef(0);
  const statesRef = useRef(states);
  useEffect(() => {
    statesRef.current = states;
  }, [states]);

  /** Without an image nothing is selectable — no preset, no active category. */
  useEffect(() => {
    if (images.length === 0) setActiveGroup(null);
  }, [images.length]);



  /** Settings are editable before any upload; they carry over to the first image. */
  const [draft, setDraft] = useState<ImageState>(() => createImageState());
  const st: ImageState = activeState ?? draft;
  const status = activeState ? activeState.status : "ready";
  const busy = status === "generating";

  const effective = effectiveAdjustments(st.adjustments, st.enabled);
  const results = activeState?.results ?? [];
  const resultNames = activeState?.resultNames ?? [];
  const aiUrl = activeState && st.resultIndex >= 0 ? (results[st.resultIndex] ?? null) : null;
  const aiName =
    activeState && st.resultIndex >= 0 ? (resultNames[st.resultIndex] ?? "AI Color Grade") : null;
  const canCompare = Boolean(aiUrl) || !isNeutral(effective);
  const showOriginal = st.view === "original";
  const comparing = st.compare && canCompare && !showOriginal;
  /**
   * The stage follows the image actually on screen; every layer uses
   * object-contain inside it, so nothing is ever cropped or upscaled.
   */
  const displaySrc = active ? (showOriginal ? active.url : (aiUrl ?? active.url)) : null;
  const ratio = useImageAspect(displaySrc);

  /* ------------------------------------------------------------------ */
  /* undo / redo                                                         */
  /* ------------------------------------------------------------------ */
  const histKey = activeId ?? "draft";
  const stacks = useRef<Record<string, { past: Snapshot[]; future: Snapshot[] }>>({});
  const [, bumpHist] = useState(0);
  const batching = useRef(false);
  const stack = () => (stacks.current[histKey] ??= { past: [], future: [] });
  const snapOf = (s: ImageState): Snapshot => ({
    adjustments: { ...s.adjustments },
    enabled: { ...s.enabled },
    presetId: s.presetId,
  });

  const applyPatch = (patch: (s: ImageState) => Partial<ImageState>) => {
    if (!activeId) {
      setDraft((s) => ({ ...s, ...patch(s) }));
      return;
    }
    patchState(activeId, (s) => ({ ...s, ...patch(s), resultIndex: -1, view: "edited" }));
  };

  /** Manual edit — local preview only: no AI request, no prompt change. */
  const editManual = (patch: (s: ImageState) => Partial<ImageState>) => {
    if (!batching.current) {
      const s = stack();
      s.past.push(snapOf(st));
      if (s.past.length > 60) s.past.shift();
      s.future = [];
      bumpHist((n) => n + 1);
    }
    applyPatch(patch);
  };

  const beginDrag = () => {
    const s = stack();
    s.past.push(snapOf(st));
    s.future = [];
    batching.current = true;
    bumpHist((n) => n + 1);
  };
  const endDrag = () => {
    batching.current = false;
  };

  const restore = (snap: Snapshot) =>
    applyPatch(() => ({
      adjustments: { ...snap.adjustments },
      enabled: { ...snap.enabled },
      presetId: snap.presetId,
    }));

  const undo = () => {
    const s = stack();
    const prev = s.past.pop();
    if (!prev) return;
    s.future.push(snapOf(st));
    restore(prev);
    bumpHist((n) => n + 1);
  };
  const redo = () => {
    const s = stack();
    const next = s.future.pop();
    if (!next) return;
    s.past.push(snapOf(st));
    restore(next);
    bumpHist((n) => n + 1);
  };
  const canUndo = (stacks.current[histKey]?.past.length ?? 0) > 0;
  const canRedo = (stacks.current[histKey]?.future.length ?? 0) > 0;

  /* ------------------------------------------------------------------ */
  /* view state                                                          */
  /* ------------------------------------------------------------------ */
  const setView = (view: "original" | "edited") => {
    if (!activeId) return;
    patchState(activeId, (s) => ({ ...s, view }));
  };
  const toggleCompare = () => {
    if (!activeId) return;
    patchState(activeId, (s) => ({ ...s, compare: !s.compare, view: "edited" }));
  };
  const selectVersion = (index: number) => {
    if (!activeId) return;
    patchState(activeId, (s) => ({ ...s, resultIndex: index, view: "edited" }));
  };

  /** AI prompt edit — never touches manual adjustments. */
  const setPrompt = (prompt: string) => {
    if (!activeId) {
      setDraft((s) => ({ ...s, prompt }));
      return;
    }
    patchState(activeId, (s) => ({ ...s, prompt, error: null }));
  };

  /* ------------------------------------------------------------------ */
  /* files                                                               */
  /* ------------------------------------------------------------------ */
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

  /** Replacement uses the same validation; a rejected file changes nothing. */
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

  /* ------------------------------------------------------------------ */
  /* manual grading                                                      */
  /* ------------------------------------------------------------------ */
  const updateAdjustment = (key: AdjustmentKey, value: number) => {
    editManual((s) => {
      const adjustments = { ...s.adjustments, [key]: value };
      const match = PRESETS.find((p) => sameValues(p.values, adjustments));
      return { adjustments, presetId: match?.id ?? null };
    });
  };
  const toggleEffect = (key: AdjustmentKey, on: boolean) =>
    editManual((s) => ({ enabled: { ...s.enabled, [key]: on } }));
  const resetKey = (key: AdjustmentKey) => updateAdjustment(key, NEUTRAL[key]);
  /** Group reset restores neutral values and re-enables every parameter in it. */
  const resetGroup = (keys: AdjustmentKey[]) =>
    editManual((s) => {
      const adjustments = { ...s.adjustments };
      const nextEnabled = { ...s.enabled };
      keys.forEach((k) => {
        adjustments[k] = NEUTRAL[k];
        nextEnabled[k] = true;
      });
      const match = PRESETS.find((p) => sameValues(p.values, adjustments));
      return { adjustments, enabled: nextEnabled, presetId: match?.id ?? null };
    });
  const resetAll = () =>
    editManual(() => ({
      adjustments: { ...NEUTRAL },
      enabled: { ...DEFAULT_ENABLED },
      presetId: PRESETS[0].id,
    }));
  const pickPreset = (preset: Preset) =>
    editManual(() => ({ adjustments: { ...preset.values }, presetId: preset.id }));

  /* ------------------------------------------------------------------ */
  /* AI generation — original files plus the prompt, nothing else        */
  /* ------------------------------------------------------------------ */
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
      const res = await generateColorGrade({ images: ordered.slice(0, MAX_IMAGES), prompt });
      if (statesRef.current[id]?.run !== run) {
        if (res.imageUrl.startsWith("blob:")) URL.revokeObjectURL(res.imageUrl);
        return;
      }
      const taken = [
        ...(statesRef.current[id]?.resultNames ?? []),
        ...history.items.map((h) => h.name),
      ];
      const name = uniqueGradeName(prompt, taken);
      addResult(id, res.imageUrl, name, prompt);
      patchState(id, (s) =>
        s.run === run
          ? { ...s, status: "success", error: null, comparePos: 50, view: "edited" }
          : s,
      );
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

  /* ------------------------------------------------------------------ */
  /* downloads                                                           */
  /* ------------------------------------------------------------------ */
  const saveBlob = (blob: Blob, fileName: string) => {
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  };

  const downloadAi = async () => {
    if (!active) return;
    try {
      if (showOriginal) {
        saveBlob(active.file, active.file.name);
        return;
      }
      if (!aiUrl) return;
      const blob = await (await fetch(aiUrl)).blob();
      const name = aiName ?? "AI Color Grade";
      // The file name comes from the prompt of THIS generation, not the field.
      const prompt = activeState?.resultPrompts[st.resultIndex] ?? st.prompt;
      saveBlob(blob, promptFileName(prompt, blob));
      await history.add(
        { name, kind: "ai", sourceName: active.file.name, prompt, blob },
        `ai-${activeId}-${aiUrl}`,
      );
    } catch {
      toast.error("Could not download the image");
    }
  };

  const downloadManual = async () => {
    if (!active) return;
    try {
      const blob = await renderManualGrade(active.file, effective);
      const preset = PRESETS.find((p) => p.id === st.presetId);
      const name = preset ? `${preset.name} Manual` : "Manual Color Grade";
      saveBlob(blob, gradeFileName(name));
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

  /** Toolbar download: the AI result when one is shown, otherwise the manual grade. */
  const download = () => {
    if (!active) return;
    if (showOriginal) {
      saveBlob(active.file, active.file.name);
      return;
    }
    if (aiUrl) {
      void downloadAi();
      return;
    }
    void downloadManual();
  };

  const useHistoryItem = (item: HistoryItem) => {
    if (!activeId) {
      toast("Upload an image to apply a saved result");
      return;
    }
    addResult(activeId, URL.createObjectURL(item.blob), item.name, item.prompt ?? "");
  };

  /* ------------------------------------------------------------------ */
  /* mobile parameter editor                                             */
  /* ------------------------------------------------------------------ */
  const openParam = (key: AdjustmentKey) => {
    editorBackup.current = { value: st.adjustments[key], enabled: st.enabled[key] };
    setEditingKey(key);
  };
  const closeEditor = () => {
    editorBackup.current = null;
    setEditingKey(null);
  };
  const cancelEditor = () => {
    const backup = editorBackup.current;
    if (editingKey && backup) {
      applyPatch((s) => ({
        adjustments: { ...s.adjustments, [editingKey]: backup.value },
        enabled: { ...s.enabled, [editingKey]: backup.enabled },
      }));
    }
    closeEditor();
  };

  const openFilePicker = () => fileRef.current?.click();

  const stageKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (active) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFilePicker();
    }
  };

  const stopStageDrag = (e: ReactPointerEvent<HTMLDivElement>) => e.stopPropagation();

  return (
    <div className="w-full">
      <section className="cg-shell">
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex items-center gap-2 text-[13px] font-medium text-muted-foreground sm:mb-6"
        >
          <a href="#explore-apps" className="transition-colors hover:text-foreground">
            Apps
          </a>
          <span aria-hidden>/</span>
          <span className="text-foreground">AI Color Grading</span>
        </nav>

        <div className="cg-page-content min-w-0">
          <h1 className="font-display text-[44px] font-extrabold uppercase leading-[1.1] tracking-[-0.02em] text-foreground [text-wrap:balance] max-[900px]:text-[28px]">
            AI Color{" "}
            <span className="bg-gradient-to-b from-volt to-volt/60 bg-clip-text text-transparent">
              Grading
            </span>
          </h1>
          <p className="mt-[10px] max-w-[60ch] text-[15px] font-medium leading-relaxed text-muted-foreground max-[900px]:text-[13px]">
            Drop your stills, dial in the look with live controls, and export a cinematic grade.
            Every change previews instantly — nothing is uploaded until you generate.
          </p>


          {/* ---------------- workspace ---------------- */}
          <div
            className={`cg-work${active ? "" : " cg-no-image"}${editingKey ? " cg-editing" : ""}`}
          >
            <WorkRail
              images={images}
              activeId={activeId}
              onSelect={setActiveId}
              onRemove={remove}
              onReplace={replaceFile}
              onAdd={acceptFiles}
            />

            <section className="cg-canvas-card" aria-label="Preview">
              <div className="cg-toolbar">
                <button
                  type="button"
                  className={`cg-pill cg-cmp cg-btn-compare${comparing ? " cg-on" : ""}`}
                  role="switch"
                  aria-checked={comparing}
                  disabled={!canCompare}
                  onClick={toggleCompare}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M8 3 4 7l4 4" />
                    <path d="M4 7h16" />
                    <path d="m16 21 4-4-4-4" />
                    <path d="M20 17H4" />
                  </svg>
                  <span className="cg-lbl">Compare</span>
                </button>

                <div className="cg-tool-mid">
                  <button
                    type="button"
                    className="cg-pill cg-icon"
                    title="Undo"
                    aria-label="Undo"
                    disabled={!canUndo}
                    onClick={undo}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </button>
                  <button type="button" className="cg-pill" onClick={resetAll} disabled={!active}>
                    Reset
                  </button>
                  <button
                    type="button"
                    className="cg-pill cg-icon"
                    title="Redo"
                    aria-label="Redo"
                    disabled={!canRedo}
                    onClick={redo}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                  </button>
                </div>

                <button
                  type="button"
                  className="cg-pill cg-solid cg-btn-download"
                  disabled={!active || busy}
                  onClick={download}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M12 15V3" />
                  </svg>
                  <span className="cg-lbl">Download</span>
                </button>
              </div>

              <div
                ref={dropRef}
                className={`cg-stage${active ? "" : " cg-empty"}${dragOver ? " cg-drag" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={active ? undefined : openFilePicker}
                onKeyDown={stageKeyDown}
                role={active ? undefined : "button"}
                tabIndex={active ? undefined : 0}
                aria-label={active ? undefined : "Drop images or click to upload"}
              >
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    acceptFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

                {!active && (
                  <div className="cg-drop">
                    <span className="cg-circle">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </svg>
                    </span>
                    <h2>
                      Drop your images
                      <br />
                      to start color grading
                    </h2>
                    <p>
                      Upload from device · {ACCEPTED_LABEL} · up to {MAX_IMAGES} files
                    </p>
                  </div>
                )}

                {active && (
                  <div className="cg-viewer" onPointerDown={stopStageDrag}>
                    {showOriginal && (
                      <ImageStage ratio={ratio} maxHeight="100%">
                        <img
                          src={active.url}
                          alt="Original image"
                          draggable={false}
                          className="absolute inset-0 h-full w-full object-contain object-center"
                        />
                      </ImageStage>
                    )}

                    {!showOriginal && !comparing && (
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

                    {comparing && (
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
                  </div>
                )}

                {busy && (
                  <div className="cg-busy" role="status" aria-live="polite">
                    <svg
                      viewBox="0 0 24 24"
                      width="26"
                      height="26"
                      fill="none"
                      stroke="var(--volt)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="animate-spin"
                      aria-hidden
                    >
                      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
                    </svg>
                    <p>Applying your grade…</p>
                    <p className="cg-sub">Rendering tone, colour and grain. This takes a moment.</p>
                  </div>
                )}
              </div>

              {active && (
                <div className="cg-strip">
                  <div className="cg-shots">
                    <button
                      type="button"
                      className="cg-shot"
                      aria-pressed={showOriginal}
                      onClick={() => setView("original")}
                    >
                      <img src={active.url} alt="" draggable={false} />
                      <span>Original</span>
                    </button>
                    <button
                      type="button"
                      className="cg-shot"
                      aria-pressed={!showOriginal && st.resultIndex === -1}
                      onClick={() => selectVersion(-1)}
                    >
                      <img src={active.url} alt="" draggable={false} />
                      <span>Graded</span>
                    </button>
                    {results.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        className="cg-shot"
                        aria-pressed={!showOriginal && st.resultIndex === i}
                        onClick={() => selectVersion(i)}
                        title={resultNames[i]}
                      >
                        <img src={url} alt="" draggable={false} />
                        <span>{resultNames[i] ?? `AI ${i + 1}`}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="cg-dl-fab"
                    aria-label="Download"
                    disabled={busy}
                    onClick={download}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="m7 10 5 5 5-5" />
                      <path d="M12 15V3" />
                    </svg>
                  </button>
                </div>
              )}
            </section>

            <ControlsPanel
              tab={tab}
              onTab={setTab}
              hasImage={Boolean(active)}
              sourceUrl={active?.url ?? null}
              prompt={st.prompt}
              onPrompt={setPrompt}
              onGenerate={() => void generate(activeId)}
              busy={busy}
              error={status === "error" ? (st.error ?? "Generation failed") : null}
              onRetry={() => void generate(activeId, st.lastRequest?.prompt)}
              presetId={active ? st.presetId : null}
              onPickPreset={pickPreset}
              values={st.adjustments}
              enabled={st.enabled}
              onChange={updateAdjustment}
              onToggle={toggleEffect}
              onResetKey={resetKey}
              onResetGroup={resetGroup}
              onResetAll={resetAll}
              collapsed={collapsed}
              onToggleGroup={(id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))}
              activeGroup={active ? activeGroup : null}
              onSelectGroup={setActiveGroup}
              onOpenParam={openParam}
              onDragStart={beginDrag}
              onDragEnd={endDrag}
            />

            {editingKey && (
              <ValueEditor
                paramKey={editingKey}
                value={st.adjustments[editingKey]}
                enabled={st.enabled[editingKey]}
                onChange={(v) => updateAdjustment(editingKey, v)}
                onToggle={(on) => toggleEffect(editingKey, on)}
                onReset={() => resetKey(editingKey)}
                onCancel={cancelEditor}
                onApply={closeEditor}
                onDragStart={beginDrag}
                onDragEnd={endDrag}
              />
            )}
          </div>

          <GradingHistory
            items={history.items}
            onUse={useHistoryItem}
            onDownload={(item) =>
              saveBlob(
                item.blob,
                item.kind === "ai"
                  ? promptFileName(item.prompt, item.blob)
                  : gradeFileName(item.name),
              )
            }
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
