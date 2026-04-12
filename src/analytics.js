/**
 * Analytics Integration Placeholder
 * -----------------------------------
 * Drop-in hook for page view tracking. Wire up your preferred analytics
 * provider (Google Analytics, Plausible, PostHog, etc.) by replacing the
 * stub inside `trackPageView`.
 *
 * Usage:
 *   import { useAnalytics } from "./analytics";
 *   // Call inside a component rendered on every route:
 *   useAnalytics();
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Send a page view event to your analytics provider.
 * Replace the console.debug with your actual tracking call.
 */
function trackPageView(pathname) {
  // Example integrations (uncomment the one you use):
  //
  // Google Analytics (gtag.js):
  // window.gtag?.("event", "page_view", { page_path: pathname });
  //
  // Plausible:
  // window.plausible?.("pageview");
  //
  // PostHog:
  // window.posthog?.capture("$pageview");

  if (import.meta.env.DEV) {
    console.debug("[analytics] page_view", pathname);
  }
}

/**
 * React hook that fires a page view on every route change.
 */
export function useAnalytics() {
  const { pathname } = useLocation();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
}

/**
 * Track a custom event (button click, form submit, etc.).
 */
export function trackEvent(name, properties = {}) {
  // window.gtag?.("event", name, properties);
  // window.plausible?.(name, { props: properties });
  // window.posthog?.capture(name, properties);

  if (import.meta.env.DEV) {
    console.debug("[analytics] event", name, properties);
  }
}
