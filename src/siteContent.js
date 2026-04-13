import { brand, urls, legal, social } from "./siteConfig.js";

export const companyPages = {
  about: {
    metaTitle: `About ${brand.name}`,
    title: `About ${brand.name}`,
    description: `Why ${brand.name} exists and who it is for.`,
    eyebrow: "Company",
    actions: false,
    lead: `${brand.name} helps founders, hackathon teams, and indie builders launch real SaaS products faster by starting from a polished, extensible foundation.`,
    sections: [
      {
        title: "Why it exists",
        paragraphs: [
          "Most product teams lose their best early momentum to setup work. They burn time rebuilding auth, billing, landing pages, backend scaffolding, and SEO instead of getting to the one flow that matters.",
          `${brand.name} exists to compress that setup time into a reusable starting point so builders can focus on the part that actually wins: a sharp product, a memorable demo, and a credible path to revenue.`,
        ],
      },
      {
        title: "Who it is for",
        bullets: [
          "Hackathon teams that need a polished demo fast",
          "Indie hackers building their next 10k MRR SaaS",
          "Agencies and product studios reusing the same launch engine",
          "AI product founders who want auth, billing, backend, and SEO ready from day one",
        ],
      },
      {
        title: "What is included",
        bullets: [
          "Premium landing page system",
          "Route-driven content architecture",
          "FastAPI backend starter",
          "Supabase, Clerk, and Paddle starter modules",
          "SEO assets including robots, sitemap, and llms.txt",
          "Android and Play Store publishing playbooks",
        ],
      },
    ],
  },
  contact: {
    metaTitle: `Contact ${brand.name}`,
    title: "Contact us",
    description: `How to contact ${brand.name}.`,
    eyebrow: "Company",
    actions: false,
    lead: "Need help rebranding the starter, wiring a provider, or planning your launch flow? Reach out.",
    sections: [
      {
        title: "Support",
        paragraphs: [`Email us at ${urls.supportEmail}.`],
        bullets: [urls.supportEmail],
      },
      {
        title: "Social",
        bullets: [`X (Twitter): ${social.twitter.url}`, `LinkedIn: ${social.linkedin.url}`],
      },
      {
        title: "Entity",
        paragraphs: [legal.entityName],
      },
    ],
  },
};

export const legalPages = {
  policy: {
    metaTitle: `Privacy Policy | ${brand.name}`,
    title: "Privacy Policy",
    description: `Privacy policy for ${brand.name}.`,
    eyebrow: "Legal",
    actions: false,
    lead: `${brand.name} is a reusable starter and may be customized by downstream builders. This policy describes the default privacy posture of the template itself.`,
    sections: [
      {
        title: "What the starter collects by default",
        bullets: [
          "Basic website analytics only if the builder enables a provider",
          "Form submissions only if the builder adds a backend workflow",
          "Authentication data only if the builder enables an auth provider such as Clerk or Supabase",
        ],
      },
      {
        title: "Third-party providers",
        paragraphs: [
          "This starter includes integration points for third-party services such as Supabase, Clerk, Paddle, Neon, and model providers. The final privacy behavior depends on which services the builder enables.",
        ],
      },
      {
        title: "Builder responsibility",
        paragraphs: [
          "If you use this template for a real product, you must review and replace this policy with one that accurately describes your production setup, data collection, retention, and sharing practices.",
        ],
      },
      {
        title: "Contact",
        bullets: [`Support email: ${urls.supportEmail}`],
      },
    ],
  },
  terms: {
    metaTitle: `Terms of Service | ${brand.name}`,
    title: "Terms of Service",
    description: `Terms of service for ${brand.name}.`,
    eyebrow: "Legal",
    actions: false,
    lead: `${brand.name} is delivered as a starter foundation. Builders are responsible for adapting it for production use.`,
    sections: [
      {
        title: "Template scope",
        bullets: [
          "The starter includes frontend, backend, SEO, provider scaffolding, and documentation.",
          "Not every included integration is enabled or production-ready by default.",
          "Builders are responsible for testing and validating their final product behavior.",
        ],
      },
      {
        title: "Providers and billing",
        paragraphs: [
          "The starter includes support for external services such as Paddle, Clerk, Supabase, Neon, Tinybird, and model providers. Your use of those services remains subject to their own terms, pricing, and policies.",
        ],
      },
      {
        title: "No warranty",
        paragraphs: [
          "This template is provided as-is. Builders must review security, legal, billing, privacy, and platform compliance requirements before launching a production app.",
        ],
      },
      {
        title: "Contact",
        bullets: [`Support email: ${urls.supportEmail}`],
      },
    ],
  },
};

