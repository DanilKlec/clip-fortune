import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_ENABLED, NEUTRAL, PRESETS, type Adjustments, type EffectToggles } from "./grading";

export interface GradingImage {
  id: string;
  file: File;
  url: string;
}

export type GradingStatus = "ready" | "generating" | "success" | "error";

export interface GradeRequestSnapshot {
  prompt: string;
}

export type GradingMode = "manual" | "ai";

/** Everything the editor remembers per uploaded image. */
export interface ImageState {
  prompt: string;
  presetId: string | null;
  adjustments: Adjustments;
  enabled: EffectToggles;
  /** Active editing mode; kept per image so switching never resets state. */
  mode: GradingMode;
  status: GradingStatus;
  error: string | null;
  /** Every successful AI result for this image, in generation order. */
  results: string[];
  /** Display name of each AI result, derived locally from the prompt. */
  resultNames: string[];
  /** Index into results; -1 means the live local grade is shown. */
  resultIndex: number;
  comparePos: number;
  lastRequest: GradeRequestSnapshot | null;
  /** Which version the preview shows; independent from compare mode. */
  view: "original" | "edited";
  /** Split before/after comparison enabled for this image. */
  compare: boolean;
  /** Monotonic token used to discard stale async responses. */
  run: number;
}

export const DEFAULT_PRESET_ID = PRESETS[0].id;

export function createImageState(): ImageState {
  return {
    prompt: "",
    presetId: DEFAULT_PRESET_ID,
    adjustments: { ...NEUTRAL },
    enabled: { ...DEFAULT_ENABLED },
    mode: "manual",
    status: "ready",
    error: null,
    results: [],
    resultNames: [],
    resultIndex: -1,
    comparePos: 50,
    lastRequest: null,
    view: "edited",
    compare: false,
    run: 0,
  };
}

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const ACCEPTED_LABEL = "PNG, JPG or WebP";
/** Matches the server-side limit in /api/color-grade. */
export const MAX_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGES = 9;

export function isAccepted(file: File) {
  return ACCEPTED_TYPES.includes(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
}

/** Identity used to detect the same file being picked twice. */
export function fileKey(f: File) {
  return `${f.name}:${f.size}:${f.lastModified}`;
}

export interface ValidationResult {
  /** Files that passed every rule, already trimmed to the remaining room. */
  accepted: File[];
  /** Human readable problems to surface with a toast. */
  errors: string[];
}

/**
 * One validation path for both adding and replacing images: type, size,
 * duplicates and the total limit. Callers only apply `accepted`, so a rejected
 * file never removes a previously valid one.
 */
export function validateFiles(
  files: File[],
  existing: File[],
  options: { room?: number } = {},
): ValidationResult {
  const errors: string[] = [];
  const typed = files.filter(isAccepted);
  if (typed.length < files.length) errors.push(`Only ${ACCEPTED_LABEL} images are supported`);

  const sized = typed.filter((f) => f.size <= MAX_BYTES);
  if (sized.length < typed.length) errors.push("Some files are larger than 20MB and were skipped");

  const seen = new Set(existing.map(fileKey));
  const unique = sized.filter((f) => {
    const k = fileKey(f);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (unique.length < sized.length) errors.push("Duplicate images were skipped");

  const room = options.room ?? MAX_IMAGES - existing.length;
  if (room <= 0) {
    errors.push(`You can work with up to ${MAX_IMAGES} images`);
    return { accepted: [], errors };
  }
  if (unique.length > room) {
    errors.push(`Only ${MAX_IMAGES} images can be used — extras were skipped`);
  }
  return { accepted: unique.slice(0, room), errors };
}

let seq = 0;
const nextId = () => `img-${++seq}-${Date.now()}`;

/**
 * Owns the image list, the independent editor state of every image and the
 * lifecycle of each object URL (source previews and generated results).
 */
export function useImageLibrary() {
  const [images, setImages] = useState<GradingImage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, ImageState>>({});
  const urls = useRef(new Set<string>());

  const track = (url: string) => {
    urls.current.add(url);
    return url;
  };
  const release = (url: string) => {
    if (urls.current.delete(url)) URL.revokeObjectURL(url);
  };

  useEffect(
    () => () => {
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      urls.current.clear();
    },
    [],
  );

  const add = useCallback((files: File[], initial?: Partial<ImageState>) => {
    if (files.length === 0) return;
    const created = files.map((file) => ({
      id: nextId(),
      file,
      url: track(URL.createObjectURL(file)),
    }));
    setImages((prev) => [...prev, ...created]);
    setStates((prev) => {
      const next = { ...prev };
      for (const img of created) next[img.id] = { ...createImageState(), ...initial };
      return next;
    });
    setActiveId((prev) => prev ?? created[0].id);
  }, []);

  const remove = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) release(target.url);
      const next = prev.filter((i) => i.id !== id);
      setActiveId((cur) => (cur === id ? (next[0]?.id ?? null) : cur));
      return next;
    });
    setStates((prev) => {
      const st = prev[id];
      st?.results.forEach(release);
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const replace = useCallback((id: string, file: File) => {
    setImages((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        release(i.url);
        return { ...i, file, url: track(URL.createObjectURL(file)) };
      }),
    );
    setStates((prev) => {
      prev[id]?.results.forEach(release);
      return { ...prev, [id]: createImageState() };
    });
  }, []);

  const clearAll = useCallback(() => {
    setImages((prev) => {
      prev.forEach((i) => release(i.url));
      return [];
    });
    setStates((prev) => {
      Object.values(prev).forEach((s) => s.results.forEach(release));
      return {};
    });
    setActiveId(null);
  }, []);

  /** Update one image's editor state without touching any other image. */
  const patchState = useCallback((id: string, update: (prev: ImageState) => ImageState) => {
    setStates((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return { ...prev, [id]: update(cur) };
    });
  }, []);

  /** Append a new AI result to an image's session history and select it. */
  const addResult = useCallback((id: string, url: string, name: string) => {
    setStates((prev) => {
      const cur = prev[id];
      if (!cur) {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        return prev;
      }
      if (url.startsWith("blob:")) track(url);
      const results = [...cur.results, url];
      const resultNames = [...cur.resultNames, name];
      return {
        ...prev,
        [id]: { ...cur, results, resultNames, resultIndex: results.length - 1 },
      };
    });
  }, []);

  const active = images.find((i) => i.id === activeId) ?? null;
  const activeState = (activeId && states[activeId]) || null;

  return {
    images,
    active,
    activeId,
    activeState,
    states,
    setActiveId,
    add,
    remove,
    replace,
    clearAll,
    patchState,
    addResult,
  };
}
