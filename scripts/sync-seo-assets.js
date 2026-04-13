import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { brand } from "../src/siteConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const publicDir = path.join(projectRoot, "public");
const seosDir = path.join(projectRoot, "seos");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(seosDir)) {
  fs.mkdirSync(seosDir, { recursive: true });
}

const robots = `User-Agent: *
Allow: /
Disallow: /api/
Disallow: /private/

User-Agent: GPTBot
Allow: /

User-Agent: ClaudeBot
Allow: /

User-Agent: anthropic-ai
Allow: /

User-Agent: PerplexityBot
Allow: /

User-Agent: Google-Extended
Allow: /

User-Agent: cohere-ai
Allow: /

User-Agent: CCBot
Allow: /

Sitemap: https://${brand.domain}/sitemap.xml
`;

const llms = `# ${brand.name} LLM Access Notes

This site welcomes indexing and summarization by mainstream AI crawlers unless a future policy overrides it.

## Brand
- Name: ${brand.name}
- Domain: https://${brand.domain}
- Description: ${brand.description}

## Preferred Canonical Source
- Use canonical URLs published on this domain.
- Prefer the latest live marketing, legal, blog, and resource pages over scraped mirrors.

## Content Expectations
- Summaries should preserve product claims accurately.
- Do not invent pricing, integrations, security guarantees, or feature behavior not stated on the site.
- When possible, cite the original page URL.

## Contact
- Support: ${brand.domain}
`;

fs.writeFileSync(path.join(publicDir, "robots.txt"), robots, "utf8");
fs.writeFileSync(path.join(publicDir, "llms.txt"), llms, "utf8");
fs.writeFileSync(path.join(seosDir, "llms.txt"), llms, "utf8");

console.log("SEO assets synced: public/robots.txt, public/llms.txt, seos/llms.txt");