export const toolPages = {
  supabase: {
    metaTitle: `Supabase Starter | ${brand.name}`,
    title: "Supabase Starter Integration",
    description: "Use Supabase for auth, storage, database, and realtime features.",
    eyebrow: "Stack",
    lead: "Launch with a Postgres-backed product faster by starting from an opinionated integration point.",
    sections: [
      {
        title: "What the starter gives you",
        bullets: [
          "Frontend Supabase client",
          "Backend env mapping",
          "Provider status endpoints",
          "A clear place to add auth, storage, and row-level security patterns",
        ],
      },
      {
        title: "What you still need",
        bullets: [
          "Project URL and anon key",
          "Schema design",
          "RLS policies",
          "Production data model and access control",
        ],
      },
    ],
    finalCta: {
      title: "Build your stack on a stronger base",
      description: "Use the template, connect Supabase, and ship the core workflow first.",
      ctaLabel: "Use This Template",
      ctaHref: `${urls.app}/`,
      secondaryLabel: "Open Starter Hub",
      secondaryHref: "/starter",
    },
  },
  clerk: {
    metaTitle: `Clerk Auth Starter | ${brand.name}`,
    title: "Clerk Auth Starter",
    description: "Add authentication quickly with a clean integration surface.",
    eyebrow: "Stack",
    lead: "Use Clerk when speed, polished auth UX, and hosted identity flows matter more than building auth yourself.",
    sections: [
      {
        title: "Included in the starter",
        bullets: [
          "Client-side config helper",
          "Env conventions for auth routes",
          "Template-safe place to add sign-in and sign-up pages",
        ],
      },
      {
        title: "Recommended first move",
        paragraphs: [
          "Wire sign-in and sign-up into one meaningful protected workflow, not the whole product at once.",
        ],
      },
    ],
  },
  paddle: {
    metaTitle: `Paddle Billing Starter | ${brand.name}`,
    title: "Paddle Billing Starter",
    description: "Start with hosted billing and upgrade paths quickly.",
    eyebrow: "Stack",
    lead: "Billing is one of the first places founders lose momentum. The starter gives you a safe place to plug it in without making pricing logic your first engineering problem.",
    sections: [
      {
        title: "Included in the starter",
        bullets: [
          "Frontend config helper",
          "Backend env placeholders",
          "Pricing-first content and CTA surfaces",
        ],
      },
      {
        title: "Before going live",
        bullets: [
          "Verify live environment settings",
          "Replace demo pricing copy",
          "Add webhook handling and subscription state sync",
        ],
      },
    ],
  },
};

export const useCasePages = {
  hackathons: {
    metaTitle: `Hackathon Starter | ${brand.name}`,
    title: "Hackathon Starter",
    description: "How to use this template to move fast and still look polished.",
    eyebrow: "Use Case",
    lead: "Win by making the product feel real early: a great first impression, one strong workflow, and a clear story.",
    sections: [
      {
        title: "Best build order",
        bullets: [
          "Brand the landing page",
          "Implement one wow workflow",
          "Add one backend endpoint",
          "Capture proof or metrics",
          "Tighten the demo narrative",
        ],
      },
      {
        title: "Common mistake",
        paragraphs: [
          "Teams often overbuild infrastructure and underbuild the one flow judges actually see.",
        ],
      },
    ],
  },
  "10k-mrr-saas": {
    metaTitle: `10k MRR SaaS Starter | ${brand.name}`,
    title: "Use the starter for a 10k MRR SaaS path",
    description: "How to turn the template into a monetizable product foundation.",
    eyebrow: "Use Case",
    lead: "The starter will not create revenue by itself, but it reduces the time between product idea and revenue-capable product surface.",
    sections: [
      {
        title: "What matters most",
        bullets: [
          "One painful problem",
          "One clear ICP",
          "One upgrade reason",
          "One measurable outcome",
          "A fast feedback loop",
        ],
      },
      {
        title: "Starter leverage",
        paragraphs: [
          "Use the landing page, auth, billing, backend, and SEO foundations to focus your effort on the part that creates willingness to pay.",
        ],
      },
    ],
  },
};

export const alternativePages = {
  "blank-repo": {
    metaTitle: `Why not start from a blank repo? | ${brand.name}`,
    title: "Why not start from a blank repo?",
    description: "A reusable starter wins when speed, polish, and repeatability matter.",
    eyebrow: "Compare",
    lead: "Starting from zero feels flexible until you spend the best part of the build recreating the same foundations again.",
    sections: [
      {
        title: "Blank repo tradeoffs",
        bullets: [
          "Maximum freedom",
          "Maximum setup drag",
          "Easy to lose product momentum",
          "Harder to keep a consistent launch quality bar",
        ],
      },
      {
        title: `${brand.name} tradeoffs`,
        bullets: [
          "Faster visible progress",
          "Opinionated defaults",
          "Less wheel reinvention",
          "Still enough flexibility for real products",
        ],
      },
    ],
  },
};

