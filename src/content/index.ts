import { z } from "zod";
import copy from "./storefront.json";
import catalogue from "./catalogue.json";
import connected from "./connected.json";
import { isPreview } from "@/config/settings";

const media = z.string().regex(/^\/images\/[a-z0-9-]+\.(png|webp|jpg)$/);
export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  price: z.number().finite().nonnegative(),
  salePrice: z.number().finite().nonnegative().optional(),
  description: z.string(),
  shortDescription: z.string(),
  image: z.string(),
  gallery: z.array(z.string()).min(1),
  category: z.string(),
  brand: z.string(),
  inStock: z.boolean(),
  featured: z.boolean(),
  specifications: z.object({
    movement: z.string(),
    caseMaterial: z.string(),
    dialColor: z.string(),
    waterResistance: z.string(),
    caseDiameter: z.string(),
  }),
});
const post = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  featuredImage: media,
  author: z.object({ name: z.string(), avatar: z.string() }),
  date: z.string(),
  category: z.string(),
  readTime: z.string(),
  paragraphs: z.array(z.string()),
});
z.object({ products: z.array(productSchema.extend({image:media,gallery:z.array(media).min(1)})), posts: z.array(post) }).parse(catalogue);
export const previewCatalogue = catalogue;

// Validate maintained copy recursively, preserving its inferred typed structure.
function validateCopy(value: unknown): void {
  if (typeof value === "string") {
    z.string().min(1).parse(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(validateCopy);
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach(validateCopy);
    return;
  }
  throw new Error(
    "Storefront content must contain non-empty strings, arrays or objects.",
  );
}
validateCopy(copy);
validateCopy(connected);
export const connectedContent = connected;
export const content = isPreview ? copy : {
  ...copy,
  brand: {...copy.brand,...connected.brand},
  collection: {...copy.collection,...connected.collection},
  hero: {...copy.hero,...connected.hero},
  craft: {...copy.craft,...connected.craft},
  ui: {...copy.ui,...connected.ui},
  contact: {...copy.contact,...connected.contact},
};
