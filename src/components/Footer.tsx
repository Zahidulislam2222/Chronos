import { Link } from "react-router-dom";
import { content } from "@/content";
import { isPreview } from "@/config/settings";
import { useSite } from "@/hooks/use-site";
import { navigationSettings } from "@/config/navigation";
export default function Footer() {
  const site = useSite();
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
          <div className="footer-navigation">
            {navigationSettings.footerGroups.map(group => (
              <nav key={group.title} aria-label={group.title}>
                <h2>{group.title}</h2>
                {(group.usePrimaryNavigation ? site.data?.navigation ?? content.nav : group.links)
                  .filter((link, index, links) => links.findIndex(item => item.href === link.href) === index)
                  .map(link => <Link key={link.href} to={link.href}>{link.label}</Link>)}
              </nav>
            ))}
          </div>
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
