import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { brand, urls } from "./siteConfig.js";
import SeoHead from "./SeoHead.jsx";
import SiteHeader from "./parallel15/02-header";
import { LowerSectionsFooter } from "./parallel/LowerSections";

const EMAIL_ONLY_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const LABELLED_LINK_RE = /^(.+?):\s*((?:https?:\/\/\S+)|(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}))$/i;
const LINK_TOKEN_RE = /(https?:\/\/[^\s]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;

function createTextLink(label, href, key) {
  const isEmail = EMAIL_ONLY_RE.test(href);

  return (
    <a
      key={key}
      className="content-page__inline-link"
      href={isEmail ? `mailto:${href}` : href}
      target={!isEmail && href.startsWith("http") ? "_blank" : undefined}
      rel={!isEmail && href.startsWith("http") ? "noreferrer" : undefined}
    >
      {label}
    </a>
  );
}

function renderRichText(text) {
  if (typeof text !== "string") {
    return text;
  }

  const trimmed = text.trim();
  const labelledLinkMatch = trimmed.match(LABELLED_LINK_RE);

  if (labelledLinkMatch) {
    const [, label, href] = labelledLinkMatch;
    return createTextLink(label, href, `${label}-${href}`);
  }

  if (EMAIL_ONLY_RE.test(trimmed)) {
    return createTextLink(trimmed, trimmed, trimmed);
  }

  const parts = [];
  let lastIndex = 0;

  for (const match of text.matchAll(LINK_TOKEN_RE)) {
    const matchIndex = match.index ?? 0;
    const token = match[0];

    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    parts.push(createTextLink(token, token, `${token}-${matchIndex}`));
    lastIndex = matchIndex + token.length;
  }

  if (!parts.length) {
    return text;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function getChecklistStorageKey(page) {
  return `${brand.domain}-checklist:${page.slug ?? page.path ?? page.title}`;
}

function readStoredChecklistIds(storageKey) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsedValue = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(parsedValue) ? parsedValue.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function getResourceCollectionLabel(typeLabel) {
  if (typeLabel === "Glossary") {
    return "Glossary";
  }

  return `${typeLabel}s`;
}

function escapeCsvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function getChecklistItems(sections = []) {
  return sections.flatMap((section) =>
    (section.bullets ?? []).map((item, index) => ({
      id: `${section.title}-${index}`,
      sectionTitle: section.title,
      label: item,
    })),
  );
}

function HeroActions({ ctaLabel = "Use This Template", ctaHref = `${urls.app}/`, secondaryLabel = "Open Starter Hub", secondaryHref = urls.demoReport }) {
  const secondaryIsRoutable = secondaryHref.startsWith("/") && !secondaryHref.endsWith(".html");

  return (
    <div className="content-page__actions">
      <a className="button button--small button--primary" href={ctaHref} target={ctaHref.startsWith("http") ? "_blank" : undefined} rel={ctaHref.startsWith("http") ? "noreferrer" : undefined}>
        {ctaLabel}
      </a>
      {secondaryIsRoutable ? (
        <Link className="button button--small button--ghost" to={secondaryHref}>
          {secondaryLabel}
        </Link>
      ) : (
        <a className="button button--small button--ghost" href={secondaryHref}>
          {secondaryLabel}
        </a>
      )}
    </div>
  );
}

function SectionIntro({ kicker, title, description }) {
  return (
    <div className="content-page__section-head">
      {kicker ? <span className="content-page__kicker">{kicker}</span> : null}
      {title ? <h2>{title}</h2> : null}
      {description ? <p>{renderRichText(description)}</p> : null}
    </div>
  );
}

function ContentSection({ section, checklistState }) {
  return (
    <section className="content-page__section">
      <SectionIntro kicker={section.kicker} title={section.title} description={section.description} />

      {section.paragraphs?.length ? (
        <div className="content-page__prose">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{renderRichText(paragraph)}</p>
          ))}
        </div>
      ) : null}

      {section.bullets?.length ? (
        checklistState ? (
          <ul className="content-page__checklist">
            {section.bullets.map((bullet, index) => {
              const checklistId = `${section.title}-${index}`;
              const isChecked = checklistState.checkedIds.has(checklistId);

              return (
                <li key={checklistId} className={`content-page__checklist-item${isChecked ? " is-checked" : ""}`}>
                  <label className="content-page__checklist-label">
                    <input
                      className="content-page__checklist-input"
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => checklistState.onToggleItem(checklistId)}
                    />
                    <span className="content-page__checklist-text">{renderRichText(bullet)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="content-page__list">
            {section.bullets.map((bullet) => (
              <li key={bullet}>{renderRichText(bullet)}</li>
            ))}
          </ul>
        )
      ) : null}

      {section.cards?.length ? (
        <div className="content-page__card-grid">
          {section.cards.map((card) => (
            <article key={card.title} className="content-page__card">
              <h3>{card.title}</h3>
              <p>{renderRichText(card.body)}</p>
            </article>
          ))}
        </div>
      ) : null}

      {section.faq?.length ? (
        <div className="content-page__faq-list">
          {section.faq.map((item) => (
            <article key={item.question} className="content-page__faq-item">
              <h3>{item.question}</h3>
              <p>{renderRichText(item.answer)}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ComparisonTable({ comparison }) {
  if (!comparison) {
    return null;
  }

  return (
    <section className="content-page__comparison-wrap">
      <SectionIntro
        kicker="Comparison"
        title={comparison.title ?? (comparison.headers?.length ? `${brand.name} vs alternatives` : null)}
        description={comparison.description}
      />
      <table className="content-page__comparison">
        <thead>
          <tr>
            {comparison.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.rows.map((row) => (
            <tr key={row.join("|")}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`}>{renderRichText(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Breadcrumbs({ items }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className="content-page__breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`}>
            {item.to && !isLast ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
            {!isLast ? <span className="content-page__crumb-sep">/</span> : null}
          </span>
        );
      })}
    </div>
  );
}

function RelatedLinks({ title = "Related", items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="content-page__section">
      <SectionIntro title={title} />
      <div className="content-page__card-grid">
        {items.map((item) => (
          <article key={item.to} className="content-page__card">
            <h3>
              <Link to={item.to}>{item.title}</Link>
            </h3>
            {item.body ? <p>{renderRichText(item.body)}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function ContentPage({
  metaTitle,
  title,
  description,
  eyebrow,
  lead,
  sections,
  comparison,
  heroMeta,
  breadcrumbs,
  actions = true,
  sectionProps,
  children,
}) {
  return (
    <div className="content-page">
      <SeoHead title={metaTitle ?? title} description={description} path={breadcrumbs?.[breadcrumbs.length - 1]?.to} appendBrand={!metaTitle} />
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content">
        <section className="content-page__hero">
          <div className="content-page__hero-inner">
            <Breadcrumbs items={breadcrumbs} />
            {eyebrow ? <span className="content-page__eyebrow">{eyebrow}</span> : null}
            <h1>{title}</h1>
            {description ? <p className="content-page__description">{renderRichText(description)}</p> : null}
            {lead ? <p className="content-page__lead">{renderRichText(lead)}</p> : null}
            {actions ? <HeroActions /> : null}
            {heroMeta ? <p className="content-page__hero-meta">{renderRichText(heroMeta)}</p> : null}
          </div>
        </section>

        <div className="content-page__body">
          {comparison ? <ComparisonTable comparison={comparison} /> : null}
          {sections?.map((section) => (
            <ContentSection key={section.title ?? JSON.stringify(section)} section={section} {...sectionProps} />
          ))}
          {children}
        </div>
      </main>
      <LowerSectionsFooter />
    </div>
  );
}

export function MarketingPage({ page }) {
  return (
    <ContentPage {...page}>
      {page.relatedLinks?.length ? <RelatedLinks title={page.relatedTitle ?? "Related"} items={page.relatedLinks} /> : null}
      {page.finalCta ? (
        <section className="content-page__section content-page__cta-band">
          <SectionIntro title={page.finalCta.title} description={page.finalCta.description} />
          <HeroActions
            ctaLabel={page.finalCta.ctaLabel ?? "Use This Template"}
            ctaHref={page.finalCta.ctaHref ?? `${urls.app}/`}
            secondaryLabel={page.finalCta.secondaryLabel ?? "Open Starter Hub"}
            secondaryHref={page.finalCta.secondaryHref ?? urls.demoReport}
          />
        </section>
      ) : null}
    </ContentPage>
  );
}

export function BlogIndexPage({ posts }) {
  const orderedPosts = useMemo(() => posts.slice(), [posts]);

  return (
    <ContentPage
      metaTitle={`Blog - SaaS Launch Guides & Starter Tactics | ${brand.name}`}
      title={`The ${brand.name} Blog`}
      description="Guides, tactics, and templates for launching SaaS products faster with better product taste and less setup drag."
      eyebrow={null}
      lead={null}
      actions={false}
    >
      <section className="content-page__section">
        <div className="content-page__blog-grid">
          {orderedPosts.map((post) => (
            <article key={post.slug} className="content-page__post-card">
              <p className="content-page__post-meta">
                {post.date} · {post.readTime}
              </p>
              <h2>
                <Link to={post.path}>{post.title}</Link>
              </h2>
              <p>{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </ContentPage>
  );
}

export function BlogArticlePage({ post, relatedPosts = [] }) {
  return (
    <ContentPage
      metaTitle={post.metaTitle}
      title={post.title}
      description={post.excerpt}
      eyebrow="Blog"
      lead={post.lead}
      sections={post.sections}
      actions={false}
      heroMeta={`${post.date} · ${post.readTime} · ${brand.name} Team`}
      breadcrumbs={[
        { label: "Home", to: "/" },
        { label: "Blog", to: "/blog" },
        { label: post.title },
      ]}
    >
      <RelatedLinks title="Keep reading" items={relatedPosts} />
      <RelatedLinks
        title="Explore the starter stack"
        items={[
          { title: "Supabase Starter →", to: "/stack/supabase" },
          { title: "Clerk Auth →", to: "/stack/clerk" },
          { title: "Paddle Billing →", to: "/stack/paddle" },
        ]}
      />
      <section className="content-page__section content-page__cta-band">
        <SectionIntro title={`Use ${brand.name} as your launch engine`} description="Start with the polished foundation, then build the one workflow your market will pay for." />
        <HeroActions secondaryLabel="Back to Blog" secondaryHref="/blog" />
      </section>
    </ContentPage>
  );
}

export function ChecklistPage({ page, relatedPages = [] }) {
  const checklistItems = useMemo(() => getChecklistItems(page.sections), [page.sections]);
  const checklistStorageKey = useMemo(() => getChecklistStorageKey(page), [page]);
  const [checkedChecklistIds, setCheckedChecklistIds] = useState(() => readStoredChecklistIds(checklistStorageKey));

  useEffect(() => {
    setCheckedChecklistIds(readStoredChecklistIds(checklistStorageKey));
  }, [checklistStorageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(checklistStorageKey, JSON.stringify(checkedChecklistIds));
    } catch {
      // Ignore storage failures.
    }
  }, [checkedChecklistIds, checklistStorageKey]);

  const checkedChecklistIdSet = useMemo(() => new Set(checkedChecklistIds), [checkedChecklistIds]);
  const completedChecklistCount = checklistItems.filter((item) => checkedChecklistIdSet.has(item.id)).length;
  const hasChecklistItems = checklistItems.length > 0;
  const checklistProgress = checklistItems.length ? Math.round((completedChecklistCount / checklistItems.length) * 100) : 0;
  const remainingChecklistCount = Math.max(checklistItems.length - completedChecklistCount, 0);
  const checklistCsvHref = useMemo(() => {
    const csvRows = [
      ["Section", "Task", "Completed"],
      ...checklistItems.map((item) => [item.sectionTitle, item.label, checkedChecklistIdSet.has(item.id) ? "Yes" : "No"]),
    ];

    const csvContent = csvRows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
    return `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
  }, [checklistItems, checkedChecklistIdSet]);

  const toggleChecklistItem = (itemId) => {
    setCheckedChecklistIds((currentValue) =>
      currentValue.includes(itemId) ? currentValue.filter((value) => value !== itemId) : [...currentValue, itemId],
    );
  };

  const resetChecklistProgress = () => {
    setCheckedChecklistIds([]);
  };

  return (
    <ContentPage
      metaTitle={page.metaTitle}
      title={page.title}
      description={page.excerpt}
      eyebrow={`Checklist • ${page.count}`}
      lead={page.lead ?? "Follow this checklist when onboarding a new team or auditing an existing engineering setup."}
      sections={page.sections}
      heroMeta={page.heroMeta ?? "2-minute setup • No credit card required"}
      breadcrumbs={[
        { label: "Home", to: "/" },
        { label: "Resources", to: "/resources" },
        { label: "Checklists" },
        { label: page.title },
      ]}
      sectionProps={{
        checklistState: {
          checkedIds: checkedChecklistIdSet,
          onToggleItem: toggleChecklistItem,
        },
      }}
    >
      <section className="content-page__section content-page__progress-card">
        <div className="content-page__progress-summary">
          <p className="content-page__mini-label">Progress</p>
          <strong>
            {hasChecklistItems ? `${completedChecklistCount} of ${checklistItems.length} actionable tasks completed` : "Checklist ready to use"}
          </strong>
          <p>
            {hasChecklistItems ? `${checklistProgress}% complete · ${remainingChecklistCount} remaining` : "Track the actionable checklist items below and export them as CSV."}
          </p>
          {hasChecklistItems ? <p className="content-page__progress-note">Interactive progress tracks the actionable checklist items below.</p> : null}
        </div>
        <div className="content-page__progress-bar" aria-hidden="true">
          <span style={{ width: `${checklistProgress}%` }} />
        </div>
        <div className="content-page__progress-actions">
          <a className="button button--small button--ghost content-page__download-link" href={checklistCsvHref} download={`${page.slug ?? `${brand.domain}-checklist`}.csv`}>
            Download CSV
          </a>
          <button type="button" className="button button--small button--ghost" disabled={!completedChecklistCount} onClick={resetChecklistProgress}>
            Reset progress
          </button>
        </div>
      </section>
      <RelatedLinks title="More Checklists" items={page.related ?? relatedPages} />
      <section className="content-page__section content-page__cta-band">
        <SectionIntro title="Ship faster with the starter" description="Use the launch-ready foundation and spend your energy on your differentiated workflow." />
        <HeroActions />
      </section>
    </ContentPage>
  );
}

export function ResourceArticlePage({ page, typeLabel, relatedPages = [] }) {
  const eyebrow = page.count === typeLabel ? typeLabel : `${typeLabel} • ${page.count}`;

  return (
    <ContentPage
      metaTitle={page.metaTitle}
      title={page.title}
      description={page.excerpt}
      eyebrow={eyebrow}
      lead={page.whenToUse}
      sections={page.sections}
      heroMeta={page.heroMeta ?? "2-minute setup • No credit card required"}
      breadcrumbs={[
        { label: "Home", to: "/" },
        { label: "Resources", to: "/resources" },
        { label: getResourceCollectionLabel(typeLabel) },
        { label: page.title },
      ]}
    >
      {page.variations?.length ? (
        <section className="content-page__section">
          <SectionIntro title="Template Variations" description="Pick the format that fits your context." />
          <div className="content-page__card-grid">
            {page.variations.map((item) => (
              <article key={item.title} className="content-page__card">
                <h3>{item.title}</h3>
                <p>{renderRichText(item.body)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <RelatedLinks title={typeLabel === "Glossary" ? "Related" : "More Templates"} items={page.related ?? relatedPages} />
      <section className="content-page__section content-page__cta-band">
        <SectionIntro title={typeLabel === "Glossary" ? "Learn the language of product building" : "Use the starter and launch sooner"} description={`${brand.name} gives you a premium foundation for launching SaaS products with less setup drag.`} />
        <HeroActions />
      </section>
    </ContentPage>
  );
}

export function ResourcesPage({ checklists, templates, glossary, allPostsCount }) {
  return (
    <ContentPage
      metaTitle={`Builder Resources: Templates, Checklists & Guides | ${brand.name}`}
      title="Builder Resources"
      description="Checklists, templates, and practical guides for founders, indie hackers, and product teams launching SaaS products faster."
      eyebrow={null}
      lead="Practical resources to improve product clarity, launch speed, and operational leverage."
      actions={false}
    >
      <section className="content-page__section">
        <SectionIntro title="Topics" description="Browse by content type." />
        <div className="content-page__stats-grid">
          <article className="content-page__card">
            <p className="content-page__post-meta">All Resources</p>
            <h3>{allPostsCount}</h3>
          </article>
          <article className="content-page__card">
            <p className="content-page__post-meta">Checklists</p>
            <h3>{checklists.length}</h3>
          </article>
          <article className="content-page__card">
            <p className="content-page__post-meta">Glossary</p>
            <h3>{glossary.length}</h3>
          </article>
          <article className="content-page__card">
            <p className="content-page__post-meta">Templates</p>
            <h3>{templates.length}</h3>
          </article>
        </div>
      </section>

      <section className="content-page__section">
        <SectionIntro title="Checklists" description="Launch and setup checklists for builders moving from idea to product." />
        <div className="content-page__card-grid">
          {checklists.map((page) => (
            <article key={page.slug} className="content-page__card">
              <p className="content-page__post-meta">Checklist • {page.count}</p>
              <h3>
                <Link to={page.path}>{page.title}</Link>
              </h3>
              <p>{page.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-page__section">
        <SectionIntro title="Templates" description="Copy-paste templates for demos, launches, legal pages, and product communication." />
        <div className="content-page__card-grid">
          {templates.map((page) => (
            <article key={page.slug} className="content-page__card">
              <p className="content-page__post-meta">Template • {page.count}</p>
              <h3>
                <Link to={page.path}>{page.title}</Link>
              </h3>
              <p>{page.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-page__section">
        <SectionIntro title="Glossary" description="Fast definitions for startup, product, and go-to-market concepts." />
        <div className="content-page__card-grid">
          {glossary.map((page) => (
            <article key={page.slug} className="content-page__card">
              <p className="content-page__post-meta">Glossary</p>
              <h3>
                <Link to={page.path}>{page.title}</Link>
              </h3>
              <p>{page.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </ContentPage>
  );
}

export function NotFoundPage() {
  return (
    <ContentPage
      title="Page not found"
      description="The page you requested could not be found."
      eyebrow="404"
      lead="Try the homepage, blog, resources, or the starter hub below."
      sections={[]}
      actions={false}
    >
      <RelatedLinks
        title="Popular routes"
        items={[
          { title: "Homepage", to: "/", body: `Return to the main ${brand.name} landing page.` },
          { title: "Blog", to: "/blog", body: "Browse blog guides and comparison content." },
          { title: "Resources", to: "/resources", body: "Open templates, checklists, and glossary content." },
          { title: "Starter Hub", to: "/starter", body: "Open the core starter overview and launch guide." },
        ]}
      />
    </ContentPage>
  );
}
