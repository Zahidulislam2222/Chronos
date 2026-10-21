import { z } from "zod";
import content from "@/content/interface.json";

export const interfaceSettings = z.object({
  mobileBreakpoint: z.number().int().positive(),
  storageKeys: z.object({
    checkoutAttemptPrefix: z.string().min(1), previewCart: z.string().min(1),
    guestCart: z.string().min(1), userCartPrefix: z.string().min(1), cookieConsent: z.string().min(1),
  }).strict(),
}).strict().parse(content);
