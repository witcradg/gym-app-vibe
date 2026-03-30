# Supabase Integration Test Auth

## Problem
Supabase integration tests need to exercise RLS-protected workout tables without depending on a Next request context or service-role-only behavior.

## Design
- App runtime code continues to use the SSR cookie-backed Supabase client for normal authenticated behavior.
- Supabase data modules expose client-injected test paths so integration tests do not call `next/headers`.
- Integration tests must authenticate as a real user before touching `collections`, `exercises`, or `gym_app_state`.
- Test auth is configured from `.env.local` using `SUPABASE_INTEGRATION_TEST_REFRESH_TOKEN` and, when useful, `SUPABASE_INTEGRATION_TEST_USER_ID`.
- The refresh-token path is for test setup only; it must not replace the app's normal cookie/session architecture.

## Dependencies
- Supabase auth refresh flow
- Supabase RLS policies on workout tables
- Client-injected helpers in the Supabase data layer

## Risks
- Reverting tests to the SSR client path will reintroduce request-scope failures under Vitest.
- Running integration tests with service-role access can hide real RLS problems.
- Letting the test auth flow leak into production code would blur the separation between app auth and test setup.

## Non-Goals
- This does not redesign the app's authentication model.
- This does not make access tokens long-lived or remove normal Supabase session expiry behavior.
