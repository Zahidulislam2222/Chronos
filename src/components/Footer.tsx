import { Link } from "react-router-dom";
import { content } from "@/content";
import { isPreview } from "@/config/settings";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link to="/" className="wordmark">
              {content.brand.name}
            </Link>
            <p>{content.footer.intro}</p>
          </div>
          <nav aria-label="Footer navigation">
            {[...content.nav, ...content.footer.links].map((n) => (
              <Link key={n.href} to={n.href}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="footer-bottom">
          <span>{content.footer.copyright}</span>
          <span>{content.footer.note}</span>
          {isPreview && (
            <span className="preview-label">
              <i />
              {content.preview.label}
            </span>
          )}
        </div>
        {isPreview && (
          <p className="preview-notice">{content.preview.notice}</p>
        )}
      </div>
    </footer>
  );
}
