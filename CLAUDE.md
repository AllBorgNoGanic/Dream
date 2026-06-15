# Dream Shepherd

A Christian-themed dream journal and AI-interpretation app. Mobile-first PWA plus native iOS and Android (via Capacitor). Lets users record dreams (including via voice), get AI interpretations grounded in symbol detection and a dream dictionary, share to a public community feed, pray over interpretations, track sleep and lucid dreaming, visualize patterns over time, and receive daily devotionals tied to the liturgical calendar.

- Production: https://dreamshepherd.app (Vercel)
- Capacitor app id: `app.dreamshepherd`
- Competes with apps like Oniri and DreamApp; deliberately differentiates with a biblical/shepherd identity

## Tech stack

- **Frontend**: React 19, Vite 6, no router (tab-based navigation in `App.jsx`)
- **Styling**: All inline CSS via `style={{ ... }}`. No Tailwind, no CSS modules, no styled-components. The only stylesheet is `src/index.css` (resets, keyframes injected by individual components into `document.head`)
- **UI primitives**: Radix UI (`@radix-ui/react-dialog`, `react-alert-dialog`, `react-select`, `react-switch`, `react-tabs`, `react-tooltip`)
- **Backend**: Supabase (Postgres, auth, RLS). Schema in `supabase-schema.sql` is idempotent (uses `ALTER TABLE ADD COLUMN IF NOT EXISTS` for every non-PK column so it can be re-run safely)
- **AI**: Anthropic API called via Supabase edge functions (`interpret-dream`, `generate-dream-image`)
- **Payments**: RevenueCat Capacitor SDK (`@revenuecat/purchases-capacitor@13.1.2`). Entitlement `Dreamshepherd Pro`, offering `default` with `$rc_monthly` ($7.99/mo) and `$rc_annual` ($59.99/yr). Custom on-brand paywall (not RC hosted). Server webhook at `api/revenuecat-webhook.js` syncs `is_pro` to Supabase. Legacy Stripe paths exist in `api/` but are inactive (keys empty in `.env`).
- **Mobile**: Capacitor 8 (`@capacitor/ios`, `@capacitor/android`, `@capacitor/haptics`, `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor-community/speech-recognition`)
- **Serverless**: Vercel functions in `api/` (RevenueCat webhook, account deletion, share recording, plus inactive Stripe functions)
- **Asset generation**: `@capacitor/assets` plus `sharp` via `scripts/generate-assets.mjs` (composes SVGs with star backgrounds and golden gradients into iOS, Android, and web icon/splash sets)
- **Storage**: Supabase remote. Local IndexedDB queue for offline dream creation and a cached dream list (see `src/lib/offlineStore.js`)
- **Other**: `jspdf` for PDF export, service worker for PWA install (registers only in `import.meta.env.PROD`; auto-unregisters in dev)

## Project structure

