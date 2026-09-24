import Layout from "@/components/Layout";
import { content } from "@/content";
export default function Terms() {
  const c = content.legal.terms;
  return (
    <Layout>
      <article className="container legal-page">
        <p className="eyebrow">CHRONOS / TERMS</p>
        <h1>{c.title}</h1>
        {c.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </article>
    </Layout>
  );
}
