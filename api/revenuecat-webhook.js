// RevenueCat webhook endpoint.
//
// RevenueCat sends events to this URL whenever a subscription state
// changes (purchase, renewal, cancellation, expiration, refund, billing
// issue). We use these events as the authoritative source of truth for
// user_settings.is_pro, so the client-side optimistic update can be
// reconciled against the real subscription state.
//
// Configure in RevenueCat Dashboard:
//   - Webhook URL:   https://dreamshepherd.app/api/revenuecat-webhook
//   - Authorization: a long random string saved to env REVENUECAT_WEBHOOK_AUTH
//
// Environment variables required:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY  (needed to bypass RLS on user_settings)
//   - REVENUECAT_WEBHOOK_AUTH    (must match the header RevenueCat sends)

import { createClient } from "@supabase/supabase-js";

// Event types that GRANT the entitlement.
const GRANT_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "NON_RENEWING_PURCHASE",
  "UNCANCELLATION",
  "SUBSCRIPTION_PAUSED", // pause still counts as having the entitlement
]);

// Event types that REVOKE the entitlement: EXPIRATION, REFUND.
// (Listed inline in the dispatch below rather than as a Set since they
// only have two members.)

// Events we intentionally ignore (no entitlement change implied).
const IGNORE_EVENTS = new Set([
  "BILLING_ISSUE",      // grace period; entitlement stays until EXPIRATION
  "CANCELLATION",       // user cancelled but still entitled until period end
  "TEST",
  "TRANSFER",           // anonymous → identified; entitlement follows customer info
]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify the Authorization header matches our shared secret.
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  const received = req.headers.authorization;
  if (!expected) {
    console.error("[RevenueCat webhook] REVENUECAT_WEBHOOK_AUTH not configured");
    return res.status(500).json({ error: "Server misconfigured" });
  }
  if (received !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = req.body || {};
  const event = body.event || {};
  const type = event.type;
  const appUserId = event.app_user_id;

  if (!type || !appUserId) {
    return res.status(400).json({ error: "Missing event type or app_user_id" });
  }

  // Skip aliases (subscription transfers between user IDs). Customer info
  // will re-arrive under the canonical user ID on the next event.
  if (type === "SUBSCRIBER_ALIAS" || type === "TRANSFER" || IGNORE_EVENTS.has(type)) {
    return res.status(200).json({ ok: true, ignored: type });
  }

  // Determine the new is_pro state.
  let nextIsPro;
  if (GRANT_EVENTS.has(type) || type === "SUBSCRIPTION_EXTENDED") {
    nextIsPro = true;
  } else if (type === "EXPIRATION" || type === "REFUND") {
    nextIsPro = false;
  } else {
    // Unknown event type. Log and acknowledge so RevenueCat does not retry.
    console.warn("[RevenueCat webhook] unrecognized event type:", type);
    return res.status(200).json({ ok: true, unrecognized: type });
  }

  // Update user_settings via service role so we bypass RLS.
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[RevenueCat webhook] Supabase env vars missing");
    return res.status(500).json({ error: "Server misconfigured" });
  }
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const { error } = await admin
      .from("user_settings")
      .update({ is_pro: nextIsPro })
      .eq("user_id", appUserId);
    if (error) {
      console.error("[RevenueCat webhook] supabase update failed:", error);
      return res.status(500).json({ error: "DB update failed" });
    }
    return res.status(200).json({ ok: true, user_id: appUserId, is_pro: nextIsPro, event: type });
  } catch (err) {
    console.error("[RevenueCat webhook] handler exception:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
