export function getClerkConfig() {
  return {
    publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "",
    signInUrl: import.meta.env.VITE_CLERK_SIGN_IN_URL || "/sign-in",
    signUpUrl: import.meta.env.VITE_CLERK_SIGN_UP_URL || "/sign-up",
    afterSignInUrl: import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL || "/app",
    afterSignUpUrl: import.meta.env.VITE_CLERK_AFTER_SIGN_UP_URL || "/app",
  };
}

export function isClerkConfigured() {
  return Boolean(getClerkConfig().publishableKey);
}
