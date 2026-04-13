import { useEffect, useState } from "react";
import SiteHeader from "../parallel15/02-header.jsx";
import { LowerSectionsFooter } from "../parallel/LowerSections.jsx";
import SeoHead from "../SeoHead.jsx";
import { getClerkConfig, isClerkConfigured } from "../integrations/clerk.js";
import { getPaddleConfig, isPaddleConfigured } from "../integrations/paddle.js";
import { supabase, isSupabaseConfigured } from "../integrations/supabaseClient.js";
import { getApiBaseUrl, apiFetch } from "../lib/apiClient.js";

function StarterShell({ title, description, eyebrow, children, path }) {
  return (
    <div className="content-page">
      <SeoHead title={title} description={description} path={path} appendBrand={false} />
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content">
        <section className="content-page__hero">
          <div className="content-page__hero-inner">
            <span className="content-page__eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p className="content-page__description">{description}</p>
          </div>
        </section>
        <div className="content-page__body">{children}</div>
      </main>
      <LowerSectionsFooter />
    </div>
  );
}

export function AuthStarterPage() {
  const clerk = getClerkConfig();

  const authSteps = [
    "Drop in your Clerk publishable key",
    "Create `/sign-in` and `/sign-up` route pages",
    "Protect one route that matters",
    "Map post-auth onboarding clearly",
  ];

  return (
    <StarterShell
      title="Auth Starter"
      description="Use this page as the visible auth integration surface for Clerk-backed sign-in and sign-up flows."
      eyebrow="Starter UI"
      path="/starter/auth"
    >
      <section className="content-page__section">
        <div className="content-page__card-grid">
          <article className="content-page__card">
            <h3>Configuration status</h3>
            <p>{isClerkConfigured() ? "Clerk publishable key detected." : "Clerk is not configured yet."}</p>
          </article>
          <article className="content-page__card">
            <h3>Suggested next step</h3>
            <p>Add your auth pages and protect one meaningful workflow before building the entire app shell.</p>
          </article>
          <article className="content-page__card">
            <h3>Starter auth UI</h3>
            <form className="content-page__form" onSubmit={(event) => event.preventDefault()}>
              <label>
                Work email
                <input type="email" placeholder="founder@startup.com" />
              </label>
              <label>
                Password
                <input type="password" placeholder="Create a password" />
              </label>
              <button className="button button--small button--primary" type="submit">
                Continue
              </button>
            </form>
          </article>
        </div>
      </section>

      <section className="content-page__section">
        <div className="content-page__section-head">
          <h2>Current auth routes</h2>
        </div>
        <div className="content-page__card-grid">
          <article className="content-page__card">
            <h3>Sign in</h3>
            <p>{clerk.signInUrl}</p>
          </article>
          <article className="content-page__card">
            <h3>Sign up</h3>
            <p>{clerk.signUpUrl}</p>
          </article>
          <article className="content-page__card">
            <h3>After sign in</h3>
            <p>{clerk.afterSignInUrl}</p>
          </article>
          <article className="content-page__card">
            <h3>After sign up</h3>
            <p>{clerk.afterSignUpUrl}</p>
          </article>
        </div>
      </section>

      <section className="content-page__section">
        <div className="content-page__section-head">
          <h2>Recommended auth sequence</h2>
        </div>
        <ul className="content-page__list">
          {authSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>
    </StarterShell>
  );
}

export function BillingStarterPage() {
  const paddle = getPaddleConfig();

  const plans = [
    { name: "Free", price: "$0", note: "Validate the core workflow" },
    { name: "Starter", price: "$29", note: "Your first paid offer" },
    { name: "Growth", price: "$99", note: "Expand for teams and retained users" },
  ];

  return (
    <StarterShell
      title="Billing Starter"
      description="Use this page as the visible billing integration surface for Paddle-backed pricing and checkout flows."
      eyebrow="Starter UI"
      path="/starter/billing"
    >
      <section className="content-page__section">
        <div className="content-page__card-grid">
          <article className="content-page__card">
            <h3>Environment</h3>
            <p>{paddle.environment}</p>
          </article>
          <article className="content-page__card">
            <h3>Status</h3>
            <p>{isPaddleConfigured() ? "Paddle client token and price id detected." : "Paddle is not configured yet."}</p>
          </article>
          <article className="content-page__card">
            <h3>Recommended flow</h3>
            <p>Map one clear upgrade path, one paid plan, and one post-checkout success state before adding more billing complexity.</p>
          </article>
        </div>
      </section>

      <section className="content-page__section">
        <div className="content-page__section-head">
          <h2>Starter pricing surface</h2>
        </div>
        <div className="content-page__card-grid">
          {plans.map((plan) => (
            <article key={plan.name} className="content-page__card">
              <h3>{plan.name}</h3>
              <p className="content-page__price">{plan.price}</p>
              <p>{plan.note}</p>
              <button className="button button--small button--primary" type="button">
                Start {plan.name}
              </button>
            </article>
          ))}
        </div>
      </section>
    </StarterShell>
  );
}

export function ProviderStatusPage() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [supabaseCheck, setSupabaseCheck] = useState("idle");

  useEffect(() => {
    let active = true;

    apiFetch("/api/providers")
      .then((data) => {
        if (active) {
          setStatus(data.providers || {});
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Unable to load provider status.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured || !supabase) {
      setSupabaseCheck("not-configured");
      return undefined;
    }

    supabase.auth
      .getSession()
      .then(() => {
        if (active) {
          setSupabaseCheck("reachable");
        }
      })
      .catch(() => {
        if (active) {
          setSupabaseCheck("error");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <StarterShell
      title="Provider Status"
      description={`Check which backend integrations are wired at ${getApiBaseUrl()}.`}
      eyebrow="Starter UI"
      path="/starter/providers"
    >
      <section className="content-page__section">
        <div className="content-page__card-grid">
          <article className="content-page__card">
            <h3>Frontend Supabase status</h3>
            <p>
              {supabaseCheck === "reachable"
                ? "Supabase client initialized successfully."
                : supabaseCheck === "error"
                  ? "Supabase keys exist but the client check failed."
                  : supabaseCheck === "not-configured"
                    ? "Supabase is not configured on the frontend yet."
                    : "Checking Supabase..."}
            </p>
          </article>
        </div>
      </section>

      <section className="content-page__section">
        {error ? <p>{error}</p> : null}
        {!status && !error ? <p>Loading provider status...</p> : null}
        {status ? (
          <div className="content-page__card-grid">
            {Object.entries(status).map(([provider, values]) => (
              <article key={provider} className="content-page__card">
                <h3>{provider}</h3>
                <ul className="content-page__list">
                  {Object.entries(values).map(([key, enabled]) => (
                    <li key={key}>{key}: {enabled ? "configured" : "missing"}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </StarterShell>
  );
}

export function MobilePublishingPage() {
  return (
    <StarterShell
      title="Mobile Publishing Starter"
      description="Use this page as the starting point for packaging the app for Android and preparing a Play Store release."
      eyebrow="Starter UI"
      path="/starter/mobile"
    >
      <section className="content-page__section">
        <div className="content-page__card-grid">
          <article className="content-page__card">
            <h3>Build order</h3>
            <p>Build web assets, sync Capacitor, create the Android project, configure signing, build the AAB, then publish to internal testing first.</p>
          </article>
          <article className="content-page__card">
            <h3>Required assets</h3>
            <p>App id, privacy policy URL, feature graphic, screenshots, release notes, and a signing key kept outside git.</p>
          </article>
          <article className="content-page__card">
            <h3>Docs</h3>
            <p>See `docs/android-app-template.md`, `docs/play-store-publishing.md`, and `docs/skills/play-store-publishing-skill.md`.</p>
          </article>
        </div>
      </section>

      <section className="content-page__section">
        <div className="content-page__section-head">
          <h2>Publishing sequence</h2>
        </div>
        <ul className="content-page__list">
          <li>Run `npm run build`</li>
          <li>Sync the Capacitor Android project</li>
          <li>Create a signed AAB</li>
          <li>Upload to internal testing first</li>
          <li>Complete data safety and release notes</li>
        </ul>
      </section>
    </StarterShell>
  );
}
