import { useRef, type ChangeEvent } from "react";
import type { GradingImage } from "./useImageLibrary";

interface Props {
  images: GradingImage[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onReplace: (id: string, file: File) => void;
  onAdd: (files: FileList | null) => void;
}

/** Vertical (desktop) / grid (mobile) list of uploaded frames. */
export function WorkRail({ images, activeId, onSelect, onRemove, onReplace, onAdd }: Props) {
  const addRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replacingId = useRef<string | null>(null);

  const onReplacePicked = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && replacingId.current) onReplace(replacingId.current, f);
    e.target.value = "";
  };

  return (
    <div className="cg-rail" id="rail">
      {images.map((img, i) => {
        const active = img.id === activeId;
        return (
          <div
            key={img.id}
            className="cg-thumb"
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`Select image ${i + 1}`}
            onClick={() => onSelect(img.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(img.id);
              }
            }}
          >
            <img src={img.url} alt={img.file.name} />
            <div className="cg-ops">
              <span
                role="button"
                tabIndex={0}
                aria-label={`Replace image ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  replacingId.current = img.id;
                  replaceRef.current?.click();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    replacingId.current = img.id;
                    replaceRef.current?.click();
                  }
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="11"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
              </span>
              <span
                role="button"
                tabIndex={0}
                aria-label={`Remove image ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(img.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(img.id);
                  }
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="11"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </span>
            </div>
          </div>
        );
      })}

      <button type="button" className="cg-add" aria-label="Add images" onClick={() => addRef.current?.click()}>
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </button>

      <input
        ref={addRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={onReplacePicked}
      />
    </div>
  );
}
