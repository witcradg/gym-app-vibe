# Session Reset Behavior

## Problem
The app needs a clear user-facing definition of what "Reset Session" does so resume behavior stays predictable even if session persistence moves between Supabase and localStorage.

## Design
- The resumable session consists only of transient workout-progress and navigation state:
  - `setChecksByExercise`
  - `activeCollectionId`
  - `activeExerciseIndex`
  - `activeView`
- `Reset Session` clears the whole resumable session, not just the currently visible collection.
- After reset, there must be no resumable session state to restore on reload or revisit.
- Reset must not clear durable workout-definition edits such as exercise notes, reps, weight, or sets.
- The persistence backend may change, but reset semantics must remain the same.

## Dependencies
- Home workout execution UI
- Session persistence layer
- Restore/rehydration logic

## Risks
- Treating reset as collection-scoped can leave stale progress behind and confuse users.
- Mixing durable exercise edits with transient session state can cause reset to destroy intended workout content.
- Changing storage without preserving this contract can reintroduce partial-reset or phantom-resume bugs.

## Non-Goals
- This does not define workout history.
- This does not define admin content editing behavior.
