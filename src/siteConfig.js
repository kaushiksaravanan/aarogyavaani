/**
 * Site Configuration
 * ------------------
 * Central config for branding, URLs, content, and metadata.
 * To rebrand this template for a new product, edit THIS file only.
 *
 * All components pull their product name, URLs, colors, content,
 * and metadata from this single source of truth.
 */

// ─── Branding ────────────────────────────────────────────────
export const brand = {
  /** Display name of the product (used in headings, nav, footer) */
  name: "Gitmore",
  /** Domain shown in nav/footer (without protocol) */
  domain: "gitmore.io",
  /** One-line tagline */
  tagline: "Automated reporting and insights for your engineering team.",
  /** Longer description for SEO / hero */
  description:
    "Turns your commits and PRs into clear team updates delivered daily or weekly to Slack or email.",
  /** Platforms supported (shown in hero) */
  platforms: ["GitHub", "GitLab", "Bitbucket"],
  /** Logo path (relative to public/) */
  logo: "/logo.png",
  /** Favicon path */
  favicon: "/favicon.ico",
};

// ─── URLs ────────────────────────────────────────────────────
export const urls = {
  /** Main app URL (CTA target) */
  app: "https://app.gitmore.io",
  /** Support email */
  supportEmail: "support@gitmore.io",
  /** Reports sender email (shown in email preview) */
  reportsEmail: "reports@gitmore.io",
  /** Demo report page */
  demoReport: "/example.html",
  /** Hero demo iframe */
  heroDemo: "/hero-demo.html",
};

// ─── Social Links ────────────────────────────────────────────
export const social = {
  twitter: { url: "https://x.com/gitmore_io", label: "X (Twitter)" },
  linkedin: {
    url: "https://www.linkedin.com/company/gitmore/",
    label: "LinkedIn",
  },
};

// ─── Badges / Social Proof ───────────────────────────────────
export const badges = [
  {
    alt: `${brand.name} on Product Hunt`,
    href: "https://www.producthunt.com/products/gitmore?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-gitmore",
    src: "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1006218&theme=neutral",
  },
  {
    alt: `${brand.name} on Peerlist`,
    href: "https://peerlist.io/hamaabidi/project/gitmore",
    src: "https://dqy38fnwh4fqs.cloudfront.net/website/project-spotlight/project-week-rank-three-light.svg",
  },
  {
    alt: `${brand.name} on SaaSHub`,
    href: "https://www.saashub.com/gitmore?utm_source=badge&utm_campaign=badge&utm_content=gitmore&badge_variant=color&badge_kind=approved",
    src: "https://cdn-b.saashub.com/img/badges/approved-color.png?v=1",
  },
];

// ─── Legal Entity ────────────────────────────────────────────
export const legal = {
  entityName: "Gitmore Ltd",
  year: new Date().getFullYear(),
  copyright: `© ${new Date().getFullYear()} Gitmore. All rights reserved.`,
};

// ─── Navigation ──────────────────────────────────────────────
export const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Use Cases", href: "/#use-cases" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
];

// ─── CTA Defaults ────────────────────────────────────────────
export const cta = {
  primaryLabel: "Get Started Free",
  primaryHref: urls.app,
  secondaryLabel: "View Demo Report",
  secondaryHref: urls.demoReport,
};

// ─── Hero Section ────────────────────────────────────────────
export const hero = {
  headline: {
    line1: { pre: "", accent: "Git Reporting", post: " Tool" },
    line2: { pre: "Keep ", accent: "Everyone", post: " Updated" },
  },
  lede: brand.description,
  supporting: `Works with ${brand.platforms.map((p) => `<strong>${p}</strong>`).join(", ")}.`,
  meta: "No credit card required",
  demoTitle:
    "Connect a GitHub Repository and Set Up Automated Email Updates",
};

// ─── Comparison Section ──────────────────────────────────────
export const comparison = {
  painPoints: [
    "Long standups with unclear progress updates",
    "Manually writing status updates and reports",
    "Chasing team members for progress updates",
    'Stakeholders asking "what shipped this week?"',
  ],
  benefits: [
    "Automated reports from actual Git activity",
    "AI-summarized commits and PRs delivered to Slack/email",
    "Real-time visibility for stakeholders",
    "Come to standups already prepared",
  ],
  withoutLabel: `Without ${brand.name}`,
  withLabel: `With ${brand.name}`,
};

// ─── How It Works ────────────────────────────────────────────
export const howItWorks = {
  steps: [
    {
      number: "01",
      title: "Connect Your Repo",
      body: "With one click, we set up webhooks automatically. No configuration files, no YAML hell.",
    },
    {
      number: "02",
      title: "We Watch Your Activity",
      body: "Every commit, PR, and merge gets tracked. No manual updates needed. Your Git activity speaks for itself.",
    },
    {
      number: "03",
      title: "You Get Answers",
      body: "Check your dashboard, ask our AI, or wait for your weekly/daily email. Your choice\u2014we\u2019re not pushy about it.",
    },
  ],
};

