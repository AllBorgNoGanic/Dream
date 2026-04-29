# Dream Shepherd

A Christian-themed dream journal and AI-interpretation app. Mobile-first PWA plus native iOS and Android (via Capacitor). Lets users record dreams, get AI interpretations grounded in symbol detection and a small dream dictionary, share to a public community feed, track sleep and lucid dreaming, and visualize patterns over time.

- Production: https://dreamshepherd.app (Vercel)
- Capacitor app id: `app.dreamshepherd`
- Competes with apps like Oniri and DreamApp; deliberately differentiates with a biblical/shepherd identity

## Tech stack

- **Frontend**: React 19, Vite 6, no router (tab-based navigation in `App.jsx`)
- **Styling**: All inline CSS via `style={{ ... }}`. No Tailwind, no CSS modules, no styled-components. The only stylesheet is `src/index.css` (resets, keyframes injected by individual components into `document.head`)
- **UI primitives**: Radix UI (`@radix-ui/react-dialog`, `react-alert-dialog`, `react-select`, `react-switch`, `react-tabs`, `react-tooltip`)
- **Backend**: Supabase (Postgres, auth, RLS). Schema in `supabase-schema.sql` is idempotent (uses `ALTER TABLE ADD COLUMN IF NOT EXISTS` for every non-PK column so it can be re-run safely)
- **AI**: Anthropic API called directly from the frontend with `VITE_ANTHROPIC_API_KEY`
- **Payments**: Stripe ($5.99 / month Pro tier). Currently inactive (keys empty in `.env`); the paywall code paths exist but are not yet live
- **Mobile**: Capacitor 8 (`@capacitor/ios`, `@capacitor/android`, `@capacitor/haptics`, `@capacitor/splash-screen`, `@capacitor/status-bar`)
- **Serverless**: Vercel functions in `api/` (Stripe checkout, billing portal, share recording, Stripe webhook)
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
    DreamForm.jsx           dream creation/edit form
    DreamCard.jsx           list-row with kebab menu + long-press action sheet, status badges
    DreamActionSheet.jsx    Radix Dialog styled as bottom sheet for per-dream actions
    DreamSelect.jsx         Radix Select wrapper themed for the app
    DreamSwitch.jsx         Radix Switch wrapper
    SearchBar.jsx           search + date range + interp filter + sort + clear + result count
    StreakBanner.jsx        7-day calendar, streak-loss state, motivational CTAs
    PatternsTab.jsx         insights/guidance ("Advice", not "Wisdom"), color-coded cards
    CommunityTab.jsx        public-feed of shared dreams, like, view interpretation
    DictionaryTab.jsx       built-in symbol dictionary
    GalleryTab.jsx          gallery view of dream art/visualizations
    CalendarHeatmap.jsx     activity heatmap
    OnboardingQuiz.jsx      9-screen DreamApp-style flow (welcome -> highlights -> goal -> frequency -> interests -> wake time -> processing -> archetype result)
    ProfileTab.jsx          settings + account, includes Sign out with AlertDialog confirmation
    FirstTimeJourney.jsx    empty-state walkthrough: Capture / Reflect / Discover
    InterpretationOverlay.jsx full-screen waiting state with orbiting particles, 4 cycling stage labels every 3500ms
    ReadingModal.jsx        modal showing interpretation + theme connections
    ExportPDF.jsx           jspdf export of journal
    ShareButton.jsx         share to community
    OfflineBanner.jsx       offline / syncing / pending-sync states
    Skeleton.jsx            shimmer loaders (gold-tinted)
    Toast.jsx               ToastProvider + useToast() + ToastContainer
    ErrorBoundary.jsx       class-based, themed fallback, dev-only stack
  hooks/
    useLongPress.js         pointerdown timer + move-threshold cancel; @capacitor/haptics dynamic import with web Vibration API fallback
    useOffline.js           navigator.onLine + queue/sync orchestration
  lib/
    supabase.js             createClient with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
    offlineStore.js         IndexedDB helpers (no deps): pending dreams + dream list cache
  utils/
    moderation.js           text moderation helpers for community posts
  constants/
    archetypes.js           archetype definitions, deriveArchetype(goal, interests) weighted scoring

api/                       Vercel serverless functions
  create-checkout-session.js
  create-portal-session.js
  record-share.js
  webhook.js                Stripe webhook handler

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

- **No em dashes anywhere in user-facing text.** Use periods, commas, parens, or words like "such as", "like", "because", "including". This applies to UI copy, dream meanings, directions, error messages, marketing copy. (See `~/.claude/projects/-Users-seansmith-Dream/memory/feedback_no_em_dashes.md`.)
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

### Dream entry
- 50-character minimum on dream description
- Optional fields: mood, theme, tags, characters
- Symbol detection runs on title + description against `DREAM_DICTIONARY` (word-boundary regex)
- Lucid dreaming subform: `is_lucid`, `lucidity_level`, `dream_signs`, `lucid_trigger`, `lucid_activity`, `lucid_duration`
- Sleep tracking: `bed_time`, `wake_time`, `sleep_quality`, computed `sleep_hours`

### AI interpretation
- 5 free interpretations per user
- Up to 3 bonus interpretations from sharing dreams to community (`MAX_SHARE_BONUS`)
- Pro tier ($5.99 / month) for unlimited (Stripe-gated, currently inactive)
- Interpretation cross-references generated themes against the dream's text, surfaces theme connections under the result
- Viewing an existing interpretation from the community tab does NOT consume a free interpretation
- A separate paid path lets users spend a free interpretation on their own dream and skip community sharing

### Patterns tab
- Insights / Ongoing Guidance cards: label, color-coded strength badge, quoted representative guidance, dream count, last date, contributing titles
- "Advice" header (was "Wisdom"; renamed)

