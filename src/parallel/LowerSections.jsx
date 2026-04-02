import { useState } from "react";
import "./lower-sections.css";

const PRICING_PLANS = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for getting started with Gitmore",
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

const FAQ_ITEMS = [
  {
    question: "Which repositories and platforms do you support?",
    answer:
      "We support GitHub, GitLab, and Bitbucket - including both cloud-hosted and self-hosted/enterprise versions. You can connect private and public repositories. We work with GitHub.com, GitHub Enterprise, GitLab.com, self-hosted GitLab, Bitbucket Cloud, and Bitbucket Server.",
  },
  {
    question: "What tools integrate GitHub with Slack for team reporting?",
    answer:
      "Gitmore integrates with both GitHub and Slack to deliver automated team reports. Unlike basic GitHub-Slack integrations that just forward notifications, Gitmore uses AI to aggregate and summarize all activity into meaningful reports - daily digests, weekly summaries, or custom schedules - delivered directly to your Slack channels.",
  },
  {
    question: "How can CTOs get visibility into engineering progress?",
    answer:
      "Gitmore gives CTOs and engineering leaders high-level visibility across all repositories without requiring manual reports from team leads. You get AI-generated summaries of development velocity, what features shipped, blockers, and team contributions - all extracted automatically from Git activity and delivered on your schedule.",
  },
  {
    question: "How do I connect my GitHub repository to Gitmore?",
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
    answer:
      "Gitmind is Gitmore's AI chat agent that lets you ask questions about your repository activity in natural language. You can ask things like 'What did the team ship last week?', 'Show me all bug fixes in the last month', or 'Who worked on the authentication feature?' - and get instant, accurate answers based on your Git history.",
  },
  {
    question: "How secure are webhook integrations?",
    answer:
      "We implement enterprise-grade security measures including webhook signature verification. All webhook payloads are validated and processed in isolated environments. We only access event metadata (commit messages, PR titles, author info, timestamps) - never your actual source code or code changes. This ensures complete privacy of your codebase while providing valuable development insights.",
  },
  {
    question: "Does Gitmore access my source code?",
    answer:
      "No, Gitmore never accesses your source code. We only receive and process webhook event metadata - commit messages, PR titles and descriptions, author information, file names, and timestamps. Your actual code changes, file contents, and repository files remain completely private and are never transmitted to our servers.",
  },
  {
    question: "Is there a free plan available?",
    answer:
      "Yes, Gitmore offers a free forever plan that includes 1 repository integration, 50 AI credits/month, and Leaderboard access. No credit card required. Upgrade anytime to unlock more repositories, automations, and features.",
  },
  {
    question: "Can I cancel or downgrade my plan at any time?",
    answer:
      "Yes, you can cancel or downgrade your plan at any time from your account settings. There are no long-term contracts or cancellation fees. If you downgrade, you'll retain access to your current plan until the end of your billing period.",
  },
];

