import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

const isNative = () =>
  typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.();

let initialized = false;

export function initPostHog() {
  // Only capture in production builds. `npm run dev` (localhost) is import.meta
  // .env.PROD === false, so local development never pollutes the production
  // analytics project. The native app ships a `vite build` bundle (PROD ===
  // true), so capture stays on there. Mirrors the service-worker PROD-only gate.
  if (initialized || !POSTHOG_KEY || !import.meta.env.PROD) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage",
  });
  initialized = true;
}

export function identifyUser(userId, properties) {
  if (!initialized) return;
  posthog.identify(userId, properties);
}

export function resetUser() {
  if (!initialized) return;
  posthog.reset();
}

export function trackEvent(event, properties) {
  if (!initialized) return;
  // On native (Capacitor webview), send immediately instead of batching, so
  // events aren't stuck in the request queue when the app is backgrounded or
  // killed. On web the default batching is fine: posthog-js flushes the queue
  // on pagehide / visibilitychange / beforeunload.
  posthog.capture(event, properties, isNative() ? { send_instantly: true } : undefined);
}

export { posthog };
