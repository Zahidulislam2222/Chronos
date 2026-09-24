import { useState } from "react";
import Layout from "@/components/Layout";
import { content, connectedContent } from "@/content";
import { formLimits } from "@/config/forms";
import { isPreview } from "@/config/settings";
import { submitContact } from "@/utils/wordpressApi";
import { ArrowUpRight } from "lucide-react";
export default function Contact() {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
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
            const form = new FormData(e.currentTarget);
            setSending(true);
            try {
              if (isPreview) await navigator.clipboard.writeText(note);
              else await submitContact({name:String(form.get("name")),email:String(form.get("email")),subject:String(form.get("subject")),message:note});
              setStatus(c.success);
              if (!isPreview) setNote("");
            } catch {
              setStatus(c.failure);
            } finally {
              setSending(false);
            }
          }}
        >
          <p>{c.notice}</p>
          {!isPreview && (["name", "email", "subject"] as const).map(field=><div key={field}><label htmlFor={`contact-${field}`}>{connectedContent.fields[field]}</label><input className="w-full border p-3 mb-4" id={`contact-${field}`} name={field} type={field === "email" ? "email" : "text"} required maxLength={field === "subject" ? formLimits.contactSubject : field === "email" ? formLimits.contactEmail : formLimits.contactName} /></div>)}
          <label htmlFor="contact-note">{content.ui.yourNote}</label>
          <textarea
            id="contact-note"
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={7}
            maxLength={formLimits.contactMessage}
            placeholder={content.ui.notePlaceholder}
          />
          <button className="button button-dark" type="submit" disabled={sending}>
            {c.action}
            <ArrowUpRight size={18} />
          </button>
          <p role="status">{status}</p>
        </form>
      </section>
    </Layout>
  );
}
