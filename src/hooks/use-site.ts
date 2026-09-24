import { useQuery } from "@tanstack/react-query";
import { fetchSite } from "@/utils/wordpressApi";

export function useSite() {
  return useQuery({queryKey:["wordpress-site"],queryFn:fetchSite});
}
