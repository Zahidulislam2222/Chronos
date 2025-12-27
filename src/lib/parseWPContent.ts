// Utility to parse and sanitize WordPress content
// Handles HTML strings from WordPress and replaces backend links

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Parses WordPress HTML content
 * - Sanitizes potentially dangerous scripts
 * - Replaces backend URLs with frontend URLs
 * - Adds proper classes for styling
 */
export function parseWPContent(htmlContent: string): string {
  if (!htmlContent) return '';
  
  let content = htmlContent;
  
  // Remove script tags for security
  content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Replace backend URLs with frontend URLs
  if (API_URL) {
    const backendDomain = new URL(API_URL).origin;
    content = content.replace(new RegExp(backendDomain, 'g'), '');
  }
  
  // Add responsive classes to images
  content = content.replace(
    /<img/g, 
    '<img class="max-w-full h-auto rounded-lg"'
  );
  
  // Style links
  content = content.replace(
    /<a /g,
    '<a class="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors" '
  );
  
  // Style paragraphs
  content = content.replace(
    /<p>/g,
    '<p class="mb-4 leading-relaxed">'
  );
  
  // Style headings
  content = content.replace(/<h2>/g, '<h2 class="font-display text-2xl mt-8 mb-4 text-foreground">');
  content = content.replace(/<h3>/g, '<h3 class="font-display text-xl mt-6 mb-3 text-foreground">');
  content = content.replace(/<h4>/g, '<h4 class="font-display text-lg mt-4 mb-2 text-foreground">');
  
  // Style lists
  content = content.replace(/<ul>/g, '<ul class="list-disc list-inside mb-4 space-y-2">');
  content = content.replace(/<ol>/g, '<ol class="list-decimal list-inside mb-4 space-y-2">');
  
  // Style blockquotes
  content = content.replace(
    /<blockquote>/g,
    '<blockquote class="border-l-4 border-primary pl-6 italic my-6 text-muted-foreground">'
  );
  
  return content;
}

/**
 * Strips HTML tags and returns plain text
 * Useful for meta descriptions and excerpts
 */
export function stripHTML(htmlContent: string): string {
  if (!htmlContent) return '';
  return htmlContent.replace(/<[^>]*>/g, '').trim();
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
