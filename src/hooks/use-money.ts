import { useSite } from "./use-site";
import { money } from "@/lib/format";

export function useMoney() {
  const site = useSite();
  return (value:number) => site.data ? money(value,site.data.currency) : "…";
}
