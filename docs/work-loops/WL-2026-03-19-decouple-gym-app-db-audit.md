# WL-2026-03-19-decouple-gym-app-db-audit

## Goal
The branch appears to be moving the app away from the legacy UFit Supabase configuration and toward a dedicated Gym App Supabase setup with explicit environment switching. The work also introduces the newer Supabase auth client pattern for Next.js via `@supabase/ssr`. Based on the current branch state, the intended outcome seems to be: local development can be pointed at either the old or new Supabase project while the codebase transitions to the new env variable names and auth/client structure.

## Plan
I inspected the branch with `git status --short --untracked-files=all`, `git diff --stat`, targeted diffs for the likely decoupling files, and repo-wide search for Supabase env variable names, legacy key names, and old/new env-switch references. I then read the changed and untracked files most relevant to environment selection, Supabase client creation, and auth/UI entry points.

## Execute

### 1. Changed files inventory

#### Likely core to DB decoupling
- `package.json`: adds explicit `dev:old` and `dev:new` scripts and forces env selection before startup.
- `package-lock.json`: records the dependency change for `@supabase/ssr` and the Supabase package bump needed by the new client pattern.
- `.env.example`: shifts the documented env contract from legacy keys toward modern Supabase key names.
- `.gitignore`: explicitly ignores `.env.local`, `.env.old-project`, and `.env.gym-notebook`, which supports local env switching without committing secrets.
- `lib/supabase.ts`: updates the admin client to prefer `SUPABASE_SECRET_KEY` while still tolerating legacy `SUPABASE_SERVICE_ROLE_KEY`.
- `lib/env.ts`: introduces a central env reader for the new key names, although it is not yet used anywhere.
- `lib/supabase/client.ts`: adds a browser auth client using modern publishable-key naming with fallback to legacy anon-key naming.
- `lib/supabase/server.ts`: adds a server auth client using `@supabase/ssr` and the same modern-plus-legacy key strategy.
- `scripts/use-gym-env.sh`: adds an explicit switcher that copies `.env.gym-notebook` to `.env.local`.
- `scripts/use-old-env.sh`: adds an explicit switcher that copies `.env.old-project` to `.env.local`.

#### Likely related but not essential
- `app/page.tsx`: now depends on the new server Supabase client for auth gating, but this is more about auth/UI flow than DB decoupling itself.
- `app/auth/callback/route.ts`: uses the new server client for OAuth callback handling.
- `app/auth/confirm/route.ts`: uses the new server client for email OTP confirmation.
- `app/auth/success/page.tsx`: provides a post-login success page; useful for auth testing, not required for DB decoupling.
- `app/login/page.tsx`: uses the new server client to redirect already-signed-in users.
- `app/login/login-form.tsx`: uses the new browser client for Google login and magic-link login.
- `app/globals.css`: adds auth page styles required by the new login UI, but not by the database decoupling itself.

#### Likely unrelated drift
- `.vscode/settings.json`: only changes the editor window title to show the feature branch name; no runtime effect on env selection or Supabase wiring.

### 2. package.json analysis
- `dev` runs `echo 'ERROR: choose an environment → npm run dev:old or npm run dev:new' && exit 1`.
  - This deliberately blocks generic `npm run dev` and forces the developer to choose an env source first.
- `dev:old` runs `cp .env.old-project .env.local && next dev`.
  - This implies the old UFit-linked configuration is stored in a local file named `.env.old-project`.
- `dev:new` runs `cp .env.gym-notebook .env.local && next dev`.
  - This implies the new Gym App-targeted configuration is expected in a local file named `.env.gym-notebook`.
- The environment-selection mechanism is file-copy based, not argument based and not runtime conditional.
  - The app itself only reads the env currently present in `.env.local`.
  - Project selection therefore happens before Next.js starts, not inside app code.
- `build` and `lint` also changed.
  - `build` now runs plain `next build` instead of `node scripts/build-with-metadata.mjs`.
  - `lint` now runs `next lint` instead of `eslint .`.
  - These changes do not appear necessary for the DB decoupling goal and likely represent branch drift or collateral edits.
- Prior scripts were moved under `archivedScripts`.
  - That preserves prior commands for reference, but it also indicates this branch is changing more than just env selection.

