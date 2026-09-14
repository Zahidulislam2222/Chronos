import { wordpressHtml } from "@/lib/wordpress";

export default function WordPressContent({ html }: { html: string }) {
  return <div className="wordpress-content prose max-w-none" dangerouslySetInnerHTML={{ __html: wordpressHtml(html) }} />;
}
