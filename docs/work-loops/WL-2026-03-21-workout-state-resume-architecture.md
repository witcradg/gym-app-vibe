# Work Loop
WL-2026-03-21-workout-state-resume-architecture

## Goal
Ensure that a signed-in user’s in-progress workout can always be resumed reliably by automatically reloading resumable workout state from `gym_app_state`.

## Context
Field testing revealed that workout state can be lost if the user exits the application mid-session. The current persistence model may be mixing session state and durable exercise content, leading to unreliable restore behavior.

This work loop investigates the correct architectural boundary between:

- canonical exercise content
- resumable session state

The outcome should define the correct persistence model and restore strategy.

---

## Structured Prompt for Architecture Analysis

## Goal
Ensure that a signed-in user’s in-progress workout can always be resumed reliably by automatically reloading resumable workout state from `gym_app_state` whenever the app detects that the required current workout state is missing.

## Problem / Observed Failure
Field testing shows that the current approach breaks down when a user exits the app during a workout and later returns. The expected workout state is not always available on return. In a workout web app, accidental exits, refreshes, tab closes, and reopening later are normal behavior, so this failure mode must be treated as a core product issue.

## Current Behavior / Suspected Cause
The app appears to rely too heavily on transient client/session state for workout continuity. State required to resume an in-progress workout is not being reliably rehydrated from durable storage. There is also architectural ambiguity because persisted app state may be mixing two separate concerns:
- resumable session/progress state
- durable exercise content

This may be causing duplication, unclear source-of-truth behavior, and unreliable restore behavior.

A proposed refactor suggests separating canonical exercise content from resumable session state rather than storing both in one persisted app-state payload.

## Desired Behavior
When a signed-in user returns to the app, the app should automatically and silently restore the last in-progress workout from `gym_app_state` whenever the required resumable state is not already hydrated.

At the same time, exercise-definition edits made during workout use should be saved immediately to the canonical exercise table rather than being held only in memory or duplicated in session persistence.

## Product / Persistence Decisions
Treat the following fields as durable exercise content, not session state:
- sets
- reps
- weight
- notes

When these values are changed from the workout UI, they should be written through immediately to the exercise table.

Treat checked/completed sets as resumable session progress only for the current in-progress workout. They are not yet part of a historical workout record.

Treat `gym_app_state` as the persistence layer for resumable current-session state only, unless a strong reason is identified to include anything more.

Workout history is out of scope for this version and should be considered future work.

There should be only **one current resumable workout per signed-in user** in v1.

## Working Architectural Direction
Please evaluate and refine this split:

**Canonical exercise content**
- sets
- reps
- weight
- notes
- collection/exercise metadata
- other durable exercise-definition fields

**Resumable session state in `gym_app_state`**
- active collection/workout
- active exercise index
- checked/completed set state
- active view, if needed for resume
- any timestamps or status fields needed to identify an in-progress workout

## Open Design Questions
1. What is the best rule for detecting that resumable state is missing and should be rehydrated?
2. When exactly should rehydration run?
3. What is the correct minimal shape of `gym_app_state` for reliable resume?
4. Which fields belong in resumable session state versus canonical exercise content?
5. Should any additional fields be stored for resume besides checked-set progress and navigation?
6. How should the app distinguish:
   - active in-progress workout
   - completed workout
   - stale abandoned workout
   - no resumable workout
7. What failure modes exist if exercise content is saved immediately but session state is restored separately?
8. What is the safest implementation order to reduce risk while improving reliability?
9. Given the v1 rule of one resumable workout per signed-in user, what is the cleanest enforcement model in code and persistence?

## Constraints / Preferences
- Restore should happen automatically and silently.
- Reliability matters more than cleverness.
- The app should behave well under real-world web usage, including accidental exits and later return.
- `gym_app_state` should be used as the durable restore layer for resumable session state.
- Exercise-definition edits should be persisted immediately to canonical exercise records.
- Avoid duplication between canonical exercise content and resumable session persistence unless clearly justified.
- Workout history is not part of this version.
- Prefer the simplest robust v1 that can later evolve into workout history without forcing a major rewrite.

## Requested Output
Please analyze the likely failure mode and propose a robust architecture for workout restore behavior.

Your response should include:
1. Diagnosis of the likely weakness in the current approach
2. Recommended source-of-truth model
3. Recommended boundary between exercise content and resumable session state
4. Recommended trigger strategy for rehydration from `gym_app_state`
5. Recommended minimal schema/shape for resumable workout state
6. Recommended rule for enforcing one current resumable workout per signed-in user
7. Edge cases and failure modes
8. A concrete implementation strategy for the Gym App
9. A minimal first version and a future-hardened version

## Acceptance Criteria
A proposed solution is acceptable if it ensures that:
- a signed-in user can leave mid-workout and come back later
- the app silently restores the last in-progress workout
- transient client/session loss does not destroy resumability
- sets/reps/weight/notes changed from the workout UI are durably saved to exercise records
- checked/completed set state is preserved for resume of the current workout
- there is one clear current resumable workout per signed-in user
- resumable session state has a clear and minimal source of truth
- duplication between exercise content and session state is minimized or eliminated
- the solution does not require workout-history architecture yet

## Context / Known Implementation Detail
The workout session state is intended to be stored in `gym_app_state`. The app should reload that data whenever required resumable state is not present. A proposed refactor suggests separating canonical exercise content from resumable session state rather than storing both in one persisted app-state payload.

