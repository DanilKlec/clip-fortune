import { useRef, type ChangeEvent } from "react";
import { Plus, RefreshCw, X } from "lucide-react";
import type { GradingImage } from "./useImageLibrary";

interface Props {
  images: GradingImage[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onReplace: (id: string, file: File) => void;
  onAdd: (files: FileList | null) => void;
  /** Horizontal strip (mobile/tablet) or vertical rail (desktop sidebar). */
  orientation?: "horizontal" | "vertical";
}

export function ImageTray({
  images,
  activeId,
  onSelect,
  onRemove,
  onReplace,
  onAdd,
  orientation = "horizontal",
}: Props) {
  const addRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replacingId = useRef<string | null>(null);

  const onReplacePicked = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && replacingId.current) onReplace(replacingId.current, f);
    e.target.value = "";
  };

  const vertical = orientation === "vertical";

  const thumbs = images.map((img, i) => {
    const active = img.id === activeId;
    return (
      <div key={img.id} className="relative h-[72px] w-[72px] shrink-0 sm:h-20 sm:w-20">
        <button
          type="button"
          onClick={() => onSelect(img.id)}
          aria-label={`Select image ${i + 1}`}
          aria-pressed={active}
          className="h-full w-full overflow-hidden rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            borderColor: active ? "var(--volt)" : "var(--card-border)",
            background: "var(--tile)",
          }}
        >
          <img src={img.url} alt={img.file.name} className="h-full w-full object-cover" />
        </button>
        {active && (
          <span className="badge-volt pointer-events-none absolute inset-0 m-auto flex h-fit w-fit items-center">Main</span>
        )}
        <div className="absolute -bottom-1 left-0 right-0 flex justify-between px-0.5">
          <button
            type="button"
            aria-label={`Replace image ${i + 1}`}
            onClick={() => {
              replacingId.current = img.id;
              replaceRef.current?.click();
            }}
            className="cg-tray-btn flex h-[22px] w-[22px] items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ borderColor: "var(--card-border)" }}
          >
            <RefreshCw size={11} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={`Remove image ${i + 1}`}
            onClick={() => onRemove(img.id)}
            className="cg-tray-btn flex h-[22px] w-[22px] items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ borderColor: "var(--card-border)" }}
          >
            <X size={11} strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  });

  const addButton = (
    <button
      type="button"
      aria-label="Add images"
      onClick={() => addRef.current?.click()}
      className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl border border-dashed text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-20 sm:w-20"
      style={{ borderColor: "var(--card-border)", background: "var(--tile)" }}
    >
      <Plus size={20} strokeWidth={1.75} />
    </button>
  );

  const inputs = (
    <>
      <input
        ref={addRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onReplacePicked}
      />
    </>
  );

  if (vertical) {
    return (
      <div className="box-border flex min-h-0 flex-1 flex-col items-center gap-3">
        <div className="flex w-full min-h-0 flex-[0_1_auto] flex-col items-center gap-3 overflow-y-auto overflow-x-hidden px-1 py-1">
          {thumbs}
        </div>
        <div className="flex-none pb-1">{addButton}</div>
        {inputs}
      </div>
    );
  }

  return (
    <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      {thumbs}
      {addButton}
      {inputs}
    </div>
  );
}
