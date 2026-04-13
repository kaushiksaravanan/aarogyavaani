/**
 * Site Configuration
 * ------------------
 * Central config for branding, URLs, product positioning, and starter data.
 * Rebrand this template here first.
 */

export const brand = {
  name: "LaunchForge",
  domain: "launchforge.app",
  tagline: "Ship your next AI SaaS in a weekend.",
  description:
    "A premium SaaS starter with landing pages, auth, billing, backend, SEO, and mobile publishing playbooks for founders, indie hackers, and hackathon teams.",
  platforms: ["Supabase", "Clerk", "Paddle"],
  logo: "/logo.png",
  favicon: "/favicon.ico",
};

export const urls = {
  app: "https://app.launchforge.app",
  supportEmail: "support@launchforge.app",
  reportsEmail: "build@launchforge.app",
  demoReport: "/starter",
  heroDemo: "/hero-demo.html",
};

export const social = {
  twitter: { url: "https://x.com/launchforgeapp", label: "X (Twitter)" },
  linkedin: { url: "https://www.linkedin.com/company/launchforge/", label: "LinkedIn" },
};

export const badges = [];

export const legal = {
  entityName: "LaunchForge Labs",
  year: new Date().getFullYear(),
  copyright: `© ${new Date().getFullYear()} LaunchForge. All rights reserved.`,
};

export const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Starter Hub", href: "/starter" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

export const cta = {
  primaryLabel: "Use This Template",
  primaryHref: urls.app,
  secondaryLabel: "Open Starter Hub",
  secondaryHref: urls.demoReport,
};

export const hero = {
  headline: {
    line1: { pre: "", accent: "Launch", post: " your AI SaaS" },
    line2: { pre: "Ship ", accent: "faster", post: " than everyone else" },
  },
  lede: brand.description,
  supporting: `Bring your own stack or start with ${brand.platforms.map((p) => `<strong>${p}</strong>`).join(", ")}.`,
  meta: "Frontend, backend, SEO, auth, billing, and mobile starter included",
  demoTitle: "Sample product workflow demo",
};

export const comparison = {
  painPoints: [
    "Starting from a blank repo the night before demo day",
    "Wasting hours wiring auth, billing, and basic backend plumbing",
    "No polished landing page when judges first see the product",
    "Shipping web only and skipping mobile or store-readiness entirely",
  ],
  benefits: [
    "Premium landing page with reusable content architecture",
    "Auth, billing, database, and AI integration starters",
    "SEO, sitemap, robots, and llms assets out of the box",
    "Android and Play Store publishing playbooks included",
  ],
  withoutLabel: "Without a serious starter",
  withLabel: `With ${brand.name}`,
};

export const howItWorks = {
  steps: [
    {
      number: "01",
      title: "Rebrand the Core",
      body: "Change the product name, domain, hero copy, pricing, and legal defaults from a small set of central files.",
    },
    {
      number: "02",
      title: "Plug In Your Stack",
      body: "Turn on Clerk, Supabase, Paddle, AI providers, and database integrations without rethinking the project structure.",
    },
    {
      number: "03",
      title: "Demo Like You Mean It",
      body: "Ship the landing page, the core workflow, and the mobile publishing path fast enough to focus on winning the room.",
    },
  ],
};

export const features = [
  {
    id: "providers",
    title: "Production-Leaning Stack",
    description:
      `${brand.name} includes starter flows for auth, billing, backend APIs, provider clients, and database integrations so your MVP feels real from day one.`,
    stickyTop: 128,
    minHeight: "31.25rem",
  },
  {
    id: "billing",
    title: "Built-In Go-To-Market",
    description:
      "The starter ships with a premium landing page, route-driven content system, dynamic SEO, sitemap generation, and AI-readable llms assets.",
    stickyTop: 208,
    minHeight: "31.25rem",
  },
  {
    id: "launch-board",
    title: "Backend Starter Included",
    description:
      "FastAPI, provider settings, env handling, health endpoints, and integration modules are already scaffolded so you can move straight to product logic.",
    stickyTop: 288,
    minHeight: "31.25rem",
  },
  {
    id: "copilot",
    title: "Mobile and Publishing Playbooks",
    description:
      "Use Capacitor and the bundled Android publishing guides to turn your SaaS into a mobile app and get it store-ready faster.",
    stickyTop: 128,
    minHeight: "46.25rem",
  },
];

