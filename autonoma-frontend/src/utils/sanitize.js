/**
 * ============================================================
 * HTML Sanitization Utility
 * ============================================================
 * Prevents XSS attacks when rendering HTML content
 * (e.g., email bodies, document previews).
 *
 * Usage:
 *   import { sanitizeHTML } from 'utils/sanitize';
 *   <Box dangerouslySetInnerHTML={{ __html: sanitizeHTML(rawHtml) }} />
 */
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string, allowing only safe tags and attributes.
 * @param {string} dirty - Raw HTML string
 * @returns {string} Sanitized HTML string
 */
export const sanitizeHTML = (dirty) => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'b',
      'i',
      'u',
      'em',
      'strong',
      'a',
      'ul',
      'ol',
      'li',
      'table',
      'thead',
      'tbody',
      'tr',
      'td',
      'th',
      'img',
      'div',
      'span',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'pre',
      'code',
      'blockquote',
      'sup',
      'sub',
      'font',
      'center'
    ],
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'class',
      'style',
      'target',
      'width',
      'height',
      'colspan',
      'rowspan',
      'align',
      'valign',
      'color',
      'size',
      'face',
      'border',
      'cellpadding',
      'cellspacing'
    ]
  });
};

export default sanitizeHTML;
