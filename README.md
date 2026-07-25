# WalkBuddy

A social outdoor fitness app — discover scenic routes, track steps, distance and calories, ping nearby walking buddies, and generate AI-coached interval sessions.

Bioluminescent forest theme: firefly particle canvas, fog transitions between pages, glass panels over a near-black `#020b08` canvas.

View in AI Studio: https://ai.studio/apps/57291166-7b33-46ac-82e9-4e5d2cfb3923

---

## Stack

| | |
|---|---|
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Build | Vite 6 |
| Server | Express (`server.ts`), doubles as the Vite dev middleware |
| Auth + DB | Supabase (Google OAuth, Postgres with RLS) |
| AI | Gemini 2.5 Flash, called **server-side only** |
| Maps | Leaflet |

---

## Quick start

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Set `PORT` to use a different port:

```bash
PORT=3001 npm run dev
```

If you change the port, add that origin to the Supabase redirect allow-list (see below) — the app sends `window.location.origin` as its OAuth redirect target.

---

## Environment

Copy `.env.example` to `.env.local` and fill it in. `.env.local` is gitignored.

| Variable | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | For the AI coach | **Secret.** Read server-side in `server.ts`. Never expose to the client. |
| `VITE_SUPABASE_URL` | Optional | Falls back to a hardcoded default |
| `VITE_SUPABASE_ANON_KEY` | Optional | Falls back to a hardcoded default |

### Why the Supabase values are optional

`src/lib/supabase.ts` resolves config in this order:

1. `VITE_`-prefixed env vars (local development)
2. Hardcoded defaults in the file

The defaults exist because **Google AI Studio injects secrets into the server runtime only, never into client code**. `VITE_` vars are inlined by Vite at *build* time, so a server-only secret is `undefined` in the browser bundle. Without the fallback, an AI Studio deploy boots to the "Connect Supabase" setup screen.

Checking in the anon key is safe and intentional. `sb_publishable_*` is designed to ship in client code and grants no access on its own — Row Level Security is what protects the data. **Never** put the `service_role` key there; it bypasses RLS entirely.

---

## Supabase setup

### 1. Database

Run **`supabase/migration_onboarding.sql`** in the Supabase SQL Editor.

> ⚠️ Do **not** run `supabase/schema.sql` against the existing project. It uses `create table if not exists`, which silently skips tables that already exist — so the onboarding columns never get added. `schema.sql` is the reference schema for a brand-new project only.

The migration is additive and idempotent: `add column if not exists` throughout, no drops, no data loss. It also creates the unique indexes the upserts need, applies RLS policies, backfills profile rows for existing auth users, and reloads the PostgREST schema cache.

### 2. Google OAuth

**Google Cloud Console** → Create Credentials → OAuth client ID → Web application. Authorized redirect URI:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

That's the *Supabase* callback, not your app's URL. The flow is `your app → Supabase → Google → Supabase → your app`, so Google only ever needs to know about Supabase. Leave "Authorised JavaScript origins" empty.

Creating an OAuth client is free — no billing account required.

**Supabase** → Authentication → Providers → Google → enable, paste the Client ID and Secret.

### 3. Redirect URLs

**Supabase** → Authentication → URL Configuration. Add every origin you run on:

```
http://localhost:3000
https://<your-ai-studio-or-cloud-run-url>
```

If an origin is missing, Supabase silently ignores the requested redirect and sends the user to the Site URL instead. The symptom is "signed in but landed on the wrong page", with no error.

---

## Onboarding flow

`src/components/OnboardingFlow.tsx` is one file with four banner-delimited sections:

| Section | Screen | Writes to |
|---|---|---|
| 1 | Google sign-in | — (creates the auth user) |
| 2 | Personal info — name, age, gender, phone, city, avatar | `profiles` |
| 3 | Preferences survey + safety settings | `profile_preferences`, `safety_settings` |
| 4 | Terms & conditions | `profiles` (`terms_accepted`, `onboarding_completed`) |

### Gating

```
main.tsx → AuthGate.tsx → OnboardingFlow.tsx  (not signed in, or onboarding incomplete)
                        → App.tsx             (onboarding_completed === true)
```

`AuthGate` owns the Supabase session, listens for auth state changes, and loads the profile row. Half-finished onboarding resumes at the correct step, and previously saved answers prefill.

### Files

```
src/
  main.tsx                     mounts AuthGate
  AuthGate.tsx                 session + profile gate, setup/error screens
  App.tsx                      the dashboard (accepts profile + onSignOut)
  lib/
    supabase.ts                client + config resolution
    db.ts                      typed reads/writes for all three tables
  components/
    OnboardingFlow.tsx         all four onboarding screens
supabase/
  migration_onboarding.sql     run this on the existing project
  schema.sql                   reference schema for a fresh project
```

---

## Database

Three tables, all with RLS enabled so a user can only read and write their own rows.

**`profiles`** — one row per authenticated user. Keyed on `id`, matching `auth.users.id`.

**`profile_preferences`** — survey answers: activities, experience level, preferred times, terrain, pace, goals, buddy matching, audio, AI-coach and notification opt-ins.

**`safety_settings`** — live-location sharing, daylight-only, verified-buddies-only, women-only matching, profile visibility, route-history sharing, auto check-in interval, SOS shortcut, emergency contact.

### Schema quirks

These are inherited from the pre-existing tables. They are load-bearing — changing them means changing client code too.

1. **Child tables key on `profile_id`, not `user_id`.** Both `profile_preferences` and `safety_settings` reference the profile via `profile_id`.

2. **`profiles.id` and `profile_id` are `TEXT`, not `UUID`.** `auth.uid()` returns `uuid`, so every RLS policy casts: `auth.uid()::text = profile_id`. Without the cast you get `operator does not exist: uuid = text`.

3. **`profile_preferences.group_size_preference` is an `INTEGER`** — a head-count, not a label. `OnboardingFlow.tsx` maps UI labels to counts via `GROUP_SIZE_TO_COUNT` (Solo → 1, One buddy → 2, Small group → 5, Large group → 12) and back with `countToGroupSize()`.

### Known cleanups

- `profiles.id` has no foreign key to `auth.users`. The database won't stop a row being written with an arbitrary id string, and deleted auth users don't cascade. RLS closes the security hole, so this isn't urgent — but converting these columns to `uuid references auth.users(id) on delete cascade` is the right fix once nothing else depends on the current types.
- The pre-existing `preferred_time` (singular) and `goal` columns overlap conceptually with `preferred_times` and `motivations`. Both sets are still present; somebody should decide which is canonical.
- The exact meaning of the `group_size_preference` integer was inferred, not documented. If it's a *maximum* group size or an enum code rather than a typical party size, the mapping above is wrong in a way no error will surface.

---

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Express + Vite dev server on :3000 |
| `npm run build` | Vite client build + esbuild server bundle → `dist/` |
| `npm start` | Run the production build |
| `npm run preview` | Vite's static preview of `dist/` |
| `npm run lint` | `tsc --noEmit` |
| `npm run clean` | Remove `dist/` and `server.js` |

---

## Deploying to AI Studio

AI Studio Build mode imports existing code **only via GitHub** — there's no folder upload. ZIP is export-only.

1. Push to GitHub
2. AI Studio → `+` (Add files) → **Import from GitHub**
3. Add the resulting preview URL to the Supabase redirect allow-list

`GEMINI_API_KEY` goes in AI Studio's **Settings → Secrets** panel; it stays server-side. The Supabase values need no configuration there thanks to the hardcoded fallbacks.
