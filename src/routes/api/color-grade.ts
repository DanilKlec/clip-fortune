import { createFileRoute } from "@tanstack/react-router";

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILES = 9;
const MAX_BYTES = 20 * 1024 * 1024;

function err(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** Model bounds; sides are scaled proportionally, never cropped. */
const MIN_SIDE = 256;
const MAX_SIDE = 4096;

/**
 * Exact output frame from the MAIN image: the original pixel size, scaled
 * proportionally only when it falls outside the model limits. Never cropped.
 */
function clampSize(w: number, h: number): { width: number; height: number } | null {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  let scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  if (Math.min(w, h) * scale < MIN_SIDE) scale = MIN_SIDE / Math.min(w, h);
  scale = Math.min(scale, MAX_SIDE / Math.max(w, h));
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}


export const Route = createFileRoute("/api/color-grade")({
  server: {
    handlers: {
      // Proxy the remote result so the browser can download it as a file.
      GET: async ({ request }) => {
        const target = new URL(request.url).searchParams.get("url");
        if (!target) return err("Missing url", 400);
        let host: string;
        try {
          host = new URL(target).hostname;
        } catch {
          return err("Invalid url", 400);
        }
        if (!/(^|\.)(fal\.media|fal\.ai|fal\.run)$/.test(host)) {
          return err("Invalid url", 400);
        }
        const upstream = await fetch(target);
        if (!upstream.ok || !upstream.body) {
          return err("Could not fetch the generated image", 502);
        }
        return new Response(upstream.body, {
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
            "Cache-Control": "no-store",
          },
        });
      },

      POST: async ({ request }) => {
        const key = process.env["FAL_KEY"];
        if (!key) return err("AI generation is not configured yet.", 503);

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return err("Invalid request.", 400);
        }

        const prompt = String(form.get("prompt") ?? "").slice(0, 4000);
        if (!prompt) return err("Missing prompt.", 400);

        const files = form.getAll("images").filter((f): f is File => f instanceof File);
        if (files.length === 0) return err("No image selected.", 400);
        if (files.length > MAX_FILES) return err(`Up to ${MAX_FILES} images per request.`, 400);
        for (const f of files) {
          if (!ACCEPTED.includes(f.type)) {
            return err("Only PNG, JPG and WebP images are supported.", 400);
          }
          if (f.size > MAX_BYTES) {
            return err("Image is too large — keep files under 20MB.", 400);
          }
        }

        const imageSize = clampSize(Number(form.get("width")), Number(form.get("height")));

        try {
          const { fal } = await import("@fal-ai/client");
          fal.config({ credentials: key });

          const image_urls: string[] = [];
          for (const f of files) {
            image_urls.push(await fal.storage.upload(f));
          }

          const result = await fal.subscribe("fal-ai/flux-2-pro/edit", {
            input: {
              prompt,
              image_urls,
              ...(imageSize ? { image_size: imageSize } : {}),
              output_format: "jpeg",
              enable_safety_checker: true,
            },
          });

          const images = (result as { data?: { images?: { url?: string }[] } }).data?.images;
          const url = images?.[0]?.url;
          if (!url) return err("The generation finished without an image.", 502);
          return Response.json({ imageUrl: url });
        } catch (e) {
          const status = (e as { status?: number })?.status;
          const detail =
            `${(e as { body?: { detail?: unknown } })?.body?.detail ?? ""} ${(e as Error)?.message ?? ""}`.toLowerCase();
          console.error("color-grade generation failed", status ?? "unknown");
          if (status === 402 || detail.includes("balance") || detail.includes("credit")) {
            return err(
              "The AI account is out of credits — top up the Fal.ai balance and try again.",
              402,
            );
          }
          if (status === 429 || detail.includes("rate limit")) {
            return err("Rate limit reached — please try again in a moment.", 429);
          }
          if (status === 401 || status === 403) {
            return err("AI generation is not configured yet.", 503);
          }
          if (status && status >= 500) {
            return err("The AI service is temporarily unavailable.", 503);
          }
          return err("Generation failed. Please try again.", 500);
        }
      },
    },
  },
});
