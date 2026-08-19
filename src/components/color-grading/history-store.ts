import { useCallback, useEffect, useRef, useState } from "react";
import type { Adjustments } from "./grading";

export interface HistoryRecord {
  id: string;
  name: string;
  kind: "manual" | "ai";
  createdAt: number;
  sourceName: string;
  prompt?: string;
  presetId?: string | null;
  adjustments?: Adjustments;
  /** Result bytes. Stored in IndexedDB, never in localStorage. */
  blob: Blob;
}

/** Record plus a live object URL owned by the hook. */
export interface HistoryItem extends Omit<HistoryRecord, "blob"> {
  url: string;
  blob: Blob;
}

const DB_NAME = "cg-history";
const STORE = "results";
const LIMIT = 30;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" }).createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB unavailable"));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

async function readAll(): Promise<HistoryRecord[]> {
  const all = await tx<HistoryRecord[]>(
    "readonly",
    (s) => s.getAll() as IDBRequest<HistoryRecord[]>,
  );
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Visible generation history, persisted locally in IndexedDB so it survives
 * page reloads and switching between images. No backend involved.
 */
export function useGradingHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const urls = useRef(new Map<string, string>());

  const sync = useCallback((records: HistoryRecord[]) => {
    const next: HistoryItem[] = [];
    const keep = new Set<string>();
    for (const r of records) {
      keep.add(r.id);
      let url = urls.current.get(r.id);
      if (!url) {
        url = URL.createObjectURL(r.blob);
        urls.current.set(r.id, url);
      }
      next.push({ ...r, url });
    }
    for (const [id, url] of urls.current) {
      if (!keep.has(id)) {
        URL.revokeObjectURL(url);
        urls.current.delete(id);
      }
    }
    setItems(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      sync(await readAll());
    } catch {
      /* private mode / no IndexedDB — history stays empty */
    }
  }, [sync]);

  useEffect(() => {
    void refresh();
    const map = urls.current;
    return () => {
      map.forEach((u) => URL.revokeObjectURL(u));
      map.clear();
    };
  }, [refresh]);

  const add = useCallback(
    async (record: Omit<HistoryRecord, "id" | "createdAt">, dedupeKey?: string) => {
      try {
        const existing = await readAll();
        // The same result must not be stored twice on repeated downloads.
        if (dedupeKey && existing.some((r) => r.id.startsWith(`${dedupeKey}::`))) return;
        const id = `${dedupeKey ?? "rec"}::${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        await tx("readwrite", (s) => s.put({ ...record, id, createdAt: Date.now() }));
        const trimmed = [{ ...record, id, createdAt: Date.now() }, ...existing]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(LIMIT);
        for (const old of trimmed) await tx("readwrite", (s) => s.delete(old.id));
        await refresh();
      } catch {
        /* storage unavailable — history is best effort */
      }
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await tx("readwrite", (s) => s.delete(id));
      } catch {
        /* ignore */
      }
      await refresh();
    },
    [refresh],
  );

  const clear = useCallback(async () => {
    try {
      await tx("readwrite", (s) => s.clear());
    } catch {
      /* ignore */
    }
    await refresh();
  }, [refresh]);

  return { items, add, remove, clear };
}
