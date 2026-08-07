import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { LEGAL_DOCS, legalMarkdownComponents, type LegalSlug } from "@/lib/legal-docs";

type LegalModalContextValue = {
  open: (slug: LegalSlug) => void;
  close: () => void;
  isOpen: boolean;
};

const LegalModalContext = createContext<LegalModalContextValue | null>(null);

export function useLegalModal(): LegalModalContextValue {
  const ctx = useContext(LegalModalContext);
  if (!ctx) {
    throw new Error("useLegalModal must be used inside <LegalModalProvider>");
  }
  return ctx;
}

export function LegalModalProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState<LegalSlug | null>(null);

  const open = useCallback((s: LegalSlug) => setSlug(s), []);
  const close = useCallback(() => setSlug(null), []);

  const value = useMemo(() => ({ open, close, isOpen: slug !== null }), [open, close, slug]);

  const doc = slug ? LEGAL_DOCS[slug] : null;

  return (
    <LegalModalContext.Provider value={value}>
      {children}
      <DialogPrimitive.Root
        open={slug !== null}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-[200] backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            style={{ background: "color-mix(in oklab, var(--background) 85%, transparent)" }}
          />
          <DialogPrimitive.Content
            className="fixed left-1/2 top-1/2 z-[201] flex w-[calc(100%-24px)] max-w-[640px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            style={{
              borderRadius: 24,
              maxHeight: "min(85vh, 780px)",
              border: "1px solid var(--card-border)",
            }}
            aria-describedby={undefined}
          >
            <div className="relative flex items-center justify-center px-6 pb-3 pt-6">
              <DialogPrimitive.Title
                className="text-center text-[26px] leading-none tracking-tight text-foreground"
              >
                {doc?.title ?? ""}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                style={{ background: "var(--card-border)" }}
                aria-label="Close"
              >
                <X size={16} strokeWidth={2.25} />
              </DialogPrimitive.Close>
            </div>

            <div className="h-px w-full bg-white/10" />

            <div
              className="overflow-y-auto px-6 py-6 text-[14.5px] leading-relaxed text-muted-foreground sm:px-8"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {doc ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={legalMarkdownComponents}
                >
                  {doc.content}
                </ReactMarkdown>
              ) : null}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </LegalModalContext.Provider>
  );
}