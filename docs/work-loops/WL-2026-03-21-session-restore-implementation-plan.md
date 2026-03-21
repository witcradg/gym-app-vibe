# WL-2026-03-21 — Session Restore Implementation Plan

## Goal
Implement a reliable resumable workout model so that a signed-in user can leave the app mid-workout and later return to the same in-progress workout without losing progress.

This plan is specifically for the current Gym App codebase and is intended to be shareable with ChatGPT for implementation support.

---

## Product Intent

### Current v1 rules
- One current resumable workout per signed-in user.
- No workout history yet.
- Canonical exercise content is durable and user-owned.
- Workout session progress is durable only for the current resumable workout.

### Durable exercise content
These fields belong to canonical exercise records, not resumable session state:
- `sets`
- `reps`
- `weight`
- `notes`
- exercise metadata
- collection metadata

Changes to those values from the workout UI should be persisted immediately to the canonical exercise tables.

### Resumable session state
These fields belong in `gym_app_state`:
- active collection
- active exercise index
- active view
- checked/completed set state
- lightweight session lifecycle metadata if needed

---

## Diagnosis Of Current Weakness

The current app mixes two different concerns into one persisted app-state payload:

1. canonical exercise content
2. resumable session progress

This causes several problems:
- source of truth is ambiguous
- exercise content is duplicated between canonical tables and `gym_app_state`
- restore depends too heavily on a server-provided initial payload
- returning to the app after refresh/close/reopen is fragile
- session restore can be invalidated by content-shape mismatches

Current code areas involved:
- `data/exerciseState.ts`
- `components/home/home-client.tsx`
- `app/actions/workout-app-state.ts`
- `lib/supabase/workout-app-state.ts`

The app currently persists:
- `exercisesById`
- `setChecksByExercise`
- `activeCollectionId`
- `activeExerciseIndex`
- `activeView`

That is broader than necessary for resumable session restore.

---

## Target Architecture

### Source of truth

#### Canonical content
Source:
- `collections`
- `exercises`

Owns:
- `sets`
- `reps`
- `weight`
- `notes`
- exercise ordering
- collection ordering
- names and descriptions

#### Resumable current workout
Source:
- `gym_app_state`

Owns:
- checked set completion state
- active collection
- active exercise index
- active view
- optional lifecycle metadata

### Core rule
`gym_app_state` must not be used to override canonical exercise content.

It should only restore:
- where the user was
- what sets were completed

---

## Recommended Minimal Resumable State Shape

Suggested v1 shape:

```ts
type PersistedWorkoutSessionState = {
  version: 1;
  status?: "in_progress" | "completed";
  activeCollectionId: string | null;
  activeExerciseIndex: number;
  activeView: "exercise-list" | "exercise-card";
  setChecksByExercise: Record<string, boolean[]>;
  updatedAt?: string;
  completedAt?: string | null;
};
```

### Minimal required fields for first pass
- `activeCollectionId`
- `activeExerciseIndex`
- `activeView`
- `setChecksByExercise`

### Optional but recommended soon
- `status`
- `updatedAt`

### Explicitly remove from persisted session state
- `exercisesById`
- any duplicate storage of `sets`
- any duplicate storage of `reps`
- any duplicate storage of `weight`
- any duplicate storage of `notes`

---

## Rehydration Strategy

### Desired rule
When a signed-in user returns and the current resumable workout state is missing in memory, the app should silently fetch durable resumable state from `gym_app_state` and restore it.

### Trigger
Run rehydration after:
1. canonical workout content has loaded
2. authenticated user state is established
3. client-side workout state is either missing or defaulted

### Practical detection rule
Treat resumable state as missing if all of the following are true:
- current view is `"collections"`
- `activeCollectionId` is `null`
- no checked sets exist anywhere

If that is true, fetch `gym_app_state`.

### Rehydration must normalize
The fetched session state must be normalized against current canonical content:
- drop set-check entries for missing exercises
- resize checkbox arrays to match current `exercise.sets`
- if `activeCollectionId` no longer exists, fall back to collections view
- clamp `activeExerciseIndex`
- if collection has no exercises, fall back to exercise list

### Important principle
Do not trust `gym_app_state` as raw shape to apply directly.
Always normalize it against current exercise content first.

---

## One Current Resumable Workout Per User

### Persistence rule
There should be exactly one `gym_app_state` row per signed-in user.

### Recommended enforcement
- `user_id` should uniquely identify the row
- writes should be upserts by user
- reads should fetch only the current user’s row
- RLS should already enforce `auth.uid() = user_id`

### App behavior implication
The app never needs to choose among multiple sessions in v1.
It only loads:
- current user
- current canonical content
- current resumable session row

---

## Recommended Implementation Order

Implement in this order to reduce risk.

### Step 1 — Shrink persisted session state
Update `data/exerciseState.ts`:
- remove `PersistedExerciseState`
- remove `exercisesById` from `PersistedAppState`
- rename `PersistedAppState` if useful, or keep the name temporarily for smaller changes

