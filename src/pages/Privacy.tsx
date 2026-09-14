import { useState } from "react";
import { useCart } from "@/context/CartContext";
import Layout from "@/components/Layout";
import { content } from "@/content";
export default function Privacy() {
  const c = content.legal.privacy;
  const { clearCart } = useCart();
  const [cleared, setCleared] = useState(false);
  return (
    <Layout>
      <article className="container legal-page">
        <p className="eyebrow">CHRONOS / PRIVACY</p>
        <h1>{c.title}</h1>
        <p>{c.updated}</p>
        {c.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      <button className="button button-dark" onClick={() => { clearCart(); setCleared(true); }}>{c.clear}</button>
        <p role="status">{cleared ? c.cleared : ""}</p>
        <p><a href={c.contactUrl} rel="noreferrer">{c.contactLabel}</a></p>
        {c.providerLinks.map(link => <p key={link.href}><a href={link.href} rel="noreferrer">{link.label}</a></p>)}
      </article>
    </Layout>
  );
}