// ─── Features ────────────────────────────────────────────────
export const features = [
  {
    id: "connect",
    title: "Connect Your Stack",
    description: `${brand.name} works with the tools you already love. GitHub, GitLab, or Bitbucket \u2014 connecting takes just a few clicks.`,
    stickyTop: 128,
    minHeight: "31.25rem",
  },
  {
    id: "reports",
    title: "Automated Reports",
    description:
      "Set up once, receive intelligent summaries automatically. Come to standups prepared with all the context you need.",
    stickyTop: 208,
    minHeight: "31.25rem",
  },
  {
    id: "monitoring",
    title: "Live Monitoring",
    description:
      "Track all your commits and pull requests across repositories with a live monitoring board.",
    stickyTop: 288,
    minHeight: "31.25rem",
  },
  {
    id: "chat",
    title: "AI Chat Assistant",
    description: `Ask questions about your progress, pull requests, or commits. Get instant answers in Slack or on ${brand.name}.`,
    stickyTop: 128,
    minHeight: "46.25rem",
  },
];

// ─── Use Cases ───────────────────────────────────────────────
export const useCases = [
  {
    title: "Developers",
    badge: "DE",
    emoji: "\uD83D\uDC68\u200D\uD83D\uDCBB",
    tagline: "Code speaks. You don't have to.",
    description:
      "Push code, get recognized. Your commits tell the story \u2014 no status updates needed.",
    benefits: [
      "Automatic activity tracking",
      "Leaderboard recognition",
      "Zero reporting overhead",
    ],
    href: "/use-case/developer-productivity-reports",
  },
  {
    title: "Engineering Managers",
    badge: "EM",
    emoji: "\uD83D\uDCCA",
    tagline: "See everything. Micromanage nothing.",
    description:
      "Get complete visibility into team progress without interrupting flow states.",
    benefits: [
      "AI-generated summaries",
      "Spot blockers early",
      "Data-driven 1:1s",
    ],
    href: "/use-case/engineering-manager-reports",
  },
  {
    title: "Product Managers",
    badge: "PM",
    emoji: "\uD83C\uDFAF",
    tagline: "Real-time insights, zero interruptions.",
    description:
      "Know what shipped, what\u2019s in progress, and what\u2019s blocked \u2014 without asking.",
    benefits: [
      "Automated progress reports",
      "Feature tracking",
      "Release visibility",
    ],
    href: "/use-case/sprint-reports",
  },
  {
    title: "CTOs & Founders",
    badge: "CX",
    emoji: "\uD83D\uDE80",
    tagline: "High-level visibility. Low-level effort.",
    description:
      "Understand engineering velocity across all repos without manual reports.",
    benefits: [
      "Executive summaries",
      "Cross-team insights",
      "Strategic visibility",
    ],
    href: "/use-case/standup-reports",
  },
];

export const useCaseStats = [
  { value: "3x", label: "Faster reporting with AI" },
  { value: "50%", label: "Shorter standup meetings" },
  { value: "100%", label: "Visibility into team activity" },
];

// ─── Pricing ─────────────────────────────────────────────────
export const pricingPlans = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: `Perfect for getting started with ${brand.name}`,
    features: ["1 integration", "50 AI credits/month", "Leaderboard access"],
    cta: "Get Started",
    popular: false,
    isFree: true,
  },
  {
    name: "Pro",
    monthlyPrice: 8.99,
    yearlyPrice: 89.9,
    description: "For professional developers and small teams",
    features: [
      "5 repositories",
      "5 automations",
      "100 AI credits/month",
      "Leaderboard access",
      "Monitoring Board",
    ],
    cta: "Get Started",
    popular: true,
    isFree: false,
  },
  {
    name: "Enterprise",
    monthlyPrice: 30,
    yearlyPrice: 300,
    description: "For teams that need full control",
    features: [
      "20 repositories",
      "20 automations",
      "500 AI credits/month",
      "Leaderboard access",
      "Monitoring Board",
      "Custom Automations",
    ],
    cta: "Get Started",
    popular: false,
    isFree: false,
  },
];

