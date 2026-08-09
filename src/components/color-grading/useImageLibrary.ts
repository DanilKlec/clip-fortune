import { useCallback, useEffect, useRef, useState } from "react";

export interface GradingImage {
  id: string;
  file: File;
  url: string;
}

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const ACCEPTED_LABEL = "PNG, JPG or WebP";
/** Matches the server-side limit in /api/color-grade. */
export const MAX_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGES = 9;

export function isAccepted(file: File) {
  return (
    ACCEPTED_TYPES.includes(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name)
  );
}

/** Identity used to detect the same file being picked twice. */
export function fileKey(f: File) {
  return `${f.name}:${f.size}:${f.lastModified}`;
}

let seq = 0;
const nextId = () => `img-${++seq}-${Date.now()}`;

/** Owns the image list and the lifecycle of every object URL it creates. */
export function useImageLibrary() {
  const [images, setImages] = useState<GradingImage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
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
  }, []);

  const replace = useCallback((id: string, file: File) => {
    setImages((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        release(i.url);
        return { ...i, file, url: track(URL.createObjectURL(file)) };
      }),
    );
  }, []);

  const clearAll = useCallback(() => {
    setImages((prev) => {
      prev.forEach((i) => release(i.url));
      return [];
    });
    setActiveId(null);
  }, []);

  const active = images.find((i) => i.id === activeId) ?? null;

  return { images, active, activeId, setActiveId, add, remove, replace, clearAll };
}