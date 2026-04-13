import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { create } from "xmlbuilder2";
import { sitemapRoutes } from "../src/siteRoutes.js";
import { brand } from "../src/siteConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseUrl = `https://${brand.domain}`;
const publicDir = path.join(__dirname, "..", "public");
const today = new Date().toISOString().split("T")[0];

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const xmlObject = {
  urlset: {
    "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
    url: sitemapRoutes.map((route) => ({
      loc: `${baseUrl}${route.path}`,
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    })),
  },
};

const xml = create(xmlObject).end({ prettyPrint: true });

fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml, "utf8");
console.log("Sitemap generated at public/sitemap.xml");
