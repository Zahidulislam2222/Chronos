import { z } from "zod";
import raw from "@/content/cinema.json";
const source = z.object({
  poster: z.string(),
  fallbackPoster: z.string(),
  mobileFallbackPoster: z.string(),
  mobilePoster: z.string(),
  video: z.string(),
  mobileVideo: z.string(),
});
export const cinema = z
  .object({
    hero: source,
    study: source,
    seekThreshold: z.number().positive(),
    endPadding: z.number().positive(),
    mobileBreakpoint: z.number().positive(),
  })
  .parse(raw);
