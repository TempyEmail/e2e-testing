/**
 * Link extraction utilities for verification and magic links
 */

/**
 * Extract all URLs from text (both plain text and HTML)
 */
export function extractLinks(text: string): string[] {
  // Match URLs in plain text and href attributes
  const urlPattern = /https?:\/\/[^\s<>"]+/gi;
  const hrefPattern = /href=["']([^"']+)["']/gi;

  const urls = new Set<string>();

  // Extract plain URLs
  const plainUrls = text.match(urlPattern);
  if (plainUrls) {
    plainUrls.forEach((url) => urls.add(url.replace(/[.,;!?)]$/, '')));
  }

  // Extract href URLs
  let hrefMatch;
  while ((hrefMatch = hrefPattern.exec(text)) !== null) {
    const url = hrefMatch[1];
    if (url.startsWith('http://') || url.startsWith('https://')) {
      urls.add(url);
    }
  }

  return Array.from(urls);
}

/**
 * Extract a verification or magic link by pattern
 */
export function extractVerificationLink(
  text: string,
  pattern?: RegExp
): string | null {
  const links = extractLinks(text);

  if (!pattern) {
    // Default patterns for common verification links
    const defaultPatterns = [
      /verify/i,
      /confirm/i,
      /activate/i,
      /token=/i,
      /reset/i,
      /magic/i,
    ];

    for (const link of links) {
      if (defaultPatterns.some((p) => p.test(link))) {
        return link;
      }
    }
    return null;
  }

  // Use custom pattern
  for (const link of links) {
    if (pattern.test(link)) {
      return link;
    }
  }

  return null;
}

/**
 * Extract links from a specific domain
 */
export function extractLinksByDomain(text: string, domain: string): string[] {
  const links = extractLinks(text);
  return links.filter((link) => link.toLowerCase().includes(domain.toLowerCase()));
}

/**
 * Extract the first link from text
 */
export function extractFirstLink(text: string): string | null {
  const links = extractLinks(text);
  return links.length > 0 ? links[0] : null;
}
