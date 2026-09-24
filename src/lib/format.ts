import { content } from "@/content";
export const money = (value: number, currency: string = content.brand.currency) =>
  new Intl.NumberFormat(content.brand.locale, {
    style: "currency",
    currency,
  }).format(value);
