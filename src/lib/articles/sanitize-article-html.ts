import sanitizeHtml from "sanitize-html";

const ARTICLE_HTML_ALLOWLIST: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "s",
    "code",
    "pre",
    "blockquote",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "hr",
    "a",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href"],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attributes) => {
      const { href, target } = attributes;
      const rest = { ...attributes };
      delete rest.href;
      delete rest.target;
      delete rest.rel;
      const hasSafeHref = typeof href === "string" && isSafeArticleLink(href);

      return {
        tagName,
        attribs: {
          ...rest,
          ...(hasSafeHref ? { href } : {}),
          ...(hasSafeHref && target === "_blank" ? { target, rel: "noopener noreferrer" } : {}),
        },
      };
    },
  },
};

function isSafeArticleLink(value: string) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:" || protocol === "mailto:";
  } catch {
    return false;
  }
}

/**
 * Sanitizes editor-produced Article HTML before it enters the database.
 *
 * This module is deliberately server-only. Article forms never receive an API
 * key or a browser-write path to the table.
 */
export function sanitizeArticleHtml(value: string): string {
  return sanitizeHtml(value, ARTICLE_HTML_ALLOWLIST);
}
