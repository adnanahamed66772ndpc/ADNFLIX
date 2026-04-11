import DOMPurify from 'dompurify';

/** Sanitize HTML for safe display (e.g. Terms/Privacy from API). Prevents XSS. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}
