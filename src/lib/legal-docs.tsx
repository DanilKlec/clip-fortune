import type { Components } from "react-markdown";

import privacyMd from "@/content/legal/privacypolicy.md?raw";
import termsMd from "@/content/legal/termsofuse.md?raw";
import cookiesMd from "@/content/legal/cookiepolicy.md?raw";
import refundMd from "@/content/legal/refundpolicy.md?raw";
import billingMd from "@/content/legal/billingterms.md?raw";

export type LegalSlug = "privacy" | "terms" | "cookies" | "refund" | "billing";

export type LegalDoc = {
  title: string;
  description: string;
  content: string;
};

export const LEGAL_DOCS: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: "Privacy Policy",
    description: "How Robinzone collects, uses, and protects your data.",
    content: privacyMd,
  },
  terms: {
    title: "Terms of Use",
    description: "The rules and conditions for using Robinzone.",
    content: termsMd,
  },
  cookies: {
    title: "Cookie Policy",
    description: "How we use cookies and similar technologies.",
    content: cookiesMd,
  },
  refund: {
    title: "Refund Policy",
    description: "How to cancel and request a refund.",
    content: refundMd,
  },
  billing: {
    title: "Billing Terms",
    description: "How purchases, subscriptions and payments work.",
    content: billingMd,
  },
};

/**
 * Markdown → JSX mapping used by both the modal overlay and the
 * standalone /legal/$slug route so typography stays identical.
 * The document's own H1 is hidden — the title lives in the dialog header
 * (or in the page frame) instead.
 */
export const legalMarkdownComponents: Components = {
  h1: () => null,
  h2: (props) => (
    <h2
      className="mt-8 mb-3 text-[17px] font-semibold text-foreground"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="mt-6 mb-2 text-[15px] font-semibold text-foreground"
      {...props}
    />
  ),
  p: (props) => <p className="mb-4" {...props} />,
  ul: (props) => <ul className="mb-4 ml-5 list-disc space-y-1.5" {...props} />,
  ol: (props) => <ol className="mb-4 ml-5 list-decimal space-y-1.5" {...props} />,
  li: (props) => <li className="pl-1" {...props} />,
  a: (props) => (
    <a
      className="text-primary underline-offset-2 hover:underline"
      {...props}
    />
  ),
  strong: (props) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  hr: () => <hr className="my-6 border-t border-black/10" />,
};