```
src/
  App.jsx               main app, tab nav, dream CRUD, symbol detection, ai interp glue
  Landing.jsx           marketing/landing page (signed-out)
  main.jsx              entry, ErrorBoundary, ToastProvider wrappers
  index.css             resets and a few global keyframes
  components/
    StarField.jsx           220 procedurally placed stars + Star of Bethlehem (upper left)
    ShepherdMark.jsx        shepherd logo component (used in header + upgrade modal)
    DreamForm.jsx           dream creation/edit form (includes VoiceCapture + DreamSwitch)
    DreamCard.jsx           list-row with kebab menu + long-press action sheet, status badges
    DreamActionSheet.jsx    Radix Dialog styled as bottom sheet for per-dream actions
    DreamSelect.jsx         Radix Select wrapper themed for the app
    DreamSwitch.jsx         Radix Switch wrapper
    VoiceCapture.jsx        speech-to-text dream entry modal (Radix Dialog, mic pulse animation)
    SearchBar.jsx           search + date range + interp filter + sort + clear + result count
    StreakBanner.jsx         7-day calendar, streak-loss state, motivational CTAs
    MorningCard.jsx         daily devotional card (verse, reflection, record CTA, liturgical season tinting)
    SundayRecap.jsx         weekly Sunday summary (top symbol, mood, longest dream, AI synthesis, verse)
    PatternsTab.jsx         insights/guidance ("Advice"), color-coded cards, CalendarHeatmap, sub-tabs
    CalendarHeatmap.jsx     52-week GitHub-style activity heatmap + monthly bar chart
    CommunityTab.jsx        public feed of shared dreams, like, view interpretation
    DictionaryTab.jsx       built-in symbol dictionary
    GalleryTab.jsx          gallery view of dream art/visualizations (rendered inside ProfileTab)
    OnboardingQuiz.jsx      3-step flow: welcome -> dream entry -> AI reveal
    ProfileTab.jsx          settings + account + gallery subsection, includes Sign out with AlertDialog
    PersonalizationCard.jsx settings card showing sleep/emotional/theme personalization state
    PersonalizationModal.jsx modal to edit personalization (sleep quality, stress, mood, themes)
    FirstTimeJourney.jsx    empty-state walkthrough: Capture / Reflect / Discover
    InterpretationOverlay.jsx full-screen waiting state with orbiting particles, cycling stage labels
    ReadingModal.jsx        modal showing interpretation + theme connections + prayer trigger
    PrayerOverlay.jsx       prayer experience (cross pulse animation, ascending effect)
    ExportPDF.jsx           jspdf export of journal (used in ProfileTab)
    ShareButton.jsx         share to community
    ReportDialog.jsx        content reporting modal for community moderation (used in ReadingModal)
    OfflineBanner.jsx       offline / syncing / pending-sync states
    Skeleton.jsx            shimmer loaders (gold-tinted)
    Toast.jsx               ToastProvider + useToast() + ToastContainer
    ErrorBoundary.jsx       class-based, themed fallback, dev-only stack
  hooks/
    useLongPress.js         pointerdown timer + move-threshold cancel; @capacitor/haptics with web Vibration API fallback
    useOffline.js           navigator.onLine + queue/sync orchestration
    useSpeechRecognition.js speech recognition hook for VoiceCapture
  lib/
    supabase.js             createClient with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
    offlineStore.js         IndexedDB helpers (no deps): pending dreams + dream list cache
    revenuecat.js           RevenueCat SDK wrapper: configure, login/logout, entitlement checks,
                            package fetching, direct purchase, restore, customer center, entitlement listener.
                            Web is a hard no-op (subscriptions are mobile-only).
  utils/
    moderation.js           text moderation helpers for community posts
    liturgicalSeason.js     Western liturgical calendar detection (Advent, Christmas, Epiphany, Lent,
                            Easter, Ordinary) with accent colors and AI interpretation hints

  constants/
    devotionals.js          daily devotional content for MorningCard + SundayRecap

api/                       Vercel serverless functions
  revenuecat-webhook.js     RevenueCat -> Supabase entitlement sync (is_pro on purchase/renewal/expiration/refund)
  delete-account.js         account deletion endpoint
  record-share.js           community share bonus (grants bonus interpretations, cooldown-gated)
  create-checkout-session.js  Stripe checkout (inactive, keys empty)
  create-portal-session.js    Stripe billing portal (inactive)
  webhook.js                  Stripe webhook handler (inactive)

supabase/migrations/        SQL migrations beyond the base schema
supabase-schema.sql         full idempotent schema (run in Supabase SQL editor)

public/                    static, served as-is
  shepherd.svg              good shepherd, used as Journal tab icon
  sheep.svg                 alternate icon, viewBox cropped to "95 30 455 275", stroke-width 350
  moon-fog.svg              Patterns tab icon (recolored to #000000 so CSS filter recoloring works)
  constellation.svg         retained but unused
  manifest.json             PWA manifest (rich; do not let asset generator overwrite)
  sw.js                     service worker (cache + offline shell)
  privacy.html, terms.html  legal pages
  favicon-*.png, apple-touch-icon.png, icon-192/512.png

android/, ios/             Capacitor native projects
assets/                    source PNGs for icon/splash generation
scripts/generate-assets.mjs  see Asset generation below
```

## Run, build, deploy

```bash
npm install
npm run dev          # Vite dev server on http://localhost:5173
npm run build        # vite build -> dist/
npm run preview      # preview built dist/
npm run lint         # eslint
npm run lint:fix
npm run check        # lint + build (used as a pre-deploy gate)
npm run assets       # node scripts/generate-assets.mjs (icons + splash)
```

Vercel auto-deploys from the `master` branch. `vercel.json` declares `framework: vite`, `buildCommand: vite build`, `outputDirectory: dist`.

## Conventions and gotchas

- **No em dashes anywhere in user-facing text.** Use periods, commas, parens, or words like "such as", "like", "because", "including". This applies to UI copy, dream meanings, directions, error messages, marketing copy.
- **Inline CSS only.** New styling goes in `style={{}}` props or in component-local keyframe blocks injected into `document.head` once via `if (!document.getElementById(STYLE_ID))` pattern (see `ProfileTab.jsx` `PROFILE_DIALOG_STYLES_ID` for the canonical example).
- **Brand palette**:
  - `#04001a` (NAVY_BG, the canonical app background)
  - `#02000c` (NAVY_BG_DEEP)
  - `#e8b840` (GOLD, primary accent)
  - `#f5e4b0` (GOLD_SOFT, body text on dark)
  - Purple gradient `#7c3aed -> #a855f7` (primary action buttons)
  - Background gradient: `linear-gradient(160deg, #020c18, #0a1428, #020c18)`
