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
  presetId: string | null;
  adjustments: Adjustments;
  enabled: EffectToggles;
}

/** Everything the editor remembers per uploaded image. */
export interface ImageState {
  prompt: string;
  presetId: string | null;
  adjustments: Adjustments;
  enabled: EffectToggles;
  status: GradingStatus;
  error: string | null;
  resultUrl: string | null;
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
    status: "ready",
    error: null,
    resultUrl: null,
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

  const add = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const created = files.map((file) => ({
      id: nextId(),
      file,
      url: track(URL.createObjectURL(file)),
    }));
    setImages((prev) => [...prev, ...created]);
    setStates((prev) => {
      const next = { ...prev };
      for (const img of created) next[img.id] = createImageState();
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
      if (st?.resultUrl) release(st.resultUrl);
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
      if (prev[id]?.resultUrl) release(prev[id].resultUrl);
      return { ...prev, [id]: createImageState() };
    });
  }, []);

  const clearAll = useCallback(() => {
    setImages((prev) => {
      prev.forEach((i) => release(i.url));
      return [];
    });
    setStates((prev) => {
      Object.values(prev).forEach((s) => s.resultUrl && release(s.resultUrl));
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

  /** Replace an image's result URL, revoking the previous one. */
  const setResult = useCallback((id: string, url: string | null) => {
    setStates((prev) => {
      const cur = prev[id];
      if (!cur) {
        if (url) URL.revokeObjectURL(url);
        return prev;
      }
      if (cur.resultUrl && cur.resultUrl !== url) release(cur.resultUrl);
      if (url?.startsWith("blob:")) track(url);
      return { ...prev, [id]: { ...cur, resultUrl: url } };
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
    setResult,
  };
}
