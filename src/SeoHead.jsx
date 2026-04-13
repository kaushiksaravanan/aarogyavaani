import { useEffect } from "react";
import { brand } from "./siteConfig.js";

/**
 * SEO Head Component
 * Updates document <head> with Open Graph, Twitter Card, and canonical
 * meta tags for SPA routes. Call this from any page component.
 *
 * Usage:
 *   <SeoHead title="About" description="About us page" path="/about" />
 */
export default function SeoHead({ title, description, path, type = "website", image, appendBrand = true }) {
  useEffect(() => {
    const fullTitle = title ? (appendBrand ? `${title} | ${brand.domain}` : title) : brand.domain;
    const ogImage = image ?? brand.logo;
    const canonicalUrl = path ? `https://${brand.domain}${path}` : `https://${brand.domain}`;

    document.title = fullTitle;

    const setMeta = (selector, attribute, value) => {
      let element = document.querySelector(selector);

      if (!element && value) {
        element = document.createElement("meta");
        const attrParts = selector.match(/\[([^=]+)="([^"]+)"\]/);

        if (attrParts) {
          element.setAttribute(attrParts[1], attrParts[2]);
        }

        document.head.appendChild(element);
      }

      if (element) {
        element.setAttribute(attribute, value ?? "");
      }
    };

    // Standard meta
    setMeta('meta[name="description"]', "content", description ?? brand.description);

    // Open Graph
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", description ?? brand.description);
    setMeta('meta[property="og:type"]', "content", type);
    setMeta('meta[property="og:image"]', "content", ogImage);
    setMeta('meta[property="og:url"]', "content", canonicalUrl);

    // Twitter Card
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", description ?? brand.description);
    setMeta('meta[name="twitter:image"]', "content", ogImage);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }

    canonical.setAttribute("href", canonicalUrl);

    let llms = document.querySelector('link[rel="alternate"][type="text/plain"][title="LLMs"]');

    if (!llms) {
      llms = document.createElement("link");
      llms.setAttribute("rel", "alternate");
      llms.setAttribute("type", "text/plain");
      llms.setAttribute("title", "LLMs");
      document.head.appendChild(llms);
    }

    llms.setAttribute("href", "/llms.txt");
  }, [title, description, path, type, image, appendBrand]);

  return null;
}
