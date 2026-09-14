import {lazy, Suspense} from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
const ConnectedAccount = lazy(() => import("./ConnectedAccount"));
import { isPreview } from "@/config/settings";
import { content } from "@/content";
export default function Account() {
  if (!isPreview) return <Suspense fallback={<p role="status">{content.ui.loading}</p>}><ConnectedAccount /></Suspense>;
  return (
    <Layout>
      <section className="container selection-page">
        <p className="eyebrow">{content.preview.label}</p>
        <h1>{content.preview.accountTitle}</h1>
        <p>{content.preview.accountDescription}</p>
        <Link to="/cart" className="button button-dark">
          {content.ui.bag}
        </Link>
      </section>
    </Layout>
  );
}
