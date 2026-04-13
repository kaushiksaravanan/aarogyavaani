export function getPaddleConfig() {
  return {
    environment: import.meta.env.VITE_PADDLE_ENV || "sandbox",
    clientToken: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || "",
    priceId: import.meta.env.VITE_PADDLE_PRICE_ID || "",
  };
}

export function isPaddleConfigured() {
  const config = getPaddleConfig();
  return Boolean(config.clientToken && config.priceId);
}