- **Font**: Georgia serif throughout.
- **Service worker**: only register in `import.meta.env.PROD`. In dev mode it auto-unregisters via `navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))`. This was a real source of "stale dev build" pain. Do not register it unconditionally.
- **Auth state filter**: `supabase.auth.onAuthStateChange` only updates user state on `SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED`, `INITIAL_SESSION`. Never on `TOKEN_REFRESHED` (causes new user-object refs and triggers cascading re-renders / re-load of settings / quiz re-show).
- **Onboarding lock**: completion requires both an in-memory ref (`quizDoneRef = useRef(false)`) and a `localStorage` flag (`onboarding_done_${user.id}`). Both must be checked. The ref is what prevents re-show in the same tab; localStorage prevents it across reloads.
- **Symbol detection** uses word-boundary regex (`new RegExp(\`\\b${k}s?\\b\`, "i")`). Do not switch to substring `.includes()`. The word-boundary form was added specifically to stop "walking" matching "king", "111" matching "1" and "11", "being chased by an animal" matching "being chased by a person", etc.
- **AI usage scaling**: when adding interpretation features, prefer caching, theme cross-references from existing data, and one-shot calls over iterative or per-render calls. The user has explicitly flagged AI cost at scale as a constraint.
- **Schema is idempotent**. Any new column on an existing table needs a paired `ALTER TABLE ADD COLUMN IF NOT EXISTS` after the `CREATE TABLE`. Same drop/create dance for RLS policies (`drop policy if exists ... ; create policy ...`).
- **Asset generator caveats**: `scripts/generate-assets.mjs` runs `npx` via `child_process.spawn` with `shell: true` (was needed for Windows; harmless on macOS). The generator must NOT write `manifest.webmanifest`; the rich `public/manifest.json` is the source of truth.
- **Don't draw fixes for SVG visibility issues.** The user previously rejected a "redraw the icon to be more visible" approach. Prefer cropping the viewBox, scaling, and adjusting stroke-width within the existing artwork.

## Product features (current state)

### Auth and accounts
- Email/password via Supabase auth
- `user_settings` row created on first login; `onboarding_completed` gates the quiz
- Account deletion via `api/delete-account.js`

### Navigation (5 tabs)
Bottom tab bar with custom SVG/image icons, haptic feedback on tap (Capacitor native only), press-scale animation:

| Order | Tab | ID | Renders |
|---|---|---|---|
| 1 | Community | `community` | CommunityTab |
| 2 | Patterns | `insights` | PatternsTab |
| 3 | Journal | `journal` | Dream list (center, default) |
| 4 | Library | `library` | DictionaryTab |
| 5 | Profile | `profile` | ProfileTab (includes Gallery subsection) |

### Dream entry
- 50-character minimum on dream description
- Optional fields: mood, theme, tags, characters
- **Voice capture**: speech-to-text via `VoiceCapture` component (uses `useSpeechRecognition` hook + `@capacitor-community/speech-recognition`)
- Symbol detection runs on title + description against `DREAM_DICTIONARY` (word-boundary regex)
- Lucid dreaming subform: `is_lucid`, `lucidity_level`, `dream_signs`, `lucid_trigger`, `lucid_activity`, `lucid_duration`
- Sleep tracking: `bed_time`, `wake_time`, `sleep_quality`, computed `sleep_hours`

### AI interpretation
- 5 free interpretations per user (`FREE_INTERPRETATIONS`)
- Up to 3 bonus interpretations from sharing dreams to community (`MAX_SHARE_BONUS`)
- 2 free image generations (`FREE_IMAGE_LIMIT`)
- Pro tier ($7.99/mo or $59.99/yr) for unlimited (RevenueCat-gated)
- Interpretation cross-references generated themes against the dream's text, surfaces theme connections under the result
- Viewing an existing interpretation from the community tab does NOT consume a free interpretation
- Liturgical season context (`getSeasonAiHint`) is appended to AI interpretation prompts

### Prayer
- `PrayerOverlay` component triggered from `ReadingModal` after viewing an interpretation
- Full-screen Radix Dialog with cross pulse animation, ascending/dissolving prayer effect
- Contemplative, non-interactive experience (no text input)

