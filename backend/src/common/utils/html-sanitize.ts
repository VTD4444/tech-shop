import sanitizeHtml from 'sanitize-html';
import { UploadService } from '../../modules/upload/upload.service';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3', 'a', 'img'];

export function sanitizeLongDescription(html: string | null | undefined): string | null {
  if (!html?.trim()) return null;

  const cleaned = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt'],
    },
    allowedSchemes: ['http', 'https'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
      img: (tagName, attribs) => {
        const src = attribs.src || '';
        if (src.startsWith('data:') || !UploadService.isAllowedImageUrl(src)) {
          return { tagName: 'span', attribs: {} as Record<string, string> };
        }
        return { tagName, attribs: { src, alt: attribs.alt || '' } };
      },
    },
  });

  return cleaned.trim() || null;
}

export function sanitizePlainText(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
}
