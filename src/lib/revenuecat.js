// ─────────────────────────────────────────────────────────────────────────────
// RevenueCat wrapper
//
// Single source of truth for talking to the RevenueCat SDK + UI plugin.
// Configuration, paywall presentation, customer center, entitlement
// checking, and restoration all go through here. Web is a hard no-op
// since subscriptions are mobile-only per product decision.
//
// Entitlement: "Dreamshepherd Pro" (must match the identifier in the
//   RevenueCat Dashboard -> Product catalog -> Entitlements exactly).
// Offering: "default"
// Packages (from RevenueCat Dashboard offering):
//   - $rc_monthly ($7.99/mo)
//   - $rc_annual  ($59.99/yr)
//
// API keys (public SDK keys, safe to ship in the client):
//   RevenueCat issues a separate public key per store/app. Use the one that
//   matches the running platform.
//     iOS App Store -> "appl_..."  (env: VITE_REVENUECAT_IOS_KEY)
//     Google Play   -> "goog_..."  (env: VITE_REVENUECAT_ANDROID_KEY)
//   A "test_" key targets RevenueCat's Test Store, not the real App/Play
//   store, so it will NOT return your App Store Connect products. Use the
//   "appl_" key for real iOS purchases and submission.
//   VITE_REVENUECAT_API_KEY is honored as a fallback for a single-key setup.
// ─────────────────────────────────────────────────────────────────────────────

const ENTITLEMENT_ID = "Dreamshepherd Pro";

// Treat the user as entitled if the named entitlement is active. As a
// safety net against a dashboard/code identifier mismatch (which would
// silently lock paying customers out of Pro), also honor ANY active
// entitlement, since Dream Shepherd sells exactly one paid tier. If the
// fallback ever fires, the dashboard identifier differs from ENTITLEMENT_ID
// and the two should be reconciled.
function entitledFrom(entitlements) {
  const active = entitlements?.active || {};
  if (active[ENTITLEMENT_ID]) return true;
  const keys = Object.keys(active);
  if (keys.length > 0) {
    if (import.meta.env.DEV) {
      console.warn(
        `[RevenueCat] entitlement "${ENTITLEMENT_ID}" not found, but active ` +
        `entitlements exist: ${keys.join(", ")}. Update ENTITLEMENT_ID to match.`
      );
    }
    return true;
  }
  return false;
}

const isNative = () =>
  typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.();

const getApiKey = () => {
  const env = import.meta.env;
  const platform =
    (typeof window !== "undefined" && window.Capacitor?.getPlatform?.()) || "web";
  if (platform === "ios" && env.VITE_REVENUECAT_IOS_KEY) return env.VITE_REVENUECAT_IOS_KEY;
  if (platform === "android" && env.VITE_REVENUECAT_ANDROID_KEY) return env.VITE_REVENUECAT_ANDROID_KEY;
  return env.VITE_REVENUECAT_API_KEY || "";
};

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
    return entitledFrom(info?.customerInfo?.entitlements);
  } catch {
    return false;
  }
}

/**
 * Fetch the configured "current" Offering and group packages by type so
 * the upgrade modal can pick the plan the user selected. Returns
 * monthly/annual keys (either may be null if not configured in the
 * dashboard). `raw` is the full Offering for any advanced use.
 */
export async function fetchPackages() {
  const empty = { monthly: null, annual: null, raw: null };
  if (!isNative()) return empty;
  try {
    const { Purchases } = await loadCore();
    const { offerings } = await Purchases.getOfferings();
    const current = offerings?.current;
    if (!current) return empty;
    const byType = { monthly: null, annual: null };
    (current.availablePackages || []).forEach((p) => {
      const t = (p.packageType || "").toLowerCase();
      if (t === "monthly") byType.monthly = p;
      else if (t === "annual" || t === "yearly") byType.annual = p;
    });
    return { ...byType, raw: current };
  } catch (err) {
    console.error("[RevenueCat] fetchPackages failed:", err);
    return empty;
  }
}

/**
 * Purchase a specific package. This is the primary purchase path: the
 * custom on-brand upgrade modal calls it with the package matching the
 * user's selected plan. Apple/Google show their own native payment sheet;
 * everything around it is our own UI.
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
    return { success: true, entitled: entitledFrom(result?.customerInfo?.entitlements) };
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
    return { success: true, entitled: entitledFrom(result?.customerInfo?.entitlements) };
  } catch (err) {
    return { success: false, error: err?.message || "Could not restore purchases." };
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
      callback(entitledFrom(info?.entitlements));
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