export const useCases = [
  {
    title: "Hackathon Teams",
    badge: "HT",
    emoji: "🏆",
    tagline: "Show polished product taste in hours, not weeks.",
    description:
      "Launch with a landing page, backend, integrations, and a clear demo story instead of burning the event on setup.",
    benefits: ["Faster first demo", "Cleaner architecture", "Judge-friendly polish"],
    href: "/starter",
  },
  {
    title: "Indie Hackers",
    badge: "IH",
    emoji: "🚀",
    tagline: "Move from idea to revenue path quickly.",
    description:
      "Use the starter to validate offers, launch faster, and keep shipping instead of rebuilding boilerplate.",
    benefits: ["Auth + billing starter", "SEO-ready pages", "Reusable growth loops"],
    href: "/resources",
  },
  {
    title: "AI SaaS Founders",
    badge: "AI",
    emoji: "✨",
    tagline: "Bring your model stack and ship a business, not just a demo.",
    description:
      "Wire up providers, auth, storage, payments, and content quickly enough to focus on differentiation.",
    benefits: ["Provider-ready backend", "Flexible frontend starter", "Mobile path included"],
    href: "/starter",
  },
  {
    title: "Agencies & Builders",
    badge: "AG",
    emoji: "🧰",
    tagline: "Reuse the same launch engine across client products.",
    description:
      "Start each new product from a branded, extensible foundation instead of cloning chaos from old repos.",
    benefits: ["Repeatable delivery", "Shared provider patterns", "Faster client launches"],
    href: "/starter",
  },
];

export const useCaseStats = [
  { value: "1 day", label: "To a polished demo-ready foundation" },
  { value: "4", label: "Core SaaS layers already scaffolded" },
  { value: "1 repo", label: "To reuse for every new product" },
];

export const pricingPlans = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: `Best for validating one idea with ${brand.name}`,
    features: ["Landing page starter", "Backend starter", "SEO and llms assets"],
    cta: "Start Free",
    popular: false,
    isFree: true,
  },
  {
    name: "Starter",
    monthlyPrice: 29,
    yearlyPrice: 290,
    description: "For founders building a revenue-ready MVP",
    features: [
      "Auth and billing starters",
      "Supabase and provider integrations",
      "Mobile packaging path",
      "Play Store publishing docs",
      "Growth-ready content architecture",
    ],
    cta: "Use Starter",
    popular: true,
    isFree: false,
  },
  {
    name: "Growth",
    monthlyPrice: 99,
    yearlyPrice: 990,
    description: "For teams turning the template into a real SaaS business",
    features: [
      "Everything in Starter",
      "Expanded provider support",
      "Custom internal content pack",
      "Multi-product reuse",
      "Launch and ops playbooks",
      "White-label client adaptation",
    ],
    cta: "Scale Faster",
    popular: false,
    isFree: false,
  },
];

export const faqItems = [
  {
    question: "What is this starter actually meant for?",
    answer:
      "It is meant to get a polished SaaS off the ground quickly: landing page, content routes, backend starter, auth and billing hooks, SEO assets, and a path to Android publishing.",
  },
  {
    question: "Does it already support Supabase, Clerk, and Paddle?",
    answer:
      `${brand.name} includes starter integration modules and env structure for Supabase, Clerk, Paddle, and related providers. You still need to supply the missing project-specific IDs and public keys before shipping production auth or checkout.`,
  },
  {
    question: "Can I use this for a hackathon and then grow it into a real SaaS?",
    answer:
      "Yes. That is the main goal. The template is designed to start as a fast-moving hackathon base and still leave room for real auth, payments, database-backed features, and SEO growth afterward.",
  },
  {
    question: "Is there a backend or is this only a landing page?",
    answer:
      "There is a FastAPI starter in `backend/` with env loading, provider modules, health endpoints, and example starter routes. You can keep it minimal or replace it with your preferred stack later.",
  },
  {
    question: "Can this turn into a mobile app too?",
    answer:
      "Yes. The template includes Capacitor starter configuration and Android publishing playbooks based on a real Play Console automation workflow.",
  },
  {
    question: "What still needs project-specific setup?",
    answer:
      "Your real domain, product copy, Clerk keys, Supabase URL and anon/service keys, Paddle client token, and any production deployment credentials still need to be filled in for your specific app.",
  },
  {
    question: "Can I commit the secret keys in this repo?",
    answer:
      "No. Keep real secrets in ignored local env files or your deployment platform's secret manager. The template includes ignored local env locations so you can work quickly without poisoning the repo history.",
  },
];

export const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Starter Hub", href: "/starter" },
      { label: "FAQ", href: "/#faq" },
      { label: "Resources", href: "/resources" },
    ],
  },
  {
    title: "Stack",
    links: [
      { label: "Supabase Starter", href: "/stack/supabase" },
      { label: "Clerk Auth", href: "/starter/auth" },
      { label: "Paddle Billing", href: "/starter/billing" },
      { label: "Android Publishing", href: "/starter/mobile" },
    ],
  },
  {
    title: "Launch",
    links: [
      { label: "Hackathon Playbook", href: "/starter" },
      { label: "SEO Content", href: "/resources" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Resources", href: "/resources" },
      { label: "Template Map", href: "/starter" },
      { label: "Starter Docs", href: "/starter" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export const previewTitles = {
  integrations: `app.${brand.domain}/integrations`,
  mail: `app.${brand.domain}/billing`,
  board: `app.${brand.domain}/launch-board`,
  chat: `app.${brand.domain}/copilot`,
};
