# Gym App State Persistence

## Problem
The app needs to persist each signed-in user’s in-progress workout state so they can leave and return without losing their current session state.

This persistence must work safely under Supabase Row Level Security (RLS) and must not allow one user to read or overwrite another user’s state.

## Design
- Persist one workout app state row per signed-in user.
- Use the fixed logical row id `gym-app-state` as the state document name.
- Treat the true record identity as **(id + user_id)**, not `id` alone.
- All reads must query by both:
  - `id = "gym-app-state"`
  - `user_id = authenticated user`
- All writes/upserts must include:
  - `id = "gym-app-state"`
  - `user_id = authenticated user`
- Persistence must use the SSR session-backed Supabase client so reads and writes execute in the authenticated user context.
- Client autosave behavior should persist meaningful workout-state changes without changing the core workout interaction model.

## State Scope
The persisted state is for the user’s current in-progress workout/session state, not a historical workout log.

Examples of expected persisted state:
- checked sets / exercise completion state
- active collection
- active exercise index
- active view
- related lightweight session state needed to restore the current experience

The persisted state should avoid storing unnecessary large static workout-definition data when that data already exists elsewhere.

## Dependencies
- Supabase authentication
- Supabase RLS policies on `gym_app_state`
- SSR auth-aware Supabase client
- App routes/actions that load and save workout state

## Constraints
- `user_id` is required for safe reads and writes.
- RLS is part of the contract, not an optional safeguard.
- The implementation must not rely on service-role access for normal user-state persistence.
- The fixed id `gym-app-state` may remain constant across all users only because user isolation is enforced through `user_id`.

## Risks
- Querying or upserting by `id` alone can cause RLS failures or incorrect assumptions about uniqueness.
- Omitting `user_id` from writes can produce failed persistence or 500 errors.
- Using a service-role client for normal app-state persistence can bypass intended security boundaries.
- Future refactors may incorrectly “simplify” the model into a single global row if the `(id + user_id)` contract is not preserved.
- Expanding this table into workout history or analytics data without redefining the model could mix “current state” and “historical record” concerns.

## Verification
- Signed-in user can load previously saved workout state.
- Signed-in user can update workout state and see it restored on refresh/revisit.
- Writes succeed under RLS using the authenticated SSR client.
- No persistence path uses `id` without `user_id`.
- No normal user-state path depends on service-role privileges.
- Logging is sufficient to diagnose auth/read/write failures if persistence breaks again.

## Non-Goals
- This design does not define workout history tracking.
- This design does not define multi-session archival.
- This design does not define analytics/event pipelines.
- This design only covers persistence of the user’s current workout app state.

