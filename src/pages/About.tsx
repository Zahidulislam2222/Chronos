import Media from "@/components/Media";
import Layout from "@/components/Layout";
import Newsletter from "@/components/Newsletter";
import { content } from "@/content";
import Reveal from "@/components/Reveal";
export default function About() {
  const c = content.about;
  return (
    <Layout>
      <div className="container page-intro">
        <p className="eyebrow">{c.eyebrow}</p>
        <h1>{c.title}</h1>
        <p>{c.intro}</p>
      </div>
      <section className="container about-grid">
        <div className="about-image">
          <Media
            src={c.image}
            alt="The Meridian, an original rose-tone concept"
          />
        </div>
        <Reveal className="prose-copy">
          <p className="eyebrow">THE CHRONOS APPROACH</p>
          <h2>{c.heading}</h2>
          {c.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Reveal>
      </section>
      <Newsletter />
    </Layout>
  );
}
