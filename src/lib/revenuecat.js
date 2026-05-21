// ─────────────────────────────────────────────────────────────────────────────
// RevenueCat wrapper
//
// Single source of truth for talking to the RevenueCat SDK. All entitlement
// checking, package fetching, purchasing, and restoration goes through here.
// Web is a hard no-op: subscriptions are mobile-only per the product
// decision, and the SDK only loads on Capacitor native.
//
// Entitlement: "premium"
// Packages:    "monthly" ($7.99/mo), "annual" ($59.99/yr)
// ─────────────────────────────────────────────────────────────────────────────

const ENTITLEMENT_ID = "premium";

const isNative = () =>
  typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.();

const getPlatform = () => {
  if (typeof window === "undefined" || !window.Capacitor) return "web";
  return window.Capacitor.getPlatform?.() || "web";
};

const getApiKey = () => {
  const platform = getPlatform();
  if (platform === "ios") return import.meta.env.VITE_REVENUECAT_IOS_KEY || "";
  if (platform === "android") return import.meta.env.VITE_REVENUECAT_ANDROID_KEY || "";
  return "";
};

let configured = false;
let cachedSdk = null;

async function loadSdk() {
  if (cachedSdk) return cachedSdk;
  const mod = await import("@revenuecat/purchases-capacitor");
  cachedSdk = mod;
  return mod;
}

/**
 * Initialize the SDK with the user's Supabase UUID.
 * Safe to call repeatedly; only configures once per session, but always
 * keeps the appUserID in sync.
 */
export async function configureRevenueCat(userId) {
  if (!isNative()) return false;
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[RevenueCat] No API key configured for", getPlatform());
    return false;
  }
  try {
    const { Purchases } = await loadSdk();
    if (!configured) {
      await Purchases.configure({ apiKey, appUserID: userId || undefined });
      configured = true;
    } else if (userId) {
      // Already configured; just align the user identity.
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
 */
export async function revenueCatLogOut() {
  if (!isNative() || !configured) return;
  try {
    const { Purchases } = await loadSdk();
    await Purchases.logOut();
  } catch {
    // Ignore: nothing actionable if log out fails.
  }
}

/**
 * Returns the current "premium" entitlement status. Optimistic: returns
 * false on web or when the SDK isn't loaded.
 */
export async function isPremium() {
  if (!isNative()) return false;
  try {
    const { Purchases } = await loadSdk();
    const info = await Purchases.getCustomerInfo();
    const ent = info?.customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
    return !!ent;
  } catch {
    return false;
  }
}

/**
 * Fetch the current Offering and return its packages indexed by their
 * RevenueCat package type for easy lookup.
 * Returns: { monthly: Package | null, annual: Package | null, raw: Offering | null }
 */
export async function fetchPackages() {
  const empty = { monthly: null, annual: null, raw: null };
  if (!isNative()) return empty;
  try {
    const { Purchases } = await loadSdk();
    const { offerings } = await Purchases.getOfferings();
    const current = offerings?.current;
    if (!current) return empty;
    // Look for packages by RevenueCat's standard identifiers, falling back
    // to a scan of all packages by .packageType.
    const byType = {};
    (current.availablePackages || []).forEach((p) => {
      const t = (p.packageType || "").toLowerCase();
      if (t === "monthly") byType.monthly = p;
      if (t === "annual") byType.annual = p;
    });
    return {
      monthly: byType.monthly || null,
      annual: byType.annual || null,
      raw: current,
    };
  } catch (err) {
    console.error("[RevenueCat] fetchPackages failed:", err);
    return empty;
  }
}

/**
 * Initiate a purchase. Returns { success, premium, cancelled, error }.
 */
export async function purchasePackage(pkg) {
  if (!isNative()) {
    return { success: false, error: "Purchases are only available in the mobile app." };
  }
  if (!pkg) {
    return { success: false, error: "No package selected." };
  }
  try {
    const { Purchases } = await loadSdk();
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    const ent = result?.customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
    return { success: true, premium: !!ent };
  } catch (err) {
    if (err?.userCancelled || err?.code === "PURCHASE_CANCELLED") {
      return { success: false, cancelled: true };
    }
    return { success: false, error: err?.message || "Purchase failed." };
  }
}

/**
 * Restore previous purchases. Apple requires this button to be visible
 * in any app that sells subscriptions.
 */
export async function restorePurchases() {
  if (!isNative()) {
    return { success: false, error: "Restore is only available in the mobile app." };
  }
  try {
    const { Purchases } = await loadSdk();
    const result = await Purchases.restorePurchases();
    const ent = result?.customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
    return { success: true, premium: !!ent };
  } catch (err) {
    return { success: false, error: err?.message || "Could not restore purchases." };
  }
}

/**
 * Subscribe to entitlement changes. Returns an unsubscribe function.
 * Called whenever a purchase completes, a subscription renews, or the
 * webhook server-side change pushes a fresh customer info to the SDK.
 */
export async function onPremiumChange(callback) {
  if (!isNative()) return () => {};
  try {
    const { Purchases } = await loadSdk();
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