### Devotionals and liturgical calendar
- `MorningCard`: daily devotional card at top of Journal tab. Shows verse, short reflection, "yesterday's dream" callback, and record CTA. Dismissable per local day. Uses liturgical season accent colors.
- `SundayRecap`: weekly summary card on Sunday mornings. Summarizes past 7 days: top symbol, dominant mood, longest dream, one-sentence AI synthesis, and a verse for the week ahead.
- `liturgicalSeason.js`: detects Advent, Christmas, Epiphany, Lent, Easter, and Ordinary Time via the Meeus/Jones/Butcher Easter algorithm. Returns season name, accent color scheme, and an AI hint string.
- `devotionals.js`: daily devotional content keyed by date for MorningCard and SundayRecap.

### Personalization
- `PersonalizationCard` (in ProfileTab): shows current sleep quality, stress level, mood, and recurring themes
- `PersonalizationModal`: multi-step editor for updating personalization data
- Data stored in `user_settings.archetype_data` (sleep, emotional, recurringThemes fields)

### Patterns tab
- Sub-tabbed: Overview, Symbols, Advice
- Overview: CalendarHeatmap (52-week activity + monthly bar chart), aggregated stats with deltas, streak/recall metrics
- Symbols: concept frequency from AI-generated themes + word-boundary dictionary scan
- Advice ("Ongoing guidance"): clustered insights scored by frequency x recency (requires >= 10 dreams and >= 3 occurrences of a concept). Lucid dreaming "Tonight's reality checks" card.
- Drill-down bottom sheets (Radix Dialog) with "View all in Journal" navigation
- All client-side computation (zero AI calls per render)

### Community tab
- Public feed of shared dreams
- "View interpretation" button only appears on posts that have an interpretation
- Likes (`dream_likes` table)
- Content reporting via `ReportDialog`

### Payments (RevenueCat)
- RevenueCat Capacitor SDK with custom on-brand paywall modal (not RC hosted paywall)
- Entitlement: `Dreamshepherd Pro`
- Offering: `default` with packages `$rc_monthly` ($7.99/mo) and `$rc_annual` ($59.99/yr, "Save 37%")
- Platform-aware SDK key: `VITE_REVENUECAT_IOS_KEY` (appl_) for iOS, `VITE_REVENUECAT_ANDROID_KEY` (goog_) for Android, falls back to `VITE_REVENUECAT_API_KEY`
- SDK configured on sign-in (`configureRevenueCat(user.id)`), logged out on sign-out
- Entitlement change listener mirrors `is_pro` to Supabase in real time
- Server webhook (`api/revenuecat-webhook.js`) handles renewals/expirations/refunds while app is closed. Secured via `REVENUECAT_WEBHOOK_AUTH` header. Registered at `https://dreamshepherd.app/api/revenuecat-webhook`.
- Web users see the modal but are told subscriptions are available in the native app
- Restore purchases + Customer Center (RC hosted subscription management) available from ProfileTab
- Legacy Stripe server functions in `api/` still exist but are inactive (keys empty)

### Streaks
- 7-day mini calendar in the StreakBanner
- "Personal best!" badge on new max
- streakLost state when streak=0 and lastDate < yesterday
- Motivational CTA to record a new dream

### Onboarding quiz (3 steps)
1. Welcome screen
2. Dream entry (user writes their first dream)
3. AI reveal (post-auth: shows AI interpretation of the entered dream) / bridge screen (pre-auth: directs to sign up)

`onComplete` payload: `{ displayName, profile, sleep, emotional, recurringThemes, recentDream, interpretation, aiThemes }` stored on `user_settings.archetype_data`. Skip path sends empty defaults with `skipped: true`.

### Offline
- Failed `handleSubmit` mid-request queues the dream to IndexedDB
- `OfflineBanner` shows offline / syncing / pending-online states
- `useOffline` exposes `isOnline`, `pendingCount`, `syncing`, `queueDream`, `syncAll`, `cacheDreamList`, `loadCachedDreams`
- `DreamCard` renders a "Pending sync" badge when `dream._offlineCreated`

### UX polish
- Long-press on a DreamCard or kebab "..." button opens `DreamActionSheet` (Radix Dialog as bottom sheet)
- Haptic feedback on long press (Capacitor Haptics where available, web Vibration API fallback)
- Haptic feedback on tab switches (native only, ImpactStyle.Light)
- `FirstTimeJourney` 3-step empty state for new users (Capture / Reflect / Discover)
- `InterpretationOverlay` full-screen waiting state for AI calls (orbiting particles, rotating contemplative phrases)
- Sign out lives in `ProfileTab` (not the header) and is gated by an AlertDialog confirmation
- Press-scale animation on tab buttons (scale 0.92 on touch/mouse down)

