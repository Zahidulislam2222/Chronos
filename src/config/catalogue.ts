import { z } from "zod";
import data from "../../config/catalogue.json";

export const catalogueSettings = z.object({
  excludedProductIds: z.array(z.number().int().positive()),
  excludedPostIds: z.array(z.number().int().positive()),
  readingWordsPerMinute: z.number().positive(),
  readingTimeLabel: z.string().includes("{minutes}"),
}).parse(data);
