# Gym App Note Save RLS Failure Diagnosis

## Context

A field-tested issue was found that predates the recent session-restore refactor.

### Problem

When editing and saving a **Note** on an existing exercise from the workout UI, the save fails with a **Supabase RLS error**.

This issue was **not introduced** by the recent session-restore work.

## Requested Analysis

Please analyze the current implementation and confirm the likely root cause of the note-save failure.

Specifically, inspect:

1. The full code path used when exercise notes are edited and saved from the workout UI.
2. Which Supabase client is used in that write path.
3. Whether the request is running with the authenticated user session.
4. The ownership assumptions implied by the exercises-table code.
5. Which RLS policy condition is most likely failing.
6. Whether notes save uses the same write path as sets/reps/weight, or a different one.

Do **not** implement a fix yet.

## Findings Already Identified

### Files involved

- `components/home/home-client.tsx`
- `app/api/exercises/[id]/route.ts`
- `lib/supabase/workout-content.ts`
- `lib/supabase/server.ts`
- `lib/supabase/workout-app-state.ts`
- `types/workout-content-database.ts`
- `docs/work-loops/WL-2026-03-20-supabase-schema-migration.md`
- `supabase/migrations/20260312221000_create_workout_content.sql`
- `supabase/migrations/20260313100000_create_app_state.sql`

### Current write path for notes

From the workout UI:

- `handleChangeNote(...)` updates local client state.
- `handleSaveNotes(...)` calls `persistExercisePatch(activeExercise.id, { notes: ... })`
- `persistExercisePatch(...)` sends `PATCH /api/exercises/:id`
- `app/api/exercises/[id]/route.ts`:
  - loads the existing exercise
  - merges incoming values with existing values
  - calls `upsertExercise(...)`
- `lib/supabase/workout-content.ts`:
  - `upsertExercise(...)` uses `.from("exercises").upsert(..., { onConflict: "id" })`

### Supabase client used in this path

The write path uses the **server Supabase client** from `lib/supabase/server.ts`, created with `createServerClient(...)` and request cookies.

This is **not** the browser client.

### Does it run with the authenticated user session?

Most likely yes.

Reason:

- The server client is cookie-backed.
- The route is using the SSR Supabase client configured from request cookies.
- The code does not appear to be accidentally using a service role or anonymous-only client here.

So this does **not** primarily look like “wrong client” or “missing auth session”.

### Ownership assumptions implied by the code

The code in `lib/supabase/workout-content.ts` and `types/workout-content-database.ts` still models `collections` and `exercises` as if they are tables without `user_id`.

For example:

- row types do not include `user_id`
- mapping functions do not read/write `user_id`
- `upsertExercise(...)` does not send `user_id`

However, the migration notes in `docs/work-loops/WL-2026-03-20-supabase-schema-migration.md` state that:

- `user_id` exists on all Gym App tables
- RLS is enabled
- policies are scoped with `auth.uid() = user_id`

That suggests a mismatch between the **live schema** and the **current repository code/types/migrations**.

### Likely RLS policy condition failing

Most likely failing condition:

- `WITH CHECK (auth.uid() = user_id)` on `INSERT` for `exercises`

Why this is the strongest candidate:

- The code uses `upsert(...)`
- The upsert payload does **not** include `user_id`
- If the live table requires `user_id` ownership under RLS, then an insert/upsert-shaped write without `user_id` will fail policy evaluation

Suspected exact mismatch:

- Policy expects: `auth.uid() = exercises.user_id`
- Code sends: no `user_id` in the upsert payload

### Does notes save share the same write path as sets/reps/weight?

Yes, for exercise-definition edits.

- Notes save uses the same `/api/exercises/:id` PATCH path as reps/weight/sets adjustments from the workout UI.
- `handleAdjustToggle(...)` also flows into `persistExercisePatch(...)` and then `upsertExercise(...)`.

But checked sets are different:

- checked sets are persisted through `/api/workout-app-state`
- that path uses `lib/supabase/workout-app-state.ts`
- that is separate from exercise-record writes

So:

- `notes`, `sets`, `reps`, `weight` exercise-definition edits share one path
- checked/completed set state uses a different path

## Likely Root Cause

The most likely root cause is a **schema/code mismatch** after the app moved to user-owned Supabase tables with RLS.

The live database appears to require `user_id` ownership on `exercises`, but the current exercise write code still behaves as if `exercises` has no ownership column.

As a result:

- the request is probably authenticated
- but the `upsert` payload does not satisfy the RLS ownership condition
- so note save fails with an RLS error

## Exact policy/data mismatch suspected

Most likely mismatch:

- live RLS policy: `auth.uid() = user_id`
- write payload from `upsertExercise(...)`: missing `user_id`

Most likely failing operation:

- `upsert` on `exercises` triggering an insert-policy check, especially `WITH CHECK (auth.uid() = user_id)`

## Recommended fix options

Do not implement yet, but likely options are:

1. Replace `upsert` with `update` for existing exercise edits from the workout UI.
2. Update repository types and mapping functions to include `user_id` so code matches the live schema.
3. If insert/upsert semantics are still required, include `user_id` explicitly in inserted/upserted rows.
4. Commit the real schema/RLS migrations to the repo, because the checked-in SQL appears stale relative to the documented live schema.

## What I want you to do

Please review this diagnosis and answer:

- whether the above root-cause analysis is correct
- whether `upsert` vs `update` is the key behavioral issue under the current RLS model
- whether there are any alternative failure modes in this path that should be ruled out before implementing a fix

Do not implement code yet.