### Visual identity
- 220 stars in `StarField`, plus a Star of Bethlehem in upper left
- Star of Bethlehem rays use `radial-gradient(ellipse)` on narrow divs with `borderRadius: "50%"` to get naturally tapered points (vertical 320px, horizontal 90px, diagonal 60px)
- `ShepherdMark` component renders the shepherd logo at configurable sizes
- Recoloring monochrome SVGs to gold uses CSS filter:
  ```
  filter: brightness(0) saturate(100%) invert(78%) sepia(40%) saturate(600%) hue-rotate(5deg) brightness(95%);
  ```
  Inactive variant is the same with brightness reduced.
- The shepherd SVG is the Journal tab icon. Source SVG must have `fill="#000000"` for the CSS filter recolor to work.
- Liturgical seasons subtly tint MorningCard and SundayRecap with season-appropriate accent colors.

## Open items and not-yet-done

- **Apple Paid Apps agreement**: must be Active in App Store Connect (Business -> Agreements) before products load in the app. Banking, Tax (W-9), and DSA Trader verification required.
- **Sandbox purchase test**: once the Paid Apps agreement is active, test the full purchase flow on a device with a Sandbox Apple ID.
- **Google Play**: Android Capacitor project is synced and ready, but no Play Console listing or `goog_` key configured yet.
- **Legacy Stripe functions**: `api/create-checkout-session.js`, `api/create-portal-session.js`, and `api/webhook.js` exist but are inactive. Can be removed once RevenueCat is confirmed working in production.
- The dream list pagination is "20 at a time with Load More"; if community feed gets large, consider applying the same pattern there.

## Common recipes

### Add a new dream symbol
Edit `DREAM_DICTIONARY` in `src/App.jsx`. Use a single lowercase keyword. Plurals are auto-matched (regex appends `s?`). Provide `{ symbol: "<emoji>", meaning: "<one-sentence definition>" }`. Avoid em dashes.

### Add a column to `dreams` or `user_settings`
1. Add the `column_name type default ...` line inside the `CREATE TABLE` block in `supabase-schema.sql`.
2. Add a paired `alter table <name> add column if not exists <column_name> <type> default <default>;` after the create.
3. Run the SQL editor in Supabase Dashboard.
4. Update reads/writes in `src/App.jsx` and any relevant components.

### Add a new tab
Tabs are conditionally rendered inside `App.jsx`. Add a key to the `tabs` array (line ~1354), a case in `TabIcon`, and the conditional render block. Currently 5 tabs (Community, Patterns, Journal, Library, Profile). Adding a 6th means re-spacing the bottom nav.

### Generate icons and splash
1. Update SVGs in `assets/` or the source SVG strings inside `scripts/generate-assets.mjs`.
2. Run `npm run assets`.
3. Commit `public/icon-192.png`, `public/icon-512.png`, the favicons, and the `ios/` and `android/` regenerated asset bundles.

### Update the schema in production
Run the entire `supabase-schema.sql` in the Supabase SQL editor. It is safe to re-run because every column add is `IF NOT EXISTS` and every policy create is preceded by `drop policy if exists`.

## File-by-file source-of-truth pointers

- App-level state, dream CRUD, paywall counter, symbol detection, tab nav: `src/App.jsx`
- Visual style of stars and orbs: `src/components/StarField.jsx`
- Onboarding flow: `src/components/OnboardingQuiz.jsx`
- Devotional content: `src/constants/devotionals.js` + `src/components/MorningCard.jsx` + `src/components/SundayRecap.jsx`
- Liturgical calendar: `src/utils/liturgicalSeason.js`
- Personalization: `src/components/PersonalizationCard.jsx` + `src/components/PersonalizationModal.jsx`
- Prayer experience: `src/components/PrayerOverlay.jsx`
- Voice input: `src/components/VoiceCapture.jsx` + `src/hooks/useSpeechRecognition.js`
- RevenueCat SDK wrapper: `src/lib/revenuecat.js`
- Offline queue and cache: `src/lib/offlineStore.js` + `src/hooks/useOffline.js`
- Long-press behavior and haptics: `src/hooks/useLongPress.js`
- Asset pipeline: `scripts/generate-assets.mjs` (Capacitor + sharp + composed SVG)
- Schema: `supabase-schema.sql`
- RevenueCat webhook: `api/revenuecat-webhook.js`
- Community share bonus: `api/record-share.js`
- Account deletion: `api/delete-account.js`
