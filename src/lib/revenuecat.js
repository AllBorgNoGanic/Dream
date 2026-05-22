// ─────────────────────────────────────────────────────────────────────────────
// RevenueCat wrapper
//
// Single source of truth for talking to the RevenueCat SDK + UI plugin.
// Configuration, paywall presentation, customer center, entitlement
// checking, and restoration all go through here. Web is a hard no-op
// since subscriptions are mobile-only per product decision.
//
// Entitlement: "Dream Shepherd Unlimited"
// Packages (from RevenueCat Dashboard offering):
//   - monthly  ($7.99/mo)
//   - yearly   (annual)
//   - lifetime (one-time)
//
// API key:
//   RevenueCat now uses a single unified API key per project rather than
//   separate iOS/Android keys. The "test_" prefix denotes the sandbox key.
//   Set via env: VITE_REVENUECAT_API_KEY
// ─────────────────────────────────────────────────────────────────────────────

const ENTITLEMENT_ID = "Dream Shepherd Unlimited";

const isNative = () =>
  typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.();

const getApiKey = () => import.meta.env.VITE_REVENUECAT_API_KEY || "";

let configured = false;
let cachedCore = null;
let cachedUi = null;

async function loadCore() {
  if (cachedCore) return cachedCore;
  const mod = await import("@revenuecat/purchases-capacitor");
  cachedCore = mod;
  return mod;
}

async function loadUi() {
  if (cachedUi) return cachedUi;
  const mod = await import("@revenuecat/purchases-capacitor-ui");
  cachedUi = mod;
  return mod;
}

/**
 * Initialize the SDK with the user's Supabase UUID.
 * Safe to call repeatedly. Configures once per session; keeps appUserID
 * in sync via logIn() if the user changes.
 */
export async function configureRevenueCat(userId) {
  if (!isNative()) return false;
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[RevenueCat] VITE_REVENUECAT_API_KEY not configured");
    return false;
  }
  try {
    const { Purchases, LOG_LEVEL } = await loadCore();
    if (!configured) {
      // Verbose logs during development make it easy to see why a purchase
      // failed (Apple sandbox issues, missing entitlement, etc.).
      if (import.meta.env.DEV && LOG_LEVEL?.DEBUG !== undefined) {
        try { await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG }); } catch { /* noop */ }
      }
      await Purchases.configure({ apiKey, appUserID: userId || undefined });
      configured = true;
    } else if (userId) {
      // Already configured; just align the user identity. logIn is
      // idempotent on the same appUserID.
      await Purchases.logIn({ appUserID: userId });
    }
    return true;
  } catch (err) {
    console.error("[RevenueCat] configure failed:", err);
    return false;
  }
}

/**
 * Disassociate the current user from RevenueCat (e.g. on sign out).
 * Keeps the SDK configured so we can configure again with the next user
 * without paying the init cost twice.
 */
export async function revenueCatLogOut() {
  if (!isNative() || !configured) return;
  try {
    const { Purchases } = await loadCore();
    await Purchases.logOut();
  } catch {
    // Nothing actionable if logout fails.
  }
}

/**
 * Pull current entitlement status from RevenueCat. Optimistic: returns
 * false on web or when the SDK is unreachable.
 */
export async function isEntitled() {
  if (!isNative()) return false;
  try {
    const { Purchases } = await loadCore();
    const info = await Purchases.getCustomerInfo();
    const ent = info?.customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
    return !!ent;
  } catch {
    return false;
  }
}

/**
 * Fetch the configured "current" Offering and group packages by type so
 * UI can pick the one the user selected. Returns lifetime/yearly/monthly
 * keys (any may be null if not configured in the dashboard).
 */
export async function fetchPackages() {
  const empty = { lifetime: null, yearly: null, monthly: null, raw: null };
  if (!isNative()) return empty;
  try {
    const { Purchases } = await loadCore();
    const { offerings } = await Purchases.getOfferings();
    const current = offerings?.current;
    if (!current) return empty;
    const byType = { lifetime: null, yearly: null, monthly: null };
    (current.availablePackages || []).forEach((p) => {
      const t = (p.packageType || "").toLowerCase();
      if (t === "lifetime") byType.lifetime = p;
      else if (t === "annual" || t === "yearly") byType.yearly = p;
      else if (t === "monthly") byType.monthly = p;
    });
    return { ...byType, raw: current };
  } catch (err) {
    console.error("[RevenueCat] fetchPackages failed:", err);
    return empty;
  }
}

