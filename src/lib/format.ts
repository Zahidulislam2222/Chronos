import { content } from "@/content";
export const money = (value: number) =>
  new Intl.NumberFormat(content.brand.locale, {
    style: "currency",
    currency: content.brand.currency,
    maximumFractionDigits: 0,
  }).format(value);
