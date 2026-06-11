// RevenueCat webhook endpoint.
//
// RevenueCat POSTs an event here whenever a subscription state changes
// (purchase, renewal, cancellation, expiration, refund, billing issue).
// These events are the authoritative source of truth for
// user_settings.is_pro, reconciling the client's optimistic update against
// the real subscription state, including changes that happen while the app
// is closed (such as an expiration or a refund).
//
// Configure in RevenueCat Dashboard
//   (Project settings -> Integrations -> Webhooks):
//   - URL:           https://dreamshepherd.app/api/revenuecat-webhook
//   - Authorization: the exact string stored in env REVENUECAT_WEBHOOK_AUTH
//
// Required Vercel environment variables:
//   - REVENUECAT_WEBHOOK_AUTH    (must match the Authorization header RC sends)
//   - SUPABASE_SERVICE_ROLE_KEY  (bypasses RLS on user_settings)
//   - SUPABASE_URL or VITE_SUPABASE_URL

import { createClient } from "@supabase/supabase-js";

// Event types that GRANT the entitlement (user currently has access).
const GRANT_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "NON_RENEWING_PURCHASE",
  "UNCANCELLATION",
  "SUBSCRIPTION_EXTENDED",
  "SUBSCRIPTION_PAUSED", // access continues until the current period ends
]);

// Event types that REVOKE the entitlement (access has ended).
const REVOKE_EVENTS = new Set([
  "EXPIRATION",
  "REFUND",
]);

// Events that imply no entitlement change, or that the client reconciles
// on its own. Acknowledged with 200 so RevenueCat does not retry them.
//   BILLING_ISSUE    -> grace period; entitlement stays until EXPIRATION
//   CANCELLATION     -> auto-renew off but still entitled until period end
//   TRANSFER /
//   SUBSCRIBER_ALIAS -> identity moves; these may not carry a single
//                       app_user_id, and the client resyncs is_pro on launch
//                       via getCustomerInfo (a RENEWAL/EXPIRATION also follows
//                       under the canonical user id)
//   TEST             -> dashboard "send test event"
const IGNORE_EVENTS = new Set([
  "BILLING_ISSUE",
  "CANCELLATION",
  "TRANSFER",
  "SUBSCRIBER_ALIAS",
  "TEST",
]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate the request against the shared secret RevenueCat sends.
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!expected) {
    console.error("[RevenueCat webhook] REVENUECAT_WEBHOOK_AUTH not configured");
    return res.status(500).json({ error: "Server misconfigured" });
  }
  if (req.headers.authorization !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const event = (req.body && req.body.event) || {};
  const type = event.type;
  if (!type) {
    return res.status(400).json({ error: "Missing event type" });
  }

  // Acknowledge no-op events before requiring a subscriber id, since TRANSFER
  // and SUBSCRIBER_ALIAS may not carry a single app_user_id.
  if (IGNORE_EVENTS.has(type)) {
    return res.status(200).json({ ok: true, ignored: type });
  }

  let nextIsPro;
  if (GRANT_EVENTS.has(type)) {
    nextIsPro = true;
  } else if (REVOKE_EVENTS.has(type)) {
    nextIsPro = false;
  } else {
    // Unknown event type. Acknowledge so RevenueCat does not retry, but log
    // it so we can decide whether it needs handling.
    console.warn("[RevenueCat webhook] unrecognized event type:", type);
    return res.status(200).json({ ok: true, unrecognized: type });
  }

  const appUserId = event.app_user_id;
  if (!appUserId) {
    return res.status(400).json({ error: "Missing app_user_id" });
  }

  // Update user_settings via the service role so we bypass RLS. If app_user_id
  // is a RevenueCat anonymous id (purchase before logIn), no row matches and
  // the update is a harmless no-op; the client reconciles on next launch.
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
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