### 3. Environment variable strategy
- Supabase env variable names referenced by the app:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
  - Legacy fallbacks still supported in some files:
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
- Where those variables are read:
  - `lib/supabase.ts`
    - reads `NEXT_PUBLIC_SUPABASE_URL`
    - reads `SUPABASE_SECRET_KEY`
    - falls back to `SUPABASE_SERVICE_ROLE_KEY`
  - `lib/env.ts`
    - reads `NEXT_PUBLIC_SUPABASE_URL`
    - reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
    - reads `SUPABASE_SECRET_KEY`
    - this file is currently unused
  - `lib/supabase/client.ts`
    - reads `NEXT_PUBLIC_SUPABASE_URL`
    - reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
    - falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `lib/supabase/server.ts`
    - reads `NEXT_PUBLIC_SUPABASE_URL`
    - reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
    - falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Separate old/new env files or switching scripts:
  - Yes. Local files `.env.old-project` and `.env.gym-notebook` exist in the repo root but are gitignored.
  - Yes. `scripts/use-old-env.sh` and `scripts/use-gym-env.sh` copy one of those files into `.env.local`.
  - Yes. `package.json` duplicates that same behavior in `dev:old` and `dev:new`.
- Whether `.env.example` reflects the new dedicated Gym App project setup:
  - Partially yes.
  - It now documents the newer key names `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`, which aligns with a modern Supabase setup.
  - It does not document the legacy fallback names, which suggests the desired steady state is the new naming.
  - It includes `NEXT_PUBLIC_SITE_URL`, which fits the added auth flow.
  - It does not clarify the two-file local switching approach, and the filename `.env.gym-notebook` still suggests transitional naming rather than a final polished Gym App convention.

### 4. Supabase client architecture
- `lib/supabase.ts`
  - Exports `createAdminClient()`.
  - Uses `@supabase/supabase-js`.
  - Intended for privileged server-side reads/writes.
  - Prefers `SUPABASE_SECRET_KEY` but still accepts legacy `SUPABASE_SERVICE_ROLE_KEY`.
- `lib/env.ts`
  - Exports a simple `env` object backed by `requireEnv(...)`.
  - Uses only the new env names.
  - Is not imported anywhere in the current branch.
- `lib/supabase/client.ts`
  - Exports `createClient()` for browser auth usage.
  - Uses `createBrowserClient()` from `@supabase/ssr`.
  - Prefers `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` but falls back to legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `lib/supabase/server.ts`
  - Exports async `createClient()` for server/auth usage.
  - Uses `createServerClient()` from `@supabase/ssr` plus `next/headers` cookies integration.
  - Prefers `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` but falls back to legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Which file appears to be the current source of truth:
  - For privileged data access, `lib/supabase.ts` is still the active source of truth.
    - Evidence: `lib/supabase/workout-content.ts` and `lib/supabase/workout-app-state.ts` both import `createAdminClient()` from `../supabase`.
  - For auth/session clients, the new sources of truth are `lib/supabase/client.ts` and `lib/supabase/server.ts`.
    - Evidence: `app/page.tsx`, `app/login/page.tsx`, `app/login/login-form.tsx`, `app/auth/callback/route.ts`, and `app/auth/confirm/route.ts` all use those new files.
- Whether the refactor is complete or mixed:
  - Mixed.
  - The admin data path still uses the old single-file helper pattern in `lib/supabase.ts`.
  - The auth/session path uses the new split client/server SSR pattern.
  - `lib/env.ts` looks like an attempted centralization step that has not yet been adopted.
- Whether old and new approaches coexist:
  - Yes.
  - Old/new coexist both in file structure and in env naming fallbacks.

### 5. Old-project vs new-project coupling
- What still appears coupled to the old UFit Supabase project:
  - `package.json` still exposes `dev:old`, which explicitly targets `.env.old-project`.
  - `scripts/use-old-env.sh` still exists and targets `.env.old-project`.
  - `lib/supabase.ts` still accepts legacy `SUPABASE_SERVICE_ROLE_KEY`.
  - `lib/supabase/client.ts` and `lib/supabase/server.ts` still accept legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Because project choice is entirely based on which env file is copied into `.env.local`, all active data access still has a path to the old project.
- What appears already redirected to the new Gym App project:
  - `.env.example` now documents the new key names rather than the legacy ones.
  - `lib/supabase.ts` prefers `SUPABASE_SECRET_KEY`.
  - `lib/supabase/client.ts` and `lib/supabase/server.ts` prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  - `package.json` exposes `dev:new` and the repo includes `scripts/use-gym-env.sh`.
  - The auth implementation is built around the newer SSR client pattern, which is consistent with a fresh Supabase project setup.
- What remains ambiguous:
  - The actual contents of `.env.old-project` and `.env.gym-notebook` were not inspected, by design, to avoid exposing secrets.
  - Because of that, repo inspection alone cannot prove which Supabase project each file actually points to.
  - The name `.env.gym-notebook` may refer to the intended new Gym App project, but the naming is not fully aligned with the work-loop title.
  - There is no explicit project identifier, URL label, or comment in tracked code that names the new Supabase project.

