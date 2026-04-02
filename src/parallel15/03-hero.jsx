import "./03-hero.css";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

function GitmoreMark() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className="parallel15-hero__logo-mark">
      <rect x="2" y="2" width="32" height="32" rx="10" fill="rgba(255,255,255,0.14)" />
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

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="parallel15-hero__button-icon">
      <path
        d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Parallel15Hero03() {
  return (
    <section className="parallel15-hero" id="top">
      <div className="parallel15-hero__grain" aria-hidden="true" />

      <div className="parallel15-hero__shell">
        <header className="parallel15-hero__header">
          <a className="parallel15-hero__brand" href="#top" aria-label="Gitmore home">
            <GitmoreMark />
            <span>Gitmore</span>
          </a>

          <nav className="parallel15-hero__nav" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <a className="parallel15-hero__header-cta" href="#cta">
            Get Started
          </a>
        </header>

        <div className="parallel15-hero__copy">
          <h1>
            <span>Git Reporting</span> Tool
            <br />
            Keep <span>Everyone</span> Updated
          </h1>

          <p className="parallel15-hero__lede">
            Turns your commits and PRs into clear team updates delivered daily or weekly to Slack or
            email.
          </p>

          <p className="parallel15-hero__supporting">
            Works with <strong>GitHub</strong>, <strong>GitLab</strong>, and <strong>Bitbucket</strong>.
          </p>

          <div className="parallel15-hero__actions">
            <a className="parallel15-hero__button parallel15-hero__button--primary" href="#cta">
              Get Started Free
            </a>
            <a
              className="parallel15-hero__button parallel15-hero__button--secondary"
              href="#features"
            >
              <MailIcon />
              <span>View Demo Report</span>
            </a>
          </div>

          <p className="parallel15-hero__meta">No credit card required</p>
        </div>

        <div className="parallel15-hero__demo">
          <div className="parallel15-hero__frame">
            <div className="parallel15-hero__embed">
              <iframe
                src="/hero-demo.html"
                title="Connect a GitHub Repository and Set Up Automated Email Updates"
                frameBorder="0"
                loading="lazy"
                allowFullScreen
                allow="clipboard-write"
                width="1024"
                height="560"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
