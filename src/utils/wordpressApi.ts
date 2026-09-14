import { z } from "zod";
import { settings, isPreview } from "@/config/settings";
import { content } from "@/content";
import { wordpressLink } from "@/lib/wordpress";

export class WordPressError extends Error {
  constructor(message:string,public code:string) { super(message); }
}

export async function wordpressRequest(path: string, init?: RequestInit) {
  if (isPreview || !settings.wpApiUrl) throw new Error("WordPress is not connected.");
  const response = await fetch(`${settings.wpApiUrl}/wp-json/${path}`, {
    ...init, signal: AbortSignal.timeout(settings.requestTimeoutMs),
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (response.status === 404 && !init?.method && path.startsWith("chronos/v1/page?")) return null;
  const body = await response.json();
  if (response.status === 401) window.dispatchEvent(new Event("chronos-auth-expired"));
  if (!response.ok) throw new WordPressError(body.message || "WordPress request failed.",body.code || "request_failed");
  return body;
}

export const siteSchema = z.object({ navigation: z.array(z.object({label: z.string(), href: z.string(), parent: z.number(), id: z.number()})), pages: z.array(z.object({id:z.number(),title:z.string(),uri:z.string(),url:z.string()})), currency:z.string(),testMode:z.boolean() });
export async function fetchSite() {
  if (isPreview) return { navigation: content.nav.map((n,i)=>({...n,parent:0,id:i})), pages: [], currency:content.brand.currency,testMode:true };
  const body = await wordpressRequest("chronos/v1/site");
  const site = siteSchema.parse(body?.data);
  return {...site, navigation:site.navigation.map(n=>({...n,href:wordpressLink(n.href)}))};
}

export const pageSchema = z.object({id:z.number(),title:z.string(),uri:z.string(),content:z.string(),url:z.string(),type:z.string()});
export async function fetchPage(uri: string) {
  if (isPreview) return null;
  const body = await wordpressRequest(`chronos/v1/page?uri=${encodeURIComponent(uri)}`);
  return body ? pageSchema.parse(body.data) : null;
}

export async function submitContact(input: {name:string;email:string;subject:string;message:string}) {
  const body = await wordpressRequest("chronos/v1/contact", {method:"POST",body:JSON.stringify(input)});
  return z.object({success:z.literal(true),data:z.object({id:z.number().int().positive()})}).parse(body);
}

export function authenticatedRequest(path:string, body:unknown) {
  let token: string | null = null;
  try { token = localStorage.getItem("auth-token"); } catch { /* Require an available authenticated session. */ }
  if (!token) throw new Error("Please sign in again.");
  return wordpressRequest(path,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
}
