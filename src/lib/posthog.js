import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function initPostHog() {
  if (initialized || !POSTHOG_KEY) return;
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
  posthog.capture(event, properties);
}

export { posthog };
