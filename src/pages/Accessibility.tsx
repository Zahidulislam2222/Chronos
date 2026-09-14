import Layout from "@/components/Layout";
import { content } from "@/content";
export default function Accessibility() {
  const c = content.legal.accessibility;
  return <Layout><article className="container legal-page"><p className="eyebrow">CHRONOS / ACCESSIBILITY</p><h1>{c.title}</h1>{c.body.map(p => <p key={p}>{p}</p>)}<a className="text-link" href={content.legal.privacy.contactUrl} rel="noreferrer">{content.legal.privacy.contactLabel}</a></article></Layout>;
}
