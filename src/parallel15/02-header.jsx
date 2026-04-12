import { useEffect, useState } from "react";
import { brand, navLinks, urls } from "../siteConfig";
import "./02-header.css";

function LogoMark() {
  return <img src={brand.logo} alt="" aria-hidden="true" className="parallel15-header__logo-mark" />;
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="parallel15-header__toggle-icon">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="parallel15-header__toggle-icon">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="parallel15-header">
        <div className="parallel15-header__inner">
          <a className="parallel15-header__brand" href="/" aria-label={`${brand.domain} home`}>
            <LogoMark />
            <span>{brand.domain}</span>
          </a>

          <nav className="parallel15-header__nav" aria-label="Primary">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="parallel15-header__actions">
            <a
              className="parallel15-header__cta"
              href={urls.app}
              target="_blank"
              rel="noreferrer"
            >
              Get Started
            </a>
          </div>

          <button
            type="button"
            className="parallel15-header__toggle"
            aria-expanded={mobileOpen}
            aria-controls="parallel15-header-mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      <div
        className={`parallel15-header__backdrop${mobileOpen ? " is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
      />

      <div
        id="parallel15-header-mobile-menu"
        className={`parallel15-header__mobile${mobileOpen ? " is-open" : ""}`}
      >
        <nav className="parallel15-header__mobile-nav" aria-label="Mobile primary">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>

        <a
          className="parallel15-header__mobile-cta"
          href={urls.app}
          target="_blank"
          rel="noreferrer"
          onClick={() => setMobileOpen(false)}
        >
          Get Started
        </a>
      </div>
    </>
  );
}