Update helpers:
- remove `mergeExerciseState(...)` as a persistence overlay mechanism
- keep `buildSetChecksState(...)`
- keep `restoreNavigationState(...)`
- update `buildPersistenceState(...)` so it only returns session/navigation data

Expected result:
- canonical exercises come from `exercises`
- resumable session state only contains progress/navigation

### Step 2 — Remove canonical-content restore from session bootstrap
Update `components/home/home-client.tsx`:
- stop using persisted state to override exercise fields
- initialize `exerciseState` directly from canonical seed exercises
- initialize `setChecksByExercise` and navigation from normalized persisted session state only

Expected result:
- no duplication between exercise content and session restore

### Step 3 — Add explicit client-side silent rehydration
In `components/home/home-client.tsx`:
- after initial load, detect when resumable session state is missing/default
- if missing, fetch latest `gym_app_state`
- normalize it against current collections/exercises
- apply it silently

Implementation options:
- add a dedicated server action for fetching current session state
- or reuse existing action if already suitable

Expected result:
- refresh/reopen/return reliably resumes current workout

### Step 4 — Normalize session state aggressively
Add a helper in `data/exerciseState.ts` or a new focused state helper file:
- `normalizePersistedSessionState(...)`

It should:
- validate shape
- validate collection existence
- clamp active index
- resize checkbox arrays
- discard invalid exercise ids

Expected result:
- stale or partially mismatched session state does not break restore

### Step 5 — Improve persistence reliability
Keep current debounced persistence, but add an additional flush trigger:
- `pagehide`
- or `visibilitychange`

This is specifically to reduce data loss if the user leaves before the debounce fires.

Expected result:
- fewer lost set-check updates on abrupt exits

### Step 6 — Add explicit session lifecycle metadata
If needed after the first stable pass, add:
- `status`
- `updatedAt`

Use cases:
- identify active in-progress session
- distinguish completed session from empty/default state
- eventually support stale-session heuristics

---

## Recommended File Changes

### Primary files
- `data/exerciseState.ts`
- `components/home/home-client.tsx`
- `app/actions/workout-app-state.ts`
- `lib/supabase/workout-app-state.ts`

### Possible supporting files
- `types/` only if needed
- new helper file if normalization logic becomes too large

### Files that should not become session state sources
- `collections`
- `exercises`

Those remain canonical content sources only.

---

## Edge Cases To Handle

1. User closes tab before debounce save fires
- Mitigation: flush on page hide

2. Exercise set count changed since last session
- Resize checkbox array to current set count

3. Exercise deleted since last session
- Drop orphaned `setChecksByExercise[exerciseId]`

4. Collection deleted since last session
- Clear `activeCollectionId` and fall back to `"collections"`

5. Saved exercise index is out of bounds
- Clamp to valid range

6. Session says `"exercise-card"` but no exercises remain
- Fall back to `"exercise-list"` or `"collections"`

7. Canonical content save succeeds but session save fails
- Content remains correct
- Session progress may lag, but restore remains coherent

8. Session row exists but is effectively empty
- Treat as no resumable workout

---

## Minimal First Version

Implement only:
- session state contains navigation + checkbox progress
- canonical exercise content no longer duplicated in `gym_app_state`
- silent rehydration from `gym_app_state` when current resumable state is missing
- normalization against current content

Do not add:
- workout history
- multiple session support
- superuser flows
- complex recovery UI

This is the smallest robust version.

---

## Future-Hardened Version

After the minimal version is stable:
- add `status`
- add `updatedAt`
- add `completedAt`
- add page-hide flush
- define clear “session complete” semantics
- later evolve from one current session row into historical workout records

This future version should be additive if the v1 boundary is kept clean now.

---

## Suggested Acceptance Tests

1. Start workout, check several sets, refresh page.
- Expected: user returns to same collection/exercise state with checked sets restored.

2. Start workout, close tab, reopen later while signed in.
- Expected: same in-progress session resumes silently.

3. Change reps/weight/notes/sets from workout UI, leave app, return.
- Expected: canonical exercise values are restored from exercise table.
- Expected: session restore does not rely on duplicated exercise fields.

4. Change set count, then restore session.
- Expected: checkboxes are normalized to new set count.

5. Delete or move an exercise from dashboard, then return to workout.
- Expected: restore does not crash; invalid session references are normalized away.

---

## Notes For ChatGPT Implementation

When implementing:
- prefer the smallest correct change
- avoid redesigning the workout UI
- do not add history architecture
- do not reintroduce duplication between exercise content and session persistence
- preserve immediate durable saves for exercise-definition edits
- add focused tests for state normalization and restore behavior where practical

The key invariant should become:

> Exercise content comes from canonical exercise records.
> Resume state comes from `gym_app_state`.
> The app silently reloads `gym_app_state` whenever current resumable state is missing.

