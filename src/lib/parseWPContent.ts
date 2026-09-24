import { wordpressHtml, wordpressText } from '@/lib/wordpress';
// Utility to parse and sanitize WordPress content
// Sanitizing and backend link/media rewriting are delegated to the DOMPurify
// helpers in wordpress.ts; regular expressions are not a safe HTML sanitizer.

const CONTENT_CLASSES: Record<string, string> = {
  img: 'max-w-full h-auto rounded-lg',
  a: 'text-primary hover:text-primary/80 underline underline-offset-4 transition-colors',
  p: 'mb-4 leading-relaxed',
  h2: 'font-display text-2xl mt-8 mb-4 text-foreground',
  h3: 'font-display text-xl mt-6 mb-3 text-foreground',
  h4: 'font-display text-lg mt-4 mb-2 text-foreground',
  ul: 'list-disc list-inside mb-4 space-y-2',
  ol: 'list-decimal list-inside mb-4 space-y-2',
  blockquote: 'border-l-4 border-primary pl-6 italic my-6 text-muted-foreground',
};

/**
 * Parses WordPress HTML content
 * - Sanitizes it with DOMPurify (scripts, event handlers, unsafe URLs)
 * - Rewrites backend links and media URLs
 * - Adds proper classes for styling
 */
export function parseWPContent(htmlContent: string): string {
  if (!htmlContent) return '';

  const template = document.createElement('template');
  template.innerHTML = wordpressHtml(htmlContent);

  for (const [tag, className] of Object.entries(CONTENT_CLASSES)) {
    template.content.querySelectorAll(tag).forEach(el => el.classList.add(...className.split(' ')));
  }

  return template.innerHTML;
}

/**
 * Strips HTML tags and returns plain text
 * Useful for meta descriptions and excerpts
 * Entities are decoded, so the result is text only: never insert it as HTML.
 */
export function stripHTML(htmlContent: string): string {
  if (!htmlContent) return '';
  return wordpressText(htmlContent).trim();
}

/**
 * Truncates text to specified length
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Formats price with currency
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formats date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
