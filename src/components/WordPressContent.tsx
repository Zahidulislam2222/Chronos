import { wordpressHtml } from "@/lib/wordpress";

export default function WordPressContent({ html }: { html: string }) {
  return <div className="wordpress-content" dangerouslySetInnerHTML={{ __html: wordpressHtml(html) }} />;
}
