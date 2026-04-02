import "./14-footer.css";

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

function GitmoreMark() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className="p15-footer__brand-mark">
      <rect x="2" y="2" width="32" height="32" rx="10" fill="rgba(255,255,255,0.11)" />
      <path
        d="M12 19.5h5l2.8-7.2 4.6 12.2 2.2-5h2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24.6" cy="10.6" r="2.1" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="p15-footer__social-icon">
      <path d="M18.9 3H21l-4.6 5.26L21.8 21h-4.24l-3.32-4.73L10.1 21H8l4.92-5.62L7.7 3h4.35l3 4.28L18.9 3Zm-1.49 16.42h1.17L11.06 4.5H9.8l7.61 14.92Z" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="p15-footer__social-icon">
      <path d="M19 0H5C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5ZM8 19H5V8h3v11ZM6.5 6.73A1.76 1.76 0 1 1 6.5 3.2a1.76 1.76 0 0 1 0 3.53ZM20 19h-3v-5.6c0-3.37-4-3.11-4 0V19h-3V8h3v1.77c1.4-2.59 7-2.78 7 2.47V19Z" fill="currentColor" />
    </svg>
  );
}

export default function Parallel15Footer() {
  return (
    <div className="p15-footer-shell">
      <section id="cta" className="p15-footer-cta">
        <div className="p15-footer-cta__halo" aria-hidden="true" />
        <div className="p15-footer__container p15-footer__container--cta">
          <div className="p15-footer-cta__card">
            <h2>Try it for free</h2>
            <p>
              We&apos;re confident you&apos;ll love it. But if you don&apos;t? Just cancel. No hard feelings. No
              &quot;let&apos;s schedule a call to discuss your experience&quot; emails.
            </p>
            <a
              href="https://app.gitmore.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="p15-footer__button"
            >
              Get started
            </a>
          </div>
        </div>
      </section>

      <footer className="p15-footer">
        <div className="p15-footer__container p15-footer__container--footer">
          <div className="p15-footer__main">
            <div className="p15-footer__brand-column">
              <a className="p15-footer__brand" href="/" aria-label="Gitmore home">
                <GitmoreMark />
                <span>Gitmore</span>
              </a>

              <p className="p15-footer__copy">
                Automated reporting and insights for your engineering team. To contact us, please
                email at support@gitmore.io
              </p>

              <div className="p15-footer__badges" aria-label="Gitmore badges and rankings">
                {BADGES.map((badge) => (
                  <a key={badge.alt} href={badge.href} target="_blank" rel="noopener noreferrer">
                    <img src={badge.src} alt={badge.alt} loading="lazy" />
                  </a>
                ))}
              </div>
            </div>

            <div className="p15-footer__links-grid">
              {FOOTER_GROUPS.map((group) => (
                <div key={group.title} className="p15-footer__group">
                  <h3>{group.title}</h3>
                  <nav aria-label={group.title}>
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

          <div className="p15-footer__bottom">
            <p>&copy; 2026 Gitmore. All rights reserved.</p>

            <div className="p15-footer__socials">
              <a
                href="https://x.com/gitmore_io"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Gitmore on X (Twitter)"
              >
                <XIcon />
              </a>
              <a
                href="https://www.linkedin.com/company/gitmore/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Gitmore on LinkedIn"
              >
                <LinkedInIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="p15-footer__wordmark" aria-hidden="true">
          gitmore.io
        </div>
      </footer>
    </div>
  );
}