### 6. Auth/UI drift audit
- `app/auth/`
  - Classification: possibly incidental
  - Reason: these files support the new auth/session flow using the new Supabase client architecture, but they are not required just to decouple database credentials from the old project.
- `app/login/`
  - Classification: possibly incidental
  - Reason: same as `app/auth/`; useful if the branch goal expanded into auth testing or auth-first entry, but not required for the narrower DB decoupling goal.
- `app/page.tsx`
  - Classification: possibly incidental
  - Reason: it now gates on auth and no longer loads workout content or app state, which is a major behavior shift not inherently required for DB decoupling.
- `app/globals.css`
  - Classification: probably unrelated
  - Reason: these additions are presentation styles for the new auth UI.
- `.gitignore`
  - Classification: required for DB decoupling
  - Reason: ignoring `.env.local`, `.env.old-project`, and `.env.gym-notebook` is directly tied to the local env-switch strategy.
- `.vscode/settings.json`
  - Classification: probably unrelated
  - Reason: editor-only branch-title change.
- `package-lock.json`
  - Classification: required for DB decoupling
  - Reason: it records the addition of `@supabase/ssr`, which the new server/browser client files depend on.

## Verify
- `git status` summary:
  - 8 modified tracked files and 10 untracked files are present on branch `feat/decouple-app-from-ufitdb`.
  - The changed set is broader than pure env/client decoupling because it includes auth pages, styling, editor config, and script/lint/build changes.
- `git diff --stat` summary:
  - 8 tracked files changed with 209 insertions and 51 deletions.
  - The largest tracked diff is `app/globals.css`, which is auth UI styling rather than decoupling logic.
- Key decoupling diff review:
  - `package.json` now forces an explicit old/new env choice and adds `dev:old` / `dev:new`.
  - `.env.example` switches documented names from legacy service-role naming to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.
  - `lib/supabase.ts` now prefers the new secret-key env name while preserving legacy fallback.
  - `package-lock.json` adds `@supabase/ssr` and bumps Supabase packages, which supports the new `lib/supabase/client.ts` and `lib/supabase/server.ts`.
  - `app/page.tsx` changes app behavior substantially by replacing workout loading with an auth gate.
- Search/grep summary for env names and old-project references:
  - New names found in tracked code: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
  - Legacy names still present in tracked code: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
  - Old/new env switch references found in tracked code: `.env.old-project`, `.env.gym-notebook`, `dev:old`, `dev:new`, `scripts/use-old-env.sh`, `scripts/use-gym-env.sh`.
  - `lib/env.ts` is not referenced anywhere, confirming the env-centralization step is incomplete.
  - `lib/supabase/workout-content.ts` and `lib/supabase/workout-app-state.ts` still depend on `lib/supabase.ts`, confirming the admin data path has not been fully refactored to the new structure.

## Capture

### Most likely intended completion state
The branch most likely aimed to make local development deterministic by forcing developers to choose whether the app runs against the legacy UFit Supabase project or the new dedicated Gym App project before starting Next.js. `dev:old` and `dev:new` look transitional rather than long-term ideal, because they preserve dual-project compatibility while the code and env conventions are still being migrated. “Done” for this branch probably means the app consistently uses the new Gym App project by default, the modern env names become the only required contract, and any temporary compatibility layer for the old project is either removed or clearly marked as migration-only.

### Recommended next actions
1. Keep the env-contract changes that move the codebase toward `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`, plus the `@supabase/ssr` client/server helpers if auth-based Supabase access is intended.
2. Split or discard the clearly non-decoupling drift: `.vscode/settings.json`, the auth styling in `app/globals.css`, and any build/lint script changes that are not required by the Supabase migration.
3. Decide whether dual-run support is temporary; if yes, document a single intended end-state env file and remove ambiguity around `.env.gym-notebook` naming.
4. Finish the architecture decision: either adopt `lib/env.ts` as the shared source of truth or remove it, because it is currently dead code.
5. Review whether `app/page.tsx` should remain an auth gate; as written, it changes product behavior beyond DB decoupling and may belong in a separate branch.

### Open questions / ambiguities
- Does `.env.gym-notebook` actually point to the new dedicated Gym App Supabase project, or is it another intermediate naming layer?
- Is the long-term goal to keep `dev:old` and `dev:new`, or are they only temporary migration aids?
- Should the admin data path in `lib/supabase.ts` remain separate from the newer `lib/supabase/client.ts` and `lib/supabase/server.ts`, or was a fuller refactor intended?
- Was the auth/login flow intentionally part of this branch’s scope, or was it incidental work done on the same branch?
- Should `lib/env.ts` become the canonical env reader, or should it be removed as unused?
