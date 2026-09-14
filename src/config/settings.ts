import { z } from "zod";

const environment = z.object({
  apiUrl: z.string().url().or(z.literal("")).default(""),
  wpApiUrl: z.string().url().or(z.literal("")).default(""),
  siteUrl: z.string().url().or(z.literal("")).default(""),
  searchIndexable: z.enum(["true", "false"]).default("false").transform(value => value === "true"),
  mode: z.enum(["preview", "connected"]).default("preview"),
});

export const settings = environment.parse({
  apiUrl: import.meta.env.VITE_API_URL,
  wpApiUrl: import.meta.env.VITE_WP_API_URL,
  siteUrl: import.meta.env.VITE_SITE_URL,
  mode: import.meta.env.VITE_STOREFRONT_MODE,
  searchIndexable: import.meta.env.VITE_SEARCH_INDEXABLE,
});

export const isPreview = settings.mode === "preview";
export const motionTokens = {
  reveal: 0.7,
  stagger: 0.08,
  ease: [0.22, 1, 0.36, 1] as const,
  heroTravel: 70,
  heroRotation: 7,
  heroScale: 0.88,
};

export const storageKeys = {
  previewCart: "chronos_preview_selection",
  guestCart: "chronos_cart_guest",
  userCartPrefix: "chronos_cart_",
};
