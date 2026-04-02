import "./hero-top.css";

const HEADER_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Use Cases", href: "/#use-cases" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
];

function GitmoreMark() {
  return <img src="/logo.png" alt="" aria-hidden="true" className="hero-top__logo-mark" />;
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="hero-top__button-icon">
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

export function CloneHeader() {
  return (
    <header className="hero-top-header">
      <div className="hero-top-header__inner">
        <a className="hero-top-header__brand" href="/" aria-label="Gitmore home">
          <GitmoreMark />
            <span>gitmore.io</span>
          </a>

        <nav className="hero-top-header__nav" aria-label="Primary">
          {HEADER_LINKS.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <a className="hero-top-header__cta" href="https://app.gitmore.io" target="_blank" rel="noreferrer">
          Get Started
        </a>
      </div>
    </header>
  );
}

export function CloneHero() {
  return (
    <section className="hero-top-hero" id="top">
      <div className="hero-top-hero__grain" aria-hidden="true">
        <div className="hero-top-hero__grain-shader" data-paper-shader="" />
      </div>

      <div className="hero-top-hero__inner">
        <div className="hero-top-hero__copy">
          <h1>
            <span>Git Reporting</span> Tool
            <br />
            Keep <span>Everyone</span> Updated
          </h1>

          <p className="hero-top-hero__lede">
            Turns your commits and PRs into clear team updates delivered daily or weekly to Slack or
            email.
          </p>

          <p className="hero-top-hero__supporting">
            Works with <strong>GitHub</strong>, <strong>GitLab</strong>, and <strong>Bitbucket</strong>.
          </p>

          <div className="hero-top-hero__actions">
            <a
              className="hero-top-hero__button hero-top-hero__button--primary"
              href="https://app.gitmore.io"
              target="_blank"
              rel="noreferrer"
            >
              Get Started Free
            </a>
            <a className="hero-top-hero__button hero-top-hero__button--secondary" href="/example.html">
              <MailIcon />
              <span>View Demo Report</span>
            </a>
          </div>

          <p className="hero-top-hero__meta">No credit card required</p>
        </div>

        <div className="hero-top-hero__demo">
          <div className="hero-top-hero__frame">
            <div className="hero-top-hero__embed">
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
