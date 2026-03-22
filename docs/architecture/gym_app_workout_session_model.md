# Gym App Workout Session Model

## Purpose

This document defines the conceptual model for how **workout sessions** behave in the Gym App. It serves as a reference to guide implementation decisions and prevent architectural drift as features evolve.

The goal is to keep the session lifecycle simple, predictable, and aligned with how users actually perform workouts.

---

# Core Principle

**Workout session identity is defined by progress, not navigation.**

A session becomes meaningful when the user performs actual workout progress, primarily represented by checked workout sets.

Navigation (opening collections, browsing exercises) is considered **secondary metadata** and should not create a durable session on its own.

---

# Session State Storage

Session state is stored in the `gym_app_state` record.

This state represents the **latest durable workout progress** for the signed-in user.

Session state persists across:

• page refresh
• leaving and returning to the app
• navigation to other routes

Session state is cleared only by **explicit user intent** (Reset Session).

---

# What Defines Meaningful Session State

The following fields represent meaningful session progress:

• `setChecksByExercise`

These fields represent **navigation metadata** and are considered secondary:

• `activeCollectionId`
• `activeExerciseIndex`
• `activeView`

Navigation metadata may be stored alongside progress but should not by itself create or justify a session.

---

# Session Lifecycle

## Session Start

A session begins implicitly when the user records meaningful workout progress.

Example:

• The first checked set in an exercise.

This approach avoids forcing the user to explicitly start a workout.

---

## Session Active

A session remains active while meaningful progress exists in session state.

Navigation within the workout may update metadata but does not define session identity.

---

## Session Reset

The **Reset Session** action explicitly clears the session state.

Reset Session performs the following actions:

• clears all set progress
• clears navigation metadata
• writes the cleared session state to persistence

After Reset Session, the next meaningful progress begins a new session.

---

# Autosave Behavior

Session progress is persisted automatically.

Typical flow:

1. User checks or unchecks a set
2. Local state updates
3. Autosave writes the updated session state to persistence

Autosave includes safeguards to prevent default initialization state from overwriting meaningful stored session state.

---

# Session Timer (Future Feature)

A workout timer may be added later.

Proposed behavior:

Session timer starts when:

• first meaningful progress occurs

Session timer updates `lastActivityAt` when progress occurs.

Session timer may stop when:

• user explicitly stops the session
• inactivity timeout occurs (example: 10 minutes)

The timer is informational and does not change session persistence rules.

---

# Relationship to the Home Dashboard

The Home Dashboard is the **decision surface** for session behavior.

It allows users to:

• resume an existing session
• start a workout
• reset the session

The dashboard separates **decision mode** from **workout execution mode**.

---

# Future Extensions

The session model supports later additions such as:

• workout completion records
• workout history
• workout duration statistics
• training progression charts

These features would introduce additional tables or records without altering the core session persistence model.

---

# Summary

Key rules:

• progress defines session identity
• navigation does not create a session
• session state persists until Reset Session
• first checked set implicitly starts a session

This model keeps the Gym App simple while allowing future features to grow naturally from the same foundation.
