# RevenueCat setup checklist

The app code is wired up and ready. To actually accept payments you need
to configure RevenueCat, App Store Connect, and Google Play Console.
This file is the checklist; once everything below is done, the app will
process real subscriptions.

## 1. App Store Connect (one-time, ~30 min)

1. Sign in at appstoreconnect.apple.com
2. My Apps → Dream Shepherd → Subscriptions → Create new subscription group
   - Name: **Dream Shepherd Premium**
   - Reference name: `premium`
3. Inside the group, create two subscriptions:
   - **Monthly**
     - Product ID: `dreamshepherd.monthly`
     - Subscription duration: 1 month
     - Price: $7.99 USD (Apple auto-converts other currencies)
     - Display name: "Dream Shepherd Monthly"
     - Description: "Unlimited dream interpretations, visualizations, and prayers."
   - **Annual**
     - Product ID: `dreamshepherd.annual`
     - Subscription duration: 1 year
     - Price: $59.99 USD
     - Display name: "Dream Shepherd Annual"
     - Description: "Save 37%. Unlimited dream interpretations, visualizations, and prayers."
4. Status of each will show "Missing Metadata" → fill review notes:
   - "This subscription unlocks unlimited AI dream interpretations and
     dream art visualizations. Free users get 5 interpretations to start."
5. Both products should land in **"Ready to Submit"** within a few hours.
   Apple sometimes requires the first build to be uploaded before products
   activate, so this can wait until you're closer to submission.

## 2. Google Play Console (one-time, ~30 min)

1. Sign in at play.google.com/console
2. Monetize → Subscriptions → Create subscription
   - Product ID: `dreamshepherd.monthly` (must match Apple)
   - Base plan: monthly, autorenewing, $7.99
3. Repeat for `dreamshepherd.annual` at $59.99
4. Activate both subscriptions

## 3. RevenueCat (one-time, ~15 min)

1. Sign up at revenuecat.com (free tier covers up to $2.5K/mo revenue)
2. Create a new **Project** named "Dream Shepherd"
3. Add an **App** for each platform:
   - iOS: bundle ID matches your Capacitor app ID
   - Android: package name matches your Capacitor app ID
4. Connect each platform's store:
   - iOS: paste your App Store Connect shared secret
   - Android: upload the service account JSON from Google Play Console
5. Create the **Entitlement**:
   - Identifier: **`premium`**  ← MUST match the constant in
     `src/lib/revenuecat.js`
6. Create **Products**, importing from the stores:
   - `dreamshepherd.monthly`
   - `dreamshepherd.annual`
7. Attach both products to the `premium` entitlement.
8. Create an **Offering**:
   - Identifier: **`default`** (RevenueCat auto-uses this)
   - Add two packages:
     - Package type: **Monthly**, product: `dreamshepherd.monthly`
     - Package type: **Annual**, product: `dreamshepherd.annual`
   - Mark as current offering
9. Grab the **public SDK keys** from Project → API keys:
   - iOS public key → set as `VITE_REVENUECAT_IOS_KEY` env var
   - Android public key → set as `VITE_REVENUECAT_ANDROID_KEY` env var

## 4. Webhook (one-time, ~5 min)

1. RevenueCat → Project → Integrations → Webhooks → Add webhook
2. URL: `https://dreamshepherd.app/api/revenuecat-webhook`
3. Authorization header: generate a long random string (1Password is fine)
   - Save the same string as `REVENUECAT_WEBHOOK_AUTH` in your Vercel env vars
4. Subscribe to all events. The handler ignores the ones that aren't
   actionable; the rest update `user_settings.is_pro` automatically.

## 5. Vercel environment variables

In Vercel → dreamshepherd → Settings → Environment Variables, add:

- `VITE_REVENUECAT_IOS_KEY` (public SDK key from step 3.9)
- `VITE_REVENUECAT_ANDROID_KEY` (public SDK key from step 3.9)
- `REVENUECAT_WEBHOOK_AUTH` (from step 4.3)
- `SUPABASE_URL` (your project URL, used by the webhook to update is_pro)
- `SUPABASE_SERVICE_ROLE_KEY` (already set, used by webhook to bypass RLS)

Trigger a redeploy after saving.

## 6. Capacitor sync

After updating `package.json` (`@revenuecat/purchases-capacitor`
already installed by the agent), run:

```bash
npm install
npm run build
npx cap sync ios
npx cap sync android
```

Then open Xcode (`npx cap open ios`) and confirm:
- The RevenueCat pod installed correctly (Pods/Purchases visible)
- `Info.plist` has no missing keys

## 7. Sandbox testing (Apple, ~10 min)

1. App Store Connect → Users and Access → Sandbox Testers → Create one
2. On a real iPhone (sandbox doesn't work in the simulator reliably):
   - Settings → App Store → sign out of your real Apple ID
   - Sign in with the sandbox tester ID
3. Run the app from Xcode
4. Tap **Support the work** → confirm purchase flow runs
5. Verify in Supabase that `user_settings.is_pro = true` for your row
6. Test **Restore previous purchases** on a fresh install

## Done

Once the above is complete, the app is monetized. The code is fully
written; this is configuration only.
