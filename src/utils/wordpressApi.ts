import { z } from "zod";
import { settings, isPreview } from "@/config/settings";
import { content } from "@/content";
import { wordpressLink } from "@/lib/wordpress";
import { usableAuthToken, rejectAuthToken, SIGN_IN_AGAIN } from "@/utils/authToken";

export class WordPressError extends Error {
  constructor(message:string,public code:string,public status=0) { super(message); }
}

export async function wordpressRequest(path: string, init?: RequestInit) {
  if (isPreview || !settings.wpApiUrl) throw new Error("WordPress is not connected.");
  const response = await fetch(`${settings.wpApiUrl}/wp-json/${path}`, {
    ...init, signal: AbortSignal.timeout(settings.requestTimeoutMs),
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (response.status === 404 && !init?.method && path.startsWith("chronos/v1/page?")) return null;
  const body = await response.json();
  if (!response.ok) throw new WordPressError(body.message || "WordPress request failed.",body.code || "request_failed",response.status);
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
  const token = usableAuthToken();
  if (!token) throw new Error(SIGN_IN_AGAIN);
  return wordpressRequest(path,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
    .catch((error:unknown)=>{
      // Sign out only for the token that was refused, never a newer one.
      if (error instanceof WordPressError && error.status === 401) rejectAuthToken(token);
      throw error;
    });
}
