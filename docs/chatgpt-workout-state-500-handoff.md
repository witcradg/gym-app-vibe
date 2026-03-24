# Workout State Persistence 500 Issue

## Issue Summary

The app loads normally, but workout state persistence is failing. The server repeatedly returns `500` for `POST /api/workout-app-state`, which means client workout state changes are not being saved.

## Observed Terminal Output

```text
✓ Starting...
✓ Ready in 242ms
GET / 200
GET /api/workout-app-state 200
POST /api/workout-app-state 500
POST /api/workout-app-state 500
POST /api/workout-app-state 500
GET /dashboard/workouts 200
GET /api/collections 200
GET /api/exercises 200
GET /about 200
POST /api/workout-app-state 500
POST /api/workout-app-state 500
```

The key problem is the repeated:

```text
POST /api/workout-app-state 500
```

## What This Means

- Page rendering is working.
- Read endpoints are responding.
- Saving workout app state is failing on the server.
- This is unrelated to a recent UI-only label change (`Home` -> `Workout`).

## Relevant Code Paths

POST route:
- [app/api/workout-app-state/route.ts:14](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/workout-app-state/route.ts#L14)
- [app/api/workout-app-state/route.ts:26](/home/dean/projects/active/personal/gym/gym-app-vibe/app/api/workout-app-state/route.ts#L26)

Supabase persistence logic:
- [lib/supabase/workout-app-state.ts:32](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-app-state.ts#L32)
- [lib/supabase/workout-app-state.ts:37](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-app-state.ts#L37)

Supabase server client:
- [lib/supabase/server.ts:31](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/server.ts#L31)

Client code triggering the POST:
- [components/home/home-client.tsx:215](/home/dean/projects/active/personal/gym/gym-app-vibe/components/home/home-client.tsx#L215)
- [components/home/home-client.tsx:246](/home/dean/projects/active/personal/gym/gym-app-vibe/components/home/home-client.tsx#L246)
- [components/home/home-client.tsx:338](/home/dean/projects/active/personal/gym/gym-app-vibe/components/home/home-client.tsx#L338)

## Current Suspicion

There is likely a schema or RLS mismatch between the code and the actual Supabase table.

The current save path appears to upsert a single fixed row like:

- `id = "gym-app-state"`
- no `user_id`

But project planning docs suggest this table is supposed to be per-user, with RLS based on `auth.uid() = user_id`.

Evidence of mismatch:
- current migration defines a simple table: [supabase/migrations/20260313100000_create_app_state.sql:1](/home/dean/projects/active/personal/gym/gym-app-vibe/supabase/migrations/20260313100000_create_app_state.sql#L1)
- implementation plan refers to per-user state with RLS: [docs/work-loops/WL-2026-03-21-session-restore-implementation-plan.md:177](/home/dean/projects/active/personal/gym/gym-app-vibe/docs/work-loops/WL-2026-03-21-session-restore-implementation-plan.md#L177)

If the live dev database has the newer per-user schema or policies, the current upsert shape is probably invalid and would cause the 500s.

## Important Note

`GET /api/workout-app-state 200` does not prove the read path is correct. The fetch path appears to swallow errors and return `null`, so reads may be failing silently while writes surface as `500`.

## What I Need Help Fixing

Please inspect the persistence flow and determine the correct schema contract for `gym_app_state`, then update the read/write logic to match the real table and RLS expectations.

Most likely target file to fix:
- [lib/supabase/workout-app-state.ts](/home/dean/projects/active/personal/gym/gym-app-vibe/lib/supabase/workout-app-state.ts)

## Likely Fix Direction

- Confirm actual Supabase schema for `gym_app_state`
- Confirm whether table is global-row or per-user-row
- If per-user:
- include `user_id`
- query/update by authenticated user
- align upsert conflict target accordingly
- Make GET fail loudly enough for debugging, or at least log the underlying Supabase error
- Keep the fix minimal and avoid unrelated refactors

You are not alone in the codebase. Do not revert others' edits. Only create this new file. In your final response, list the file you created.