export const blogPosts = {
  "hackathon-saas-launch-checklist": {
    metaTitle: `Hackathon SaaS Launch Checklist | ${brand.name}`,
    title: "Hackathon SaaS Launch Checklist",
    excerpt: "The fastest route from idea to polished demo: brand, flow, backend, proof, and delivery.",
    lead: "If you only have one or two days, your best weapon is ruthless focus paired with a product that already looks credible.",
    date: "Apr 2026",
    readTime: "6 min read",
    sections: [
      {
        title: "Start with the visible layer",
        paragraphs: [
          "The first thing judges and users see is not your architecture. It is the homepage, the onboarding flow, and whether the product looks trustworthy.",
        ],
      },
      {
        title: "Build one magical path",
        bullets: [
          "The problem entering the product",
          "The product solving it in one flow",
          "A clear action or outcome",
        ],
      },
    ],
  },
  "how-to-turn-a-template-into-a-real-saas": {
    metaTitle: `How to Turn a Template into a Real SaaS | ${brand.name}`,
    title: "How to Turn a Template into a Real SaaS",
    excerpt: "Use the starter as leverage, not as a crutch.",
    lead: "Templates work best when they remove setup drag and leave you more time for differentiation.",
    date: "Apr 2026",
    readTime: "7 min read",
    sections: [
      {
        title: "Do not stop at the starter",
        paragraphs: [
          "A template can accelerate trust, clarity, and structure, but it only becomes a business when you add unique value, feedback loops, and monetizable outcomes.",
        ],
      },
    ],
  },
};

export const checklistPages = {
  "launch-ready-saas-checklist": {
    metaTitle: `Launch-Ready SaaS Checklist | ${brand.name}`,
    title: "Launch-Ready SaaS Checklist",
    excerpt: "A practical checklist for shipping a credible SaaS launch.",
    count: "24-point checklist",
    lead: "Use this checklist before demo day or launch day.",
    sections: [
      {
        title: "Brand and messaging",
        bullets: [
          "Headline explains the product clearly",
          "Primary CTA is obvious",
          "Domain, support email, and legal pages are updated",
        ],
      },
      {
        title: "Product and delivery",
        bullets: [
          "One core workflow is fully demoable",
          "Backend health endpoint works",
          "Provider env vars are set locally",
          "Build succeeds cleanly",
        ],
      },
    ],
  },
};

export const templatePages = {
  "founder-demo-script-template": {
    metaTitle: `Founder Demo Script Template | ${brand.name}`,
    title: "Founder Demo Script Template",
    excerpt: "A clean structure for demoing your product to judges, users, or investors.",
    count: "Template",
    whenToUse: "Use this when you need to explain the product clearly under time pressure.",
    sections: [
      {
        title: "Demo structure",
        bullets: [
          "State the problem in one sentence",
          "Show the user entering the product",
          "Show the key transformation",
          "Close with outcome and why it matters",
        ],
      },
    ],
  },
  "privacy-policy-template-for-saas": {
    metaTitle: `Privacy Policy Template for SaaS | ${brand.name}`,
    title: "Privacy Policy Template for SaaS",
    excerpt: "A starter structure for documenting data collection and provider usage.",
    count: "Template",
    whenToUse: "Use when adapting the starter into a real production product.",
    sections: [
      {
        title: "Include these sections",
        bullets: [
          "What data you collect",
          "Why you collect it",
          "Which providers receive it",
          "Retention and deletion",
          "How users can contact you",
        ],
      },
    ],
  },
};

export const glossaryPages = {
  mvp: {
    metaTitle: `MVP Definition | ${brand.name}`,
    title: "MVP",
    excerpt: "The smallest version of a product that proves the thing worth proving.",
    count: "Glossary",
    sections: [
      {
        title: "Definition",
        paragraphs: [
          "An MVP is not the smallest product you can build. It is the smallest product that can test your core value proposition with real users.",
        ],
      },
    ],
  },
  icp: {
    metaTitle: `ICP Definition | ${brand.name}`,
    title: "ICP",
    excerpt: "The ideal customer profile for the product you are trying to sell.",
    count: "Glossary",
    sections: [
      {
        title: "Definition",
        paragraphs: [
          "Your ICP is the user or buyer most likely to understand the product quickly, adopt it, and pay for it.",
        ],
      },
    ],
  },
};
