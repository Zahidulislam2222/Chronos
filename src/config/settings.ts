import { z } from "zod";

const environment = z.object({
  apiUrl: z.string().url().or(z.literal("")).default(""),
  wpApiUrl: z.string().url().or(z.literal("")).default(""),
  siteUrl: z.string().url().or(z.literal("")).default(""),
  searchIndexable: z.enum(["true", "false"]).default("false").transform(value => value === "true"),
  mode: z.enum(["preview", "connected"]).default("preview"),
  requestTimeoutMs: z.coerce.number().int().positive().default(30000),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  refreshIntervalMs: z.coerce.number().int().positive().default(30000),
});

export const settings = environment.parse({
  apiUrl: import.meta.env.VITE_API_URL,
  wpApiUrl: import.meta.env.VITE_WP_API_URL,
  siteUrl: import.meta.env.VITE_SITE_URL,
  mode: import.meta.env.VITE_STOREFRONT_MODE,
  searchIndexable: import.meta.env.VITE_SEARCH_INDEXABLE,
  requestTimeoutMs: import.meta.env.VITE_REQUEST_TIMEOUT_MS,
  pageSize: import.meta.env.VITE_CONTENT_PAGE_SIZE,
  refreshIntervalMs: import.meta.env.VITE_CONTENT_REFRESH_MS,
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
  checkoutAttemptPrefix: "chronos_checkout_attempt_",
  previewCart: "chronos_preview_selection",
  guestCart: "chronos_cart_guest",
  userCartPrefix: "chronos_cart_",
};
