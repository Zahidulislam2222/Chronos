import { z } from "zod";
import data from "@/content/navigation.json";

const link = z.object({
  label: z.string().min(1),
  href: z.string().regex(/^\/(?!\/)/),
});

export const navigationSettings = z.object({
  header: z.object({
    topThresholdPx: z.number().finite().nonnegative(),
    directionThresholdPx: z.number().finite().positive(),
  }),
  supplementalLinks: z.array(link),
  footerGroups: z.array(z.object({
    title: z.string().min(1),
    usePrimaryNavigation: z.boolean(),
    links: z.array(link),
  })),
  pages: z.object({
    homeLabel: z.string().min(1),
    eyebrow: z.string().min(1),
    collectionLabel: z.string().min(1),
    collectionHref: link.shape.href,
  }),
}).parse(data);