/**
 * Manually purchase a specific package (used by the custom modal as a
 * fallback path). The hosted paywall (presentPaywall) is the preferred
 * primary purchase flow.
 */
export async function purchasePackage(pkg) {
  if (!isNative()) {
    return { success: false, error: "Purchases are only available in the mobile app." };
  }
  if (!pkg) {
    return { success: false, error: "No package selected." };
  }
  try {
    const { Purchases } = await loadCore();
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    const ent = result?.customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
    return { success: true, entitled: !!ent };
  } catch (err) {
    if (err?.userCancelled || err?.code === "PURCHASE_CANCELLED") {
      return { success: false, cancelled: true };
    }
    return { success: false, error: err?.message || "Purchase failed." };
  }
}

/**
 * Restore previous purchases. Apple requires a visible restore button
 * in any app that sells subscriptions. We expose this both directly and
 * via the Customer Center.
 */
export async function restorePurchases() {
  if (!isNative()) {
    return { success: false, error: "Restore is only available in the mobile app." };
  }
  try {
    const { Purchases } = await loadCore();
    const result = await Purchases.restorePurchases();
    const ent = result?.customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
    return { success: true, entitled: !!ent };
  } catch (err) {
    return { success: false, error: err?.message || "Could not restore purchases." };
  }
}

/**
 * Present the RevenueCat-hosted paywall. The paywall layout and copy
 * are configured in the RevenueCat dashboard, so updates ship without
 * an app release. Returns:
 *   { result: "PURCHASED" | "RESTORED" | "CANCELLED" | "ERROR" | "NOT_PRESENTED",
 *     entitled: boolean }
 */
export async function presentPaywall({ requiredEntitlement } = {}) {
  if (!isNative()) {
    return { result: "NOT_PRESENTED", entitled: false };
  }
  try {
    const { RevenueCatUI, PAYWALL_RESULT } = await loadUi();
    const args = requiredEntitlement ? { requiredEntitlementIdentifier: requiredEntitlement } : undefined;
    const fn = requiredEntitlement
      ? RevenueCatUI.presentPaywallIfNeeded.bind(RevenueCatUI)
      : RevenueCatUI.presentPaywall.bind(RevenueCatUI);
    const { result } = await fn(args);
    // Resolve current entitlement state after the paywall closes.
    const entitled = await isEntitled();
    return {
      result: result || "ERROR",
      entitled,
      purchased: result === PAYWALL_RESULT?.PURCHASED,
      restored: result === PAYWALL_RESULT?.RESTORED,
      cancelled: result === PAYWALL_RESULT?.CANCELLED,
    };
  } catch (err) {
    console.error("[RevenueCat] presentPaywall failed:", err);
    return { result: "ERROR", entitled: false, error: err?.message };
  }
}

/**
 * Present the RevenueCat Customer Center. Native screen that lets the
 * user view their subscription, restore purchases, change plans, and
 * cancel. RevenueCat handles all of it; we just open it.
 */
export async function presentCustomerCenter() {
  if (!isNative()) {
    return { success: false, error: "Subscription management is only available in the mobile app." };
  }
  try {
    const { RevenueCatUI } = await loadUi();
    await RevenueCatUI.presentCustomerCenter();
    return { success: true };
  } catch (err) {
    console.error("[RevenueCat] presentCustomerCenter failed:", err);
    return { success: false, error: err?.message };
  }
}

/**
 * Subscribe to entitlement changes pushed by the SDK. Fires whenever a
 * purchase completes, a subscription renews, the user cancels, or the
 * server-side webhook reconciliation propagates back. Callback receives
 * a boolean (true = entitled).
 */
export async function onEntitlementChange(callback) {
  if (!isNative()) return () => {};
  try {
    const { Purchases } = await loadCore();
    const handle = await Purchases.addCustomerInfoUpdateListener((info) => {
      const ent = info?.entitlements?.active?.[ENTITLEMENT_ID];
      callback(!!ent);
    });
    return () => {
      try {
        Purchases.removeCustomerInfoUpdateListener(handle);
      } catch {
        // ignore
      }
    };
  } catch {
    return () => {};
  }
}

export const REVENUECAT_ENTITLEMENT = ENTITLEMENT_ID;
