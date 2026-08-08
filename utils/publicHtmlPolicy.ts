export const PUBLIC_HTML_ALLOWED_TAGS = [
  'a', 'blockquote', 'br', 'code', 'em', 'h2', 'h3', 'h4', 'hr', 'i', 'li', 'ol', 'p', 'pre', 'strong', 'u', 'ul',
];

export const PUBLIC_HTML_ALLOWED_ATTRIBUTES = ['href'];

export const isAllowedPublicHtmlUri = (value: string) =>
  /^(?:https:|mailto:|\/|#)/i.test(value.trim());

export const PUBLIC_HTML_SANITIZE_OPTIONS = {
  ALLOWED_TAGS: PUBLIC_HTML_ALLOWED_TAGS,
  ALLOWED_ATTR: PUBLIC_HTML_ALLOWED_ATTRIBUTES,
  ALLOWED_URI_REGEXP: /^(?:https:|mailto:|\/|#)/i,
  FORBID_TAGS: ['button', 'embed', 'form', 'iframe', 'input', 'object', 'script', 'style'],
};