const FOOTER_GROUPS = [
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
      { label: "Bitbucket Reporting", href: "/git-reporting/tool/bitbucket" },
    ],
  },
  {
    title: "Use Cases",
    links: [
      { label: "Standup Reports", href: "/use-case/standup-reports" },
      { label: "Sprint Reports", href: "/use-case/sprint-reports" },
      { label: "Productivity Reports", href: "/use-case/developer-productivity-reports" },
      { label: "Manager Reports", href: "/use-case/engineering-manager-reports" },
      { label: "Async Standups", href: "/use-case/async-standups" },
      { label: "CTO Visibility", href: "/use-case/cto-engineering-visibility" },
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

const BADGES = [
  {
    alt: "Gitmore on Product Hunt",
    href: "https://www.producthunt.com/products/gitmore?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-gitmore",
    src: "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1006218&theme=neutral",
  },
  {
    alt: "Gitmore on Peerlist",
    href: "https://peerlist.io/hamaabidi/project/gitmore",
    src: "https://dqy38fnwh4fqs.cloudfront.net/website/project-spotlight/project-week-rank-three-light.svg",
  },
  {
    alt: "Gitmore on SaaSHub",
    href: "https://www.saashub.com/gitmore?utm_source=badge&utm_campaign=badge&utm_content=gitmore&badge_variant=color&badge_kind=approved",
    src: "https://cdn-b.saashub.com/img/badges/approved-color.png?v=1",
  },
];

function formatPrice(value) {
  if (value === 0) {
    return "0";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getSavings(plan) {
  if (plan.isFree) {
    return null;
  }

  const savings = Math.round((plan.monthlyPrice * 12 - plan.yearlyPrice) * 100) / 100;
  return savings > 0 ? `Save $${formatPrice(savings)}` : null;
}

function CheckIcon() {
  return <span aria-hidden="true" className="lower-sections__check-icon">✓</span>;
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="lower-sections__social-icon">
      <path d="M18.9 3H21l-4.6 5.26L21.8 21h-4.24l-3.32-4.73L10.1 21H8l4.92-5.62L7.7 3h4.35l3 4.28L18.9 3Zm-1.49 16.42h1.17L11.06 4.5H9.8l7.61 14.92Z" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="lower-sections__social-icon">
      <path d="M19 0H5C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5ZM8 19H5V8h3v11ZM6.5 6.73A1.76 1.76 0 1 1 6.5 3.2a1.76 1.76 0 0 1 0 3.53ZM20 19h-3v-5.6c0-3.37-4-3.11-4 0V19h-3V8h3v1.77c1.4-2.59 7-2.78 7 2.47V19Z" fill="currentColor" />
    </svg>
  );
}

function useLowerSectionsState(controlledValue, controlledSetter, defaultValue) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const isControlled = typeof controlledSetter === "function" && controlledValue !== undefined;

  return [isControlled ? controlledValue : localValue, isControlled ? controlledSetter : setLocalValue];
}

function PricingCard({ plan, yearlyBilling }) {
  const price = plan.isFree ? 0 : yearlyBilling ? plan.yearlyPrice : plan.monthlyPrice;
  const savings = yearlyBilling ? getSavings(plan) : null;

  return (
    <article className={`lower-plan-card${plan.popular ? " is-popular" : ""}`}>
      {plan.popular ? <div className="lower-plan-card__badge">Most Popular</div> : null}
      <div className="lower-plan-card__header">
        <h3>{plan.name}</h3>
        <p>{plan.description}</p>
      </div>

      <div className="lower-plan-card__price-row">
        <span className="lower-plan-card__price">${formatPrice(price)}</span>
        <span className="lower-plan-card__period">{plan.isFree ? "forever" : yearlyBilling ? "/year" : "/month"}</span>
      </div>

      {savings ? <div className="lower-plan-card__savings">{savings}</div> : null}

      <ul className="lower-plan-card__features">
        {plan.features.map((feature) => (
          <li key={feature}>
            <CheckIcon />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <a href="https://app.gitmore.io" target="_blank" rel="noopener noreferrer" className={`lower-sections__button lower-sections__button--full${plan.popular ? " lower-sections__button--inverted" : " lower-sections__button--muted"}`}>
        {plan.cta}
      </a>

      {plan.isFree ? <p className="lower-plan-card__fine-print">*No credit card required</p> : null}
    </article>
  );
}

export function PricingSection({ yearlyBilling: controlledYearlyBilling, setYearlyBilling: controlledSetYearlyBilling }) {
  const [yearlyBilling, setYearlyBilling] = useLowerSectionsState(controlledYearlyBilling, controlledSetYearlyBilling, false);
  const toggleBilling = () => setYearlyBilling((value) => !value);
  const setBillingPeriod = (period) => setYearlyBilling(period === "yearly");

  return (
    <section id="pricing" className="lower-section lower-section--pricing">
      <div className="lower-sections__container lower-sections__container--wide">
        <div className="lower-sections__intro">
          <span className="lower-sections__eyebrow">Pricing</span>
          <h2>
            Simple, transparent
            <br />
            pricing
          </h2>
          <p>Choose the plan that fits your team. Upgrade or downgrade anytime.</p>
        </div>

        <div className="lower-billing-toggle" role="group" aria-label="Billing period selector">
          <button
            type="button"
            className={`lower-billing-toggle__label${!yearlyBilling ? " is-active" : ""}`}
            aria-pressed={!yearlyBilling}
            onClick={() => setBillingPeriod("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className="lower-billing-toggle__button"
            aria-label="Toggle billing period"
            role="switch"
            aria-checked={yearlyBilling}
            onClick={toggleBilling}
          >
            <span className={`lower-billing-toggle__thumb${yearlyBilling ? " is-yearly" : ""}`} />
          </button>
          <button
            type="button"
            className={`lower-billing-toggle__label${yearlyBilling ? " is-active" : ""}`}
            aria-pressed={yearlyBilling}
            onClick={() => setBillingPeriod("yearly")}
          >
            Yearly
          </button>
          <span className="lower-billing-toggle__save">Save 17%</span>
        </div>

        <div className="lower-plan-grid">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.name} plan={plan} yearlyBilling={yearlyBilling} />
          ))}
        </div>

        <p className="lower-pricing__footer-note">
          <span>Prices excl. VAT where applicable.</span>
        </p>
      </div>
    </section>
  );
}

export function FaqSection({ openFaq: controlledOpenFaq, setOpenFaq: controlledSetOpenFaq }) {
  const [openFaq, setOpenFaq] = useLowerSectionsState(controlledOpenFaq, controlledSetOpenFaq, null);

  return (
    <section id="faq" className="lower-section lower-section--faq">
      <div className="lower-sections__container lower-sections__container--faq">
        <div className="lower-faq-layout">
          <div className="lower-faq-copy">
            <h2>
              Frequently asked
              <br />
              questions
            </h2>
            <p>Everything you need to know about Gitmore.</p>
            <div className="lower-faq-copy__contact">
              <p>
                Have another question? Contact us on <a href="https://x.com/gitmore_io" target="_blank" rel="noopener noreferrer">X (Twitter)</a> or by <a href="mailto:support@gitmore.io">email</a>.
              </p>
            </div>
          </div>

          <div className="lower-faq-list" role="list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;

              return (
                <div key={item.question} className={`lower-faq-item${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="lower-faq-item__trigger"
                    aria-expanded={isOpen}
                    aria-controls={`lower-faq-panel-${index}`}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span>{item.question}</span>
                    <span className="lower-faq-item__icon">+</span>
                  </button>
                  <div id={`lower-faq-panel-${index}`} className="lower-faq-item__panel">
                    <div>
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="lower-faq-list__end" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section id="cta" className="lower-section lower-section--cta">
      <div className="lower-sections__cta-surface" />
      <div className="lower-sections__container lower-sections__container--cta">
        <div className="lower-final-cta">
          <h2>Try it for free</h2>
          <p>
            We're confident you'll love it. But if you don't? Just cancel. No hard feelings. No "let's schedule a call to discuss your experience" emails.
          </p>
          <a href="https://app.gitmore.io/" target="_blank" rel="noopener noreferrer" className="lower-sections__button lower-sections__button--dark">
            Get started
          </a>
        </div>
      </div>
    </section>
  );
}

export function LowerSectionsFooter() {
  return (
    <footer className="lower-footer">
      <div className="lower-sections__container lower-sections__container--wide">
        <div className="lower-footer__main">
          <div className="lower-footer__brand-block">
            <a className="lower-footer__brand" href="/">
              Gitmore
            </a>
            <p>
              Automated reporting and insights for your engineering team. To contact us, please email at{" "}
              <a className="lower-footer__inline-link" href="mailto:support@gitmore.io">
                support@gitmore.io
              </a>
            </p>
            <div className="lower-footer__badges">
              {BADGES.map((badge) => (
                <a key={badge.alt} href={badge.href} target="_blank" rel="noopener noreferrer">
                  <img src={badge.src} alt={badge.alt} loading="lazy" />
                </a>
              ))}
            </div>
          </div>

          <div className="lower-footer__nav-grid">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title} className="lower-footer__group">
                <h3>{group.title}</h3>
                <nav>
                  {group.links.map((link) => (
                    <a key={link.label} href={link.href}>
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="lower-footer__bottom">
          <p>© 2026 Gitmore. All rights reserved.</p>
          <div className="lower-footer__socials">
            <a href="https://x.com/gitmore_io" target="_blank" rel="noopener noreferrer" aria-label="Gitmore on X (Twitter)">
              <span className="sr-only">Gitmore on X (Twitter)</span>
              <XIcon />
            </a>
            <a href="https://www.linkedin.com/company/gitmore/" target="_blank" rel="noopener noreferrer" aria-label="Gitmore on LinkedIn">
              <span className="sr-only">Gitmore on LinkedIn</span>
              <LinkedInIcon />
            </a>
          </div>
        </div>
      </div>

      <div className="lower-footer__wordmark-wrap" aria-hidden="true">
        <h2 className="lower-footer__wordmark">gitmore.io</h2>
      </div>
    </footer>
  );
}

export default function LowerSections(props) {
  return (
    <div className="lower-sections">
      <PricingSection yearlyBilling={props.yearlyBilling} setYearlyBilling={props.setYearlyBilling} />
      <FaqSection openFaq={props.openFaq} setOpenFaq={props.setOpenFaq} />
      <FinalCtaSection />
      <LowerSectionsFooter />
    </div>
  );
}
