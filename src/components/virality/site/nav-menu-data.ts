export type NavVerb = "image" | "video";

export interface NavMenuModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  logo?: string;
  tags: string[];
}

export interface NavMenuConfig {
  label: string;
  subtitle: string;
  studioLabel: string;
  models: NavMenuModel[];
}

/** Provider logo registry — mirrors the main site's PROVIDER_REGISTRY. */
export const PROVIDER_LOGOS: Record<string, string> = {
  alibaba: "https://www.alibabacloud.com/favicon.ico",
  bytedance: "https://www.bytedance.com/favicon.ico",
  google: "https://www.google.com/favicon.ico",
  kwaivgi: "https://klingai.com/favicon.ico",
  xai: "https://x.ai/favicon.ico",
  "fal-ai": "https://fal.ai/favicon.ico",
  openai: "https://openai.com/favicon.ico",
};

export const NAV_MENUS: Record<NavVerb, NavMenuConfig> = {
  image: {
    label: "Image",
    subtitle: "Create, edit and enhance still images",
    studioLabel: "Open Creation Studio",
    models: [
      {
        id: "nano-banana-pro",
        name: "Nano Banana PRO",
        description: "FAL",
        provider: "FAL",
        logo: PROVIDER_LOGOS["fal-ai"],
        tags: ["Featured"],
      },
      {
        id: "nano-banana-pro-edit",
        name: "Nano Banana PRO / Edit",
        description: "FAL",
        provider: "FAL",
        logo: PROVIDER_LOGOS["fal-ai"],
        tags: ["Featured"],
      },
      {
        id: "gpt-image-2",
        name: "GPT Image 2",
        description: "OpenAI",
        provider: "OpenAI",
        logo: PROVIDER_LOGOS.openai,
        tags: ["Featured"],
      },
      {
        id: "grok-imagine-image",
        name: "Grok Imagine Image / Quality / Text TO Image",
        description: "xAI",
        provider: "xAI",
        logo: "https://x.ai/favicon.ico",
        tags: ["Featured"],
      },
    ],
  },
  video: {
    label: "Video",
    subtitle: "Generate cinematic clips from text or images",
    studioLabel: "Open Creation Studio",
    models: [
      {
        id: "seedance-2-fast-i2v",
        name: "Seedance 2.0 Fast Image-to-Video",
        description: "Fast Image To Video",
        provider: "ByteDance",
        logo: PROVIDER_LOGOS.bytedance,
        tags: ["Featured"],
      },
      {
        id: "seedance-2-fast-t2v",
        name: "Seedance 2.0 Fast Text-to-Video",
        description: "Fast Text To Video",
        provider: "ByteDance",
        logo: PROVIDER_LOGOS.bytedance,
        tags: ["Featured"],
      },
      {
        id: "veo31-fast",
        name: "Veo 3.1 Fast",
        description: "Generate videos using Google's Veo 3.1 fast model.",
        provider: "Google",
        logo: "https://www.google.com/favicon.ico",
        tags: ["Featured"],
      },
      {
        id: "veo31-fast-i2v",
        name: "Veo 3.1 Fast I2V",
        description:
          "Generate videos by animating an input image using Google's Veo 3.1 Fast model.",
        provider: "Google",
        logo: "https://www.google.com/favicon.ico",
        tags: ["Featured"],
      },
      {
        id: "grok-imagine-video-i2v",
        name: "Grok Imagine Video I2V",
        description: "Generate a video based on an image using Grok Imagine.",
        provider: "xAI",
        logo: "https://x.ai/favicon.ico",
        tags: ["Featured"],
      },
      {
        id: "grok-imagine-video-t2v",
        name: "Grok Imagine Video T2V",
        description: "Generate a video based on a text description using Grok Imagine.",
        provider: "xAI",
        logo: "https://x.ai/favicon.ico",
        tags: ["Featured"],
      },
    ],
  },
};