import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";
import { useAnalytics } from "./analytics";
import { HeroSection } from "./parallel/HeroTop";
import MiddleSections from "./parallel/MiddleSections";
import LowerSections from "./parallel/LowerSections";
import SiteHeader from "./parallel15/02-header";
import {
  MarketingPage,
  BlogIndexPage,
  BlogArticlePage,
  ChecklistPage,
  ResourceArticlePage,
  ResourcesPage,
  NotFoundPage,
} from "./SiteLayout";
import {
  companyPages,
  legalPages,
  toolPages,
  useCasePages,
  alternativePages,
  blogPosts,
  checklistPages,
  templatePages,
  glossaryPages,
} from "./siteContent";

function withRouteMeta(collection, basePath) {
  return Object.entries(collection).reduce((accumulator, [slug, page]) => {
    accumulator[slug] = { ...page, slug, path: `${basePath}/${slug}` };
    return accumulator;
  }, {});
}

const blogPostMap = withRouteMeta(blogPosts, "/blog");
const checklistPageMap = withRouteMeta(checklistPages, "/resources/checklists");
const templatePageMap = withRouteMeta(templatePages, "/resources/templates");
const glossaryPageMap = withRouteMeta(glossaryPages, "/resources/glossary");

const relatedBlogPosts = Object.values(blogPostMap).map((post) => ({
  title: post.title,
  to: post.path,
  body: post.excerpt,
}));

const relatedChecklistPages = Object.values(checklistPageMap).map((page) => ({
  title: page.title,
  to: page.path,
  body: page.excerpt,
}));

const relatedTemplatePages = Object.values(templatePageMap).map((page) => ({
  title: page.title,
  to: page.path,
  body: page.excerpt,
}));

const relatedGlossaryPages = Object.values(glossaryPageMap).map((page) => ({
  title: page.title,
  to: page.path,
  body: page.excerpt,
}));

const blogIndexOrder = [
  "best-git-reporting-tools",
  "dora-metrics-guide",
  "best-async-standup-tools",
  "how-to-track-developer-activity-with-git-reports",
  "how-to-add-git-reporting-tool-to-your-repository",
  "pull-request-template",
  "github-pull-request-template",
  "github-activity-digest-notification-tools",
  "bitbucket-analytics-metrics-team-guide",
  "sprint-report-guide",
  "engineering-metrics-guide",
  "developer-productivity-metrics",
];

const orderedBlogPosts = blogIndexOrder.map((slug) => blogPostMap[slug]).filter(Boolean);
const blogIndexPosts = [
  ...orderedBlogPosts,
  ...Object.values(blogPostMap).filter((post) => !blogIndexOrder.includes(post.slug)),
];

function HomePage() {
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content">
        <HeroSection />
        <MiddleSections />
        <LowerSections
          yearlyBilling={yearlyBilling}
          setYearlyBilling={setYearlyBilling}
          openFaq={openFaq}
          setOpenFaq={setOpenFaq}
        />
      </main>
    </div>
  );
}

function AppRoutes() {
  useAnalytics();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<MarketingPage page={companyPages.about} />} />
      <Route path="/contact" element={<MarketingPage page={companyPages.contact} />} />
      <Route path="/policy" element={<MarketingPage page={legalPages.policy} />} />
      <Route path="/terms" element={<MarketingPage page={legalPages.terms} />} />
      <Route path="/privacy-policy" element={<MarketingPage page={legalPages.policy} />} />

      <Route path="/git-reporting/tool/github" element={<MarketingPage page={toolPages.github} />} />
      <Route path="/git-reporting/tool/gitlab" element={<MarketingPage page={toolPages.gitlab} />} />
      <Route path="/git-reporting/tool/bitbucket" element={<MarketingPage page={toolPages.bitbucket} />} />

      <Route path="/use-case/standup-reports" element={<MarketingPage page={useCasePages["standup-reports"]} />} />
      <Route path="/use-case/sprint-reports" element={<MarketingPage page={useCasePages["sprint-reports"]} />} />
      <Route
        path="/use-case/developer-productivity-reports"
        element={<MarketingPage page={useCasePages["developer-productivity-reports"]} />}
      />
      <Route
        path="/use-case/engineering-manager-reports"
        element={<MarketingPage page={useCasePages["engineering-manager-reports"]} />}
      />
      <Route path="/use-case/async-standups" element={<MarketingPage page={useCasePages["async-standups"]} />} />
      <Route
        path="/use-case/cto-engineering-visibility"
        element={<MarketingPage page={useCasePages["cto-engineering-visibility"]} />}
      />

      <Route path="/alternative/geekbot" element={<MarketingPage page={alternativePages.geekbot} />} />
      <Route path="/alternative/linearb" element={<MarketingPage page={alternativePages.linearb} />} />
      <Route path="/alternative/keypup" element={<MarketingPage page={alternativePages.keypup} />} />
      <Route path="/alternative/swarmia" element={<MarketingPage page={alternativePages.swarmia} />} />
      <Route path="/alternative/standuply" element={<MarketingPage page={alternativePages.standuply} />} />

      <Route path="/blog" element={<BlogIndexPage posts={blogIndexPosts} />} />
      {Object.values(blogPostMap).map((post) => (
        <Route
          key={post.path}
          path={post.path}
          element={<BlogArticlePage post={post} relatedPosts={relatedBlogPosts.filter((item) => item.to !== post.path).slice(0, 3)} />}
        />
      ))}

      <Route
        path="/resources"
        element={
          <ResourcesPage
            checklists={Object.values(checklistPageMap)}
            templates={Object.values(templatePageMap)}
            glossary={Object.values(glossaryPageMap)}
            allPostsCount={Object.keys(checklistPageMap).length + Object.keys(templatePageMap).length + Object.keys(glossaryPageMap).length}
          />
        }
      />
      {Object.values(checklistPageMap).map((page) => (
        <Route
          key={page.path}
          path={page.path}
          element={<ChecklistPage page={page} relatedPages={relatedChecklistPages.filter((item) => item.to !== page.path)} />}
        />
      ))}
      {Object.values(templatePageMap).map((page) => (
        <Route
          key={page.path}
          path={page.path}
          element={<ResourceArticlePage page={page} typeLabel="Template" relatedPages={relatedTemplatePages.filter((item) => item.to !== page.path)} />}
        />
      ))}
      {Object.values(glossaryPageMap).map((page) => (
        <Route
          key={page.path}
          path={page.path}
          element={<ResourceArticlePage page={page} typeLabel="Glossary" relatedPages={relatedGlossaryPages.filter((item) => item.to !== page.path)} />}
        />
      ))}

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
