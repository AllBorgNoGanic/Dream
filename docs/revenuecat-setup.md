# RevenueCat setup checklist

The app code is wired up and ready for sandbox testing. The integration
uses RevenueCat's hosted **Paywall** for purchases and **Customer Center**
for subscription management — both presented as native screens managed
by the RevenueCat dashboard, so you can iterate on copy and layout
without shipping app updates.

## What's already done in code

- `@revenuecat/purchases-capacitor` + `@revenuecat/purchases-capacitor-ui` installed
- Native projects synced (iOS via SPM, Android via Capacitor module)
- Single unified API key via `VITE_REVENUECAT_API_KEY`
- Configures on sign-in with the user's Supabase UUID
- Entitlement-change listener mirrors `is_pro` to Supabase live
- Tapping "Support the work" on native opens the RevenueCat paywall
- ProfileTab has "Manage subscription" (Customer Center) + "Restore previous purchases"
- Webhook endpoint at `/api/revenuecat-webhook` for authoritative state

## 1. App Store Connect (~30 min, one-time)

Create three subscription products in App Store Connect:

| Type | Product ID | Price | Duration |
|---|---|---|---|
| Auto-renewable | `dreamshepherd.monthly` | $7.99 | 1 month |
| Auto-renewable | `dreamshepherd.yearly` | $59.99 | 1 year |
| Non-renewing | `dreamshepherd.lifetime` | $149.99 (your choice) | One-time |

For the two subscriptions, create a single Subscription Group named
**Dream Shepherd Premium** and add both to it.

Each product needs metadata: localized display name + description, and
a placeholder screenshot. They land in "Ready to Submit" after a few
hours.

## 2. Google Play Console (~30 min, one-time)

Mirror the same product IDs and pricing in Play Console → Monetize →
Subscriptions and one-time products. Activate all three.

## 3. RevenueCat Dashboard (~15 min)

1. Create a Project named "Dream Shepherd"
2. Add iOS and Android apps with bundle/package ID `app.dreamshepherd`
3. Connect both stores:
   - iOS: App Store Connect shared secret
   - Android: Service account JSON
4. Create the Entitlement:
   - **Identifier: `Dream Shepherd Unlimited`** (must match exactly,
     case-sensitive — used by `src/lib/revenuecat.js`)
5. Import all three products from the stores
6. Attach each product to the `Dream Shepherd Unlimited` entitlement
7. Create an Offering:
   - Identifier: `default`
   - Packages: Monthly, Yearly, Lifetime (RevenueCat will match by package type)
   - Mark as current offering
8. Configure the Paywall:
   - Project → Paywalls → New Paywall
   - Use the visual editor to design (gold/navy palette, "Support
     Dream Shepherd" copy, etc.)
   - Publish → attach to the `default` offering
9. Grab the unified API key (Project → API keys) and save as
   `VITE_REVENUECAT_API_KEY` in your env

## 4. Customer Center (~5 min, one-time)

1. Project → Customer Center → Configure
2. Set the brand color (gold #e8b840 on dark)
3. Enable: Manage subscription, Restore purchases, Cancel subscription
4. Save

## 5. Webhook (~5 min)

1. Project → Integrations → Webhooks → Add webhook
2. URL: `https://dreamshepherd.app/api/revenuecat-webhook`
3. Authorization header: generate a random string (1Password is fine)
   - Save as `REVENUECAT_WEBHOOK_AUTH` in Vercel env vars
4. Subscribe to all events; handler ignores ones that aren't actionable

## 6. Vercel environment variables

In Vercel → dreamshepherd → Settings → Environment Variables:

- `VITE_REVENUECAT_API_KEY` — production key from step 3.9 (or test key for staging)
- `REVENUECAT_WEBHOOK_AUTH` — from step 5.3
- `SUPABASE_URL` — your project URL, used by the webhook
- `SUPABASE_SERVICE_ROLE_KEY` — already set, lets webhook bypass RLS

Redeploy after saving.

## 7. Capacitor sync (each time RevenueCat plugin updates)

```bash
cd ~/Dream
npm install
npm run build
npx cap sync ios
npx cap sync android
```

## 8. Sandbox testing on iOS

1. App Store Connect → Users and Access → Sandbox Testers → Create one
2. On a real iPhone (sandbox does NOT work in the simulator):
   - Settings → App Store → sign out of your real Apple ID
   - Sign in with the sandbox tester ID
3. Run the app from Xcode (`npx cap open ios`)
4. Tap **Support the work** → the RevenueCat paywall presents
5. Choose a plan → Apple's sandbox purchase sheet appears
6. Verify in Supabase that `user_settings.is_pro = true` for your row
7. Tap **Manage subscription** in Profile → Customer Center opens
8. Try Restore Purchases on a fresh install

## API key naming

The new unified key format looks like:
- Test/sandbox: `test_BjnpfLjgPMoGvPKQtILryPuxoTv`
- Production: starts with a project-specific prefix

A single key works across iOS and Android. The old split-key approach
(`appl_...`, `goog_...`) is deprecated.

## Switching from sandbox to production

When you're ready to ship:

1. RevenueCat dashboard → Project → API keys → copy the **production**
   public key
2. Vercel → Settings → Environment Variables → update
   `VITE_REVENUECAT_API_KEY` to the production key
3. Redeploy

The sandbox key shipped with the current build will keep working in
development; production builds pulling from Vercel will use the prod key.

## Done

Once the above is complete, the app is monetized. Code is fully wired.
