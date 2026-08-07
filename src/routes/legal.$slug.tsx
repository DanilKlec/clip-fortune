import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { LEGAL_DOCS, legalMarkdownComponents, type LegalSlug } from "@/lib/legal-docs";

export const Route = createFileRoute("/legal/$slug")({
  loader: ({ params }) => {
    const doc = LEGAL_DOCS[params.slug as LegalSlug];
    if (!doc) throw notFound();
    return doc;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} · Virality Predictor` },
          { name: "description", content: loaderData.description },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.description },
          { property: "og:type", content: "article" },
          { name: "twitter:card", content: "summary" },
        ]
      : [],
  }),
  component: LegalPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">Legal document not found</h1>
      <p className="mt-3 text-[color:var(--text-secondary)]">
        Try one of the links in the footer.
      </p>
      <Link to="/" className="mt-6 inline-block text-primary underline">
        Back to home
      </Link>
    </div>
  ),
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Could not load this page</h1>
        <button
          onClick={() => {
            reset();
            router.invalidate();
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  },
});

function LegalPage() {
  const doc = Route.useLoaderData();
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1
        className="mb-8 text-center text-[38px] leading-none tracking-tight text-foreground"
      >
        {doc.title}
      </h1>
      <div className="legal-doc text-[15px] leading-relaxed text-[color:var(--text-secondary)]">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={legalMarkdownComponents}
        >
          {doc.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}