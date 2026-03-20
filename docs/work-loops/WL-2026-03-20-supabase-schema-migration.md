# WL-2026-03-20 — Supabase Schema Migration

## Goal
Move the necessary database tables from the UFit Supabase project into the Gym App Supabase project, creating the schema and initial data needed for the Gym App.

## Context
- Authentication is fully working.
- Google OAuth and magic links are both functional.
- The app homepage `/` correctly gates authentication and shows the authenticated app.
- Next objective is to establish the database layer for Gym App using schema and initial data derived from the UFit Supabase project.

## Workflow
Plan → Execute → Verify → Capture

---

## Plan

### Desired outcome
The Gym App Supabase project has:
- the required tables
- the required columns and constraints
- any required relationships
- any required seed/reference data
- appropriate decisions recorded about what was copied, adapted, renamed, or intentionally omitted

### Migration scope
To determine:
- which UFit tables are actually needed by Gym App
- which tables are app-specific and should not be migrated
- which auth-linked fields must map to Gym App users
- which data should be seeded versus manually recreated
- whether RLS is deferred, partially enabled, or enabled now

### Proposed approach
1. Inventory the relevant UFit tables.
2. Classify each table:
   - migrate as-is
   - migrate with adaptation
   - recreate manually
   - omit
3. Define Gym App target schema.
4. Create migration SQL for Gym App.
5. Populate initial reference/seed data.
6. Verify schema, relationships, and app-readiness.
7. Capture final decisions and follow-up tasks.

### Initial assumptions
- Gym App likely needs only a subset of UFit tables.
- We should prefer a clean recreation over a blind full export/import.
- We should avoid bringing over UFit-specific legacy structures unless they directly support Gym App.
- We should keep auth integration aligned with Supabase Auth users.
- We may defer full RLS hardening until core app flows are working, but schema should be built in a way that supports adding RLS cleanly.

### Key decisions to make
- Source of truth: direct SQL recreation vs dump/import vs manual rebuild
- Naming: preserve UFit naming or normalize for Gym App
- User linkage: `auth.users.id` UUID linkage strategy
- Seed data: what must exist on day one
- RLS timing: now vs later
- Migration format: Supabase SQL migration files vs dashboard/manual SQL

### Decisions made
- Confirmed Gym App migration scope is limited to:
  - `collections`
  - `exercises`
  - `gym_app_state`
- Explicitly excluded unrelated personal-app tables from the source Supabase project:
  - `instruments`
  - `url_reports`

---

## Execute

### Inventory
_To be filled during the session._

### Target schema
_To be filled during the session._

### Migration steps
_To be filled during the session._

---

## Verify

### Verification notes
- Confirmed target tables exist in the Gym App project:
  - `collections`
  - `exercises`
  - `gym_app_state`
- Confirmed `user_id` exists on all migrated Gym App tables.
- Confirmed imported data exists for the authenticated user.
- Confirmed Row Level Security is enabled on all three tables.
- Confirmed policies exist for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on all three tables.
- Confirmed all policies are scoped with `auth.uid() = user_id`.
- Confirmed Supabase SQL editor is not a reliable authenticated-user simulation because it runs as `postgres` with `auth.uid() = null`.
- Conclusion: RLS structure is correctly configured; final behavioral verification should occur through authenticated app reads/writes.

## Capture

### Decisions made
- Adopted Model A: all Gym App records are user-owned.
- Recreated schema rather than performing a raw structural copy.
- Added `user_id` to all migrated tables.
- Implemented RLS during initial schema setup rather than deferring it.
- Imported legacy workout data into the new user-owned schema for the authenticated user.

### Follow-up tasks
- Update app data access to query the new Supabase tables.
- Verify authenticated app reads for collections, exercises, and gym_app_state.
- Verify app writes succeed under RLS.
- Later evaluate whether `gym_app_state` should remain JSONB or be decomposed into more explicit relational tables.

