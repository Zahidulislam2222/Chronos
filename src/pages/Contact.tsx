import { useState } from "react";
import Layout from "@/components/Layout";
import { content } from "@/content";
import { ArrowUpRight } from "lucide-react";
export default function Contact() {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const c = content.contact;
  return (
    <Layout>
      <section className="container contact-grid">
        <div>
          <p className="eyebrow">{c.eyebrow}</p>
          <h1>
            {c.title}
            <em>{c.italic}</em>
          </h1>
          <p>{c.description}</p>
          <a className="text-link" href={content.legal.privacy.contactUrl} rel="noreferrer">{content.legal.privacy.contactLabel}</a>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await navigator.clipboard.writeText(note);
              setStatus(c.success);
            } catch {
              setStatus(c.failure);
            }
          }}
        >
          <p>{c.notice}</p>
          <label htmlFor="contact-note">{content.ui.yourNote}</label>
          <textarea
            id="contact-note"
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={7}
            placeholder={content.ui.notePlaceholder}
          />
          <button className="button button-dark" type="submit">
            {c.action}
            <ArrowUpRight size={18} />
          </button>
          <p role="status">{status}</p>
        </form>
      </section>
    </Layout>
  );
}
