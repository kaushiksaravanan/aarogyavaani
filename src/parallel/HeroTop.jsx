import { brand, urls, hero } from "../siteConfig";
import "./hero-top.css";

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

export function HeroSection() {
  return (
    <section className="hero-top-hero" id="top">
      <div className="hero-top-hero__grain" aria-hidden="true">
        <div className="hero-top-hero__grain-shader" data-paper-shader="" />
      </div>

      <div className="hero-top-hero__inner">
        <div className="hero-top-hero__copy">
          <h1>
            <span>{hero.headline.line1.accent}</span>{hero.headline.line1.post}
            <br />
            {hero.headline.line2.pre}<span>{hero.headline.line2.accent}</span>{hero.headline.line2.post}
          </h1>

          <p className="hero-top-hero__lede">{hero.lede}</p>

          <p className="hero-top-hero__supporting">
            Works with {brand.platforms.map((p, i) => (
              <span key={p}>{i > 0 && (i === brand.platforms.length - 1 ? ", and " : ", ")}<strong>{p}</strong></span>
            ))}.
          </p>

          <div className="hero-top-hero__actions">
            <a
              className="hero-top-hero__button hero-top-hero__button--primary"
              href={urls.app}
              target="_blank"
              rel="noreferrer"
            >
              Get Started Free
            </a>
            <a className="hero-top-hero__button hero-top-hero__button--secondary" href={urls.demoReport}>
              <MailIcon />
              <span>View Demo Report</span>
            </a>
          </div>

          <p className="hero-top-hero__meta">{hero.meta}</p>
        </div>

        <div className="hero-top-hero__demo">
          <div className="hero-top-hero__frame">
            <div className="hero-top-hero__embed">
              <iframe
                src={urls.heroDemo}
                title={hero.demoTitle}
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
