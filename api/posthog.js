import { PostHog } from "posthog-node";

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || "https://us.i.posthog.com";

export function createPostHogClient() {
  return new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });
}
