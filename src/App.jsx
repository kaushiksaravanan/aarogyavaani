import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";
import { useAnalytics } from "./analytics";
import { HeroSection } from "./parallel/HeroTop";
import MiddleSections from "./parallel/MiddleSections";
import LowerSections from "./parallel/LowerSections";
import SiteHeader from "./parallel15/02-header";
import StarterHub from "./starter/StarterHub.jsx";
import {
  AuthStarterPage,
  BillingStarterPage,
  ProviderStatusPage,
  MobilePublishingPage,
} from "./starter/StarterPages.jsx";
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
} from "./siteContent.js";
import {
  blogPostMap,
  checklistPageMap,
  templatePageMap,
  glossaryPageMap,
  blogIndexPosts,
} from "./siteRoutes.js";

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
      <Route path="/starter" element={<StarterHub />} />
      <Route path="/starter/auth" element={<AuthStarterPage />} />
      <Route path="/starter/billing" element={<BillingStarterPage />} />
      <Route path="/starter/providers" element={<ProviderStatusPage />} />
      <Route path="/starter/mobile" element={<MobilePublishingPage />} />
      <Route path="/about" element={<MarketingPage page={companyPages.about} />} />
      <Route path="/contact" element={<MarketingPage page={companyPages.contact} />} />
      <Route path="/policy" element={<MarketingPage page={legalPages.policy} />} />
      <Route path="/terms" element={<MarketingPage page={legalPages.terms} />} />
      <Route path="/privacy-policy" element={<MarketingPage page={legalPages.policy} />} />

      <Route path="/stack/supabase" element={<MarketingPage page={toolPages.supabase} />} />
      <Route path="/stack/clerk" element={<MarketingPage page={toolPages.clerk} />} />
      <Route path="/stack/paddle" element={<MarketingPage page={toolPages.paddle} />} />

      <Route path="/use-case/hackathons" element={<MarketingPage page={useCasePages.hackathons} />} />
      <Route path="/use-case/10k-mrr-saas" element={<MarketingPage page={useCasePages["10k-mrr-saas"]} />} />

      <Route path="/alternative/blank-repo" element={<MarketingPage page={alternativePages["blank-repo"]} />} />

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