// ─── FAQ ─────────────────────────────────────────────────────
export const faqItems = [
  {
    question: "Which repositories and platforms do you support?",
    answer:
      "We support GitHub, GitLab, and Bitbucket - including both cloud-hosted and self-hosted/enterprise versions. You can connect private and public repositories. We work with GitHub.com, GitHub Enterprise, GitLab.com, self-hosted GitLab, Bitbucket Cloud, and Bitbucket Server.",
  },
  {
    question: "What tools integrate GitHub with Slack for team reporting?",
    answer: `${brand.name} integrates with both GitHub and Slack to deliver automated team reports. Unlike basic GitHub-Slack integrations that just forward notifications, ${brand.name} uses AI to aggregate and summarize all activity into meaningful reports - daily digests, weekly summaries, or custom schedules - delivered directly to your Slack channels.`,
  },
  {
    question: "How can CTOs get visibility into engineering progress?",
    answer: `${brand.name} gives CTOs and engineering leaders high-level visibility across all repositories without requiring manual reports from team leads. You get AI-generated summaries of development velocity, what features shipped, blockers, and team contributions - all extracted automatically from Git activity and delivered on your schedule.`,
  },
  {
    question: `How do I connect my GitHub repository to ${brand.name}?`,
    answer:
      "You can connect GitHub repositories in two ways: 1) OAuth integration - sign in with GitHub and select repositories to connect automatically, or 2) Manual webhook setup - add a webhook URL to your repository settings. Both methods take under 2 minutes and you'll start receiving data immediately.",
  },
  {
    question: "How does the AI analysis work and what insights do I get?",
    answer:
      "Our LLM analyzes webhook event metadata including commit messages, pull request descriptions, file names, and author information to categorize work into features, bug fixes, refactoring, documentation, and more. You'll receive intelligent summaries of team progress, development velocity metrics, and project insights via email or Slack - all without accessing your actual source code.",
  },
  {
    question: "What is Gitmind and how does it help?",
    answer: `Gitmind is ${brand.name}'s AI chat agent that lets you ask questions about your repository activity in natural language. You can ask things like 'What did the team ship last week?', 'Show me all bug fixes in the last month', or 'Who worked on the authentication feature?' - and get instant, accurate answers based on your Git history.`,
  },
  {
    question: "How secure are webhook integrations?",
    answer:
      "We implement enterprise-grade security measures including webhook signature verification. All webhook payloads are validated and processed in isolated environments. We only access event metadata (commit messages, PR titles, author info, timestamps) - never your actual source code or code changes. This ensures complete privacy of your codebase while providing valuable development insights.",
  },
  {
    question: `Does ${brand.name} access my source code?`,
    answer: `No, ${brand.name} never accesses your source code. We only receive and process webhook event metadata - commit messages, PR titles and descriptions, author information, file names, and timestamps. Your actual code changes, file contents, and repository files remain completely private and are never transmitted to our servers.`,
  },
  {
    question: "Is there a free plan available?",
    answer: `Yes, ${brand.name} offers a free forever plan that includes 1 repository integration, 50 AI credits/month, and Leaderboard access. No credit card required. Upgrade anytime to unlock more repositories, automations, and features.`,
  },
  {
    question: "Can I cancel or downgrade my plan at any time?",
    answer:
      "Yes, you can cancel or downgrade your plan at any time from your account settings. There are no long-term contracts or cancellation fees. If you downgrade, you'll retain access to your current plan until the end of your billing period.",
  },
];

// ─── Footer Navigation ──────────────────────────────────────
export const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "FAQ", href: "/#faq" },
      { label: "Blog", href: "/blog" },
      { label: "Resources", href: "/resources" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "GitHub Reporting", href: "/git-reporting/tool/github" },
      { label: "GitLab Reporting", href: "/git-reporting/tool/gitlab" },
      {
        label: "Bitbucket Reporting",
        href: "/git-reporting/tool/bitbucket",
      },
    ],
  },
  {
    title: "Use Cases",
    links: [
      { label: "Standup Reports", href: "/use-case/standup-reports" },
      { label: "Sprint Reports", href: "/use-case/sprint-reports" },
      {
        label: "Productivity Reports",
        href: "/use-case/developer-productivity-reports",
      },
      {
        label: "Manager Reports",
        href: "/use-case/engineering-manager-reports",
      },
      { label: "Async Standups", href: "/use-case/async-standups" },
      {
        label: "CTO Visibility",
        href: "/use-case/cto-engineering-visibility",
      },
    ],
  },
  {
    title: "Compare",
    links: [
      { label: "Geekbot Alternative", href: "/alternative/geekbot" },
      { label: "LinearB Alternative", href: "/alternative/linearb" },
      { label: "Keypup Alternative", href: "/alternative/keypup" },
      { label: "Swarmia Alternative", href: "/alternative/swarmia" },
      { label: "Standuply Alternative", href: "/alternative/standuply" },
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

// ─── Window Chrome Titles (for feature previews) ─────────────
export const previewTitles = {
  integrations: `app.${brand.domain}/integrations`,
  mail: "mail.google.com",
  board: `app.${brand.domain}/board`,
  chat: `app.${brand.domain}/chat`,
};
