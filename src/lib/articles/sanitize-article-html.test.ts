import { describe, expect, it } from "vitest";
import { sanitizeArticleHtml } from "./sanitize-article-html";

describe("sanitizeArticleHtml", () => {
  it("keeps the supported rich-text structure while removing executable markup", () => {
    const sanitized = sanitizeArticleHtml(
      '<h2>Heading</h2><p><strong>Important</strong> text <img src=x onerror="alert(1)"></p><script>alert(1)</script><iframe src="https://evil.example"></iframe>',
    );

    expect(sanitized).toBe("<h2>Heading</h2><p><strong>Important</strong> text </p>");
  });

  it("allows only http, https, and mailto article links", () => {
    const sanitized = sanitizeArticleHtml(
      '<p><a href="https://example.com" target="_blank" onclick="alert(1)">safe</a> <a href="mailto:editor@example.com">mail</a> <a href="javascript:alert(1)">unsafe</a> <a href="/relative">relative</a></p>',
    );

    expect(sanitized).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">safe</a>');
    expect(sanitized).toContain('<a href="mailto:editor@example.com">mail</a>');
    expect(sanitized).not.toContain("javascript:");
    expect(sanitized).not.toContain('href="/relative"');
  });
});