### Community tab
- Public feed of shared dreams
- "View interpretation" button only appears on posts that have an interpretation
- Likes (`dream_likes` table)

### Streaks
- 7-day mini calendar in the StreakBanner
- "Personal best!" badge on new max
- streakLost state when streak=0 and lastDate < yesterday
- Motivational CTA to record a new dream

### Onboarding quiz (9 screens)
1. Welcome (sheep emoji + Get Started)
2. Feature highlight: Journal
3. Feature highlight: Patterns
4. Goal selection (6 single-select pills)
5. Dream frequency (2x2 grid)
6. Interest chips (8 multi-select, >= 1 required)
7. Wake time picker (with skip)
8. Processing animation (auto-advance after 2.5s)
9. Archetype result + Begin Journaling CTA

`onComplete` payload: `{ archetype, archetypeData, interests, dreamGoal, dreamFrequency, wakeTime }` and stored on `user_settings`.

### Offline
- Failed `handleSubmit` mid-request queues the dream to IndexedDB
- `OfflineBanner` shows offline / syncing / pending-online states
- `useOffline` exposes `isOnline`, `pendingCount`, `syncing`, `queueDream`, `syncAll`, `cacheDreamList`, `loadCachedDreams`
- `DreamCard` renders a "☁️ Pending sync" badge when `dream._offlineCreated`

### UX polish
- Long-press on a DreamCard or kebab "..." button opens `DreamActionSheet` (Radix Dialog as bottom sheet)
- Haptic feedback on long press (Capacitor Haptics where available, web Vibration API fallback)
- `FirstTimeJourney` 3-step empty state for new users (Capture / Reflect / Discover)
- `InterpretationOverlay` full-screen waiting state for AI calls (orbiting particles, 4 rotating contemplative phrases at 3500ms cadence)
- Sign out lives in `ProfileTab` (not the header) and is gated by an AlertDialog confirmation with copy: "Your dreams are saved to your account. You can sign back in any time to pick up where you left off."

### Visual identity
- 220 stars in `StarField`, plus a Star of Bethlehem in upper left
- Star of Bethlehem rays use `radial-gradient(ellipse)` on narrow divs with `borderRadius: "50%"` to get naturally tapered points (vertical 320px, horizontal 90px, diagonal 60px)
- Recoloring monochrome SVGs to gold uses CSS filter:
  ```
  filter: brightness(0) saturate(100%) invert(78%) sepia(40%) saturate(600%) hue-rotate(5deg) brightness(95%);
  ```
  Inactive variant is the same with brightness reduced.
- The shepherd SVG is the Journal tab icon. Source SVG must have `fill="#000000"` for the CSS filter recolor to work.

## Open items and not-yet-done

- **Stripe paywall is inactive.** `VITE_STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` are empty in `.env`. Server functions in `api/` exist but `webhook.js` will fail without the webhook secret. The free interpretation counter and Pro flag are wired through; only the actual checkout path is dark.
- **App Store / Play Store**: Capacitor scaffolding is in place. iOS targets a launchScreen with backgroundColor `#04001a`; Android assets generated via `npm run assets`. Submission is open.
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
Tabs are conditionally rendered inside `App.jsx`. Add a key to the tab array, an icon, an active-state CSS filter, and the conditional render block. Six tabs is the current target (Journal, Patterns, Lucid, Community, Dict, Profile). Adding a 7th means re-spacing the bottom nav.

### Generate icons and splash
1. Update SVGs in `assets/` or the source SVG strings inside `scripts/generate-assets.mjs`.
2. Run `npm run assets`.
3. Commit `public/icon-192.png`, `public/icon-512.png`, the favicons, and the `ios/` and `android/` regenerated asset bundles.

### Update the schema in production
Run the entire `supabase-schema.sql` in the Supabase SQL editor. It is safe to re-run because every column add is `IF NOT EXISTS` and every policy create is preceded by `drop policy if exists`.

## File-by-file source-of-truth pointers

- App-level state, dream CRUD, paywall counter, symbol detection: `src/App.jsx`
- Visual style of stars and orbs: `src/components/StarField.jsx`
- Onboarding-flow shape and archetype derivation: `src/components/OnboardingQuiz.jsx` plus `src/constants/archetypes.js`
- Offline queue and cache: `src/lib/offlineStore.js` + `src/hooks/useOffline.js`
- Long-press behavior and haptics: `src/hooks/useLongPress.js`
- Asset pipeline: `scripts/generate-assets.mjs` (Capacitor + sharp + composed SVG)
- Schema: `supabase-schema.sql`
- Stripe and webhook: `api/create-checkout-session.js`, `api/create-portal-session.js`, `api/record-share.js`, `api/webhook.js`

## Past sessions for deeper context

The four most recent Claude Code sessions are stored as JSONL at `~/.claude/projects/-Users-seansmith-Dream/`. They cover, in order:

1. `07008b6f-...jsonl` (Mar 12 to Mar 30): freemium paywall scaffolding with Stripe.
2. `2b6be30f-...jsonl` (Mar 12 to Apr 19, 56 MB): the bulk of the build (rebrand from Dreamscape to Dream Shepherd, add competitive features, Star of Bethlehem, onboarding quiz redesign).
3. `825565cb-...jsonl` (Apr 19 to Apr 20): toast system, error boundaries, pagination, search enhancements, offline support, skeletons, streak banner upgrade, sheep/shepherd icon work.
4. `de13905b-...jsonl` (Apr 20 to Apr 24): UX polish round (FirstTimeJourney, InterpretationOverlay, DreamActionSheet, sign-out moved to settings with confirmation, app icon and splash via @capacitor/assets).

Resume with `cd ~/Dream && claude` then `/resume` to read any of them in full.
