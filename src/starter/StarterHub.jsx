import SeoHead from "../SeoHead.jsx";
import { brand, urls } from "../siteConfig.js";
import SiteHeader from "../parallel15/02-header.jsx";
import { LowerSectionsFooter } from "../parallel/LowerSections.jsx";

const sections = [
  {
    title: "Rebrand fast",
    body: "Change the product name, domain, app URL, support email, hero, pricing, and footer from the central config before touching anything else.",
  },
  {
    title: "Turn on the stack you need",
    body: "Use the built-in provider modules for Supabase, Clerk, Paddle, Neon, Tinybird, Gemini, OpenRouter, and more. Start with one core workflow and keep the rest dormant.",
  },
  {
    title: "Ship a judge-friendly demo",
    body: "The fastest win is a sharp landing page, one magical product flow, one proof signal, and one clean backend endpoint.",
  },
  {
    title: "Go beyond web",
    body: "Use the mobile starter and publishing playbooks to package the app for Android and prepare Play Store submission assets faster.",
  },
];

const integrations = [
  "Supabase auth + database",
  "Clerk auth starter",
  "Paddle billing starter",
  "Gemini and model provider env layout",
  "FastAPI backend starter",
  "Capacitor Android packaging starter",
  "SEO, robots, sitemap, and llms.txt",
];

const pages = [
  { title: "Auth Starter", href: "/starter/auth", body: "A visible auth surface for Clerk-backed sign-in and sign-up flows." },
  { title: "Billing Starter", href: "/starter/billing", body: "A visible billing surface for Paddle-backed pricing and checkout flows." },
  { title: "Provider Status", href: "/starter/providers", body: "A live provider-status page backed by the FastAPI starter." },
  { title: "Mobile Publishing", href: "/starter/mobile", body: "Android packaging and Play Store publishing guidance." },
];

export default function StarterHub() {
  return (
    <div className="content-page">
      <SeoHead
        title={`${brand.name} Starter Hub`}
        description={`Everything included in the ${brand.name} SaaS starter: auth, billing, backend, SEO, and mobile publishing foundations.`}
        path="/starter"
        appendBrand={false}
      />

      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteHeader />

      <main id="main-content">
        <section className="content-page__hero">
          <div className="content-page__hero-inner">
            <span className="content-page__eyebrow">Starter Hub</span>
            <h1>{brand.name} ships more than a landing page.</h1>
            <p className="content-page__description">
              Use this repo as your launch engine for hackathons, indie SaaS builds, and product experiments that need design, backend, growth, and mobile paths from day one.
            </p>
            <div className="content-page__actions">
              <a className="button button--small button--primary" href={urls.app} target="_blank" rel="noreferrer">
                Open App
              </a>
              <a className="button button--small button--ghost" href="/resources">
                View Resources
              </a>
            </div>
            <p className="content-page__hero-meta">Auth, billing, backend, SEO, Android starter, and publishing docs included</p>
          </div>
        </section>

        <div className="content-page__body">
          <section className="content-page__section">
            <div className="content-page__section-head">
              <span className="content-page__kicker">What to do first</span>
              <h2>Win the first 24 hours</h2>
              <p>Do the minimum that makes the product feel complete and invest heavily in clarity.</p>
            </div>
            <div className="content-page__card-grid">
              {sections.map((item) => (
                <article key={item.title} className="content-page__card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="content-page__section">
            <div className="content-page__section-head">
              <span className="content-page__kicker">Included</span>
              <h2>Starter integrations</h2>
              <p>Keep only what your product actually needs, but start from a stronger base.</p>
            </div>
            <ul className="content-page__list">
              {integrations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="content-page__section">
            <div className="content-page__section-head">
              <span className="content-page__kicker">Starter UI</span>
              <h2>Built-in starter pages</h2>
              <p>Use these as visible launch surfaces while wiring the real product.</p>
            </div>
            <div className="content-page__card-grid">
              {pages.map((page) => (
                <article key={page.href} className="content-page__card">
                  <h3><a className="content-page__inline-link" href={page.href}>{page.title}</a></h3>
                  <p>{page.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="content-page__section content-page__cta-band">
            <div className="content-page__section-head">
              <h2>Next step: make the product yours</h2>
              <p>Edit `src/siteConfig.js`, wire your providers, and build one demo-worthy workflow before adding anything else.</p>
            </div>
          </section>
        </div>
      </main>
      <LowerSectionsFooter />
    </div>
  );
}
