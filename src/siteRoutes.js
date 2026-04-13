import {
  companyPages,
  legalPages,
  toolPages,
  useCasePages,
  alternativePages,
  blogPosts,
  checklistPages,
  templatePages,
  glossaryPages,
} from "./siteContent.js";

export function withRouteMeta(collection, basePath) {
  return Object.entries(collection).reduce((accumulator, [slug, page]) => {
    accumulator[slug] = { ...page, slug, path: `${basePath}/${slug}` };
    return accumulator;
  }, {});
}

export const blogPostMap = withRouteMeta(blogPosts, "/blog");
export const checklistPageMap = withRouteMeta(checklistPages, "/resources/checklists");
export const templatePageMap = withRouteMeta(templatePages, "/resources/templates");
export const glossaryPageMap = withRouteMeta(glossaryPages, "/resources/glossary");

const blogIndexOrder = [
  "hackathon-saas-launch-checklist",
  "how-to-turn-a-template-into-a-real-saas",
];

const orderedBlogPosts = blogIndexOrder.map((slug) => blogPostMap[slug]).filter(Boolean);

export const blogIndexPosts = [
  ...orderedBlogPosts,
  ...Object.values(blogPostMap).filter((post) => !blogIndexOrder.includes(post.slug)),
];

function createCollectionRoutes(collection, basePath, changefreq, priority) {
  return Object.keys(collection).map((slug) => ({
    path: `${basePath}/${slug}`,
    changefreq,
    priority,
  }));
}

export const sitemapRoutes = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/starter", changefreq: "weekly", priority: "0.95" },
  { path: "/starter/auth", changefreq: "monthly", priority: "0.75" },
  { path: "/starter/billing", changefreq: "monthly", priority: "0.75" },
  { path: "/starter/providers", changefreq: "weekly", priority: "0.7" },
  { path: "/starter/mobile", changefreq: "monthly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/policy", changefreq: "yearly", priority: "0.4" },
  { path: "/terms", changefreq: "yearly", priority: "0.4" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.4" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/resources", changefreq: "weekly", priority: "0.8" },
  ...createCollectionRoutes(toolPages, "/stack", "monthly", "0.8"),
  ...createCollectionRoutes(useCasePages, "/use-case", "monthly", "0.75"),
  ...createCollectionRoutes(alternativePages, "/alternative", "monthly", "0.7"),
  ...Object.values(blogPostMap).map((post) => ({
    path: post.path,
    changefreq: "monthly",
    priority: "0.7",
  })),
  ...Object.values(checklistPageMap).map((page) => ({
    path: page.path,
    changefreq: "monthly",
    priority: "0.7",
  })),
  ...Object.values(templatePageMap).map((page) => ({
    path: page.path,
    changefreq: "monthly",
    priority: "0.7",
  })),
  ...Object.values(glossaryPageMap).map((page) => ({
    path: page.path,
    changefreq: "monthly",
    priority: "0.65",
  })),
];

export const routeCollections = {
  companyPages,
  legalPages,
  toolPages,
  useCasePages,
  alternativePages,
  blogPosts,
  checklistPages,
  templatePages,
  glossaryPages,
};
