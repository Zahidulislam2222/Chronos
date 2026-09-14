import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { content } from "@/content";
export default function NotFound() {
  return (
    <Layout>
      <section className="container selection-page">
        <p className="eyebrow">404 / CHRONOS</p>
        <h1>{content.ui.notFound}</h1>
        <p>{content.ui.notFoundText}</p>
        <Link to="/" className="button button-dark">
          {content.ui.home}
        </Link>
      </section>
    </Layout>
  );
}
