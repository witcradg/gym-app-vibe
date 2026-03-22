# Gym App Workout State Boundaries

## Purpose

This document defines the boundaries between different categories of data in the Gym App. Clearly separating these categories helps prevent architectural drift as the application evolves and new features are added.

The Gym App currently involves three conceptual layers of data:

1. Exercise Content (canonical definitions)
2. Workout Session State (latest progress)
3. Workout History (future feature)

Understanding the boundaries between these layers ensures that each type of data serves a clear purpose and avoids unintended coupling.

---

# Layer 1 — Exercise Content (Canonical Data)

This layer defines the workout structure itself.

Examples:

• collections
• exercises
• sets
• reps
• target weight
• exercise notes (training guidance)

Characteristics:

• Stable definitions
• Edited intentionally by the user
• Persisted as canonical workout plans

This data answers the question:

"What is the workout plan?"

Content changes are explicit edits, not side effects of performing a workout.

---

# Layer 2 — Workout Session State

Workout session state represents the **latest in-progress workout**.

This data is stored in:

`gym_app_state`

Examples:

• checked sets (`setChecksByExercise`)
• active collection
• active exercise index
• view/navigation metadata

Characteristics:

• Represents the current or most recent workout session
• Automatically persisted
• Durable until the user explicitly resets it

This data answers the question:

"What workout progress exists right now?"

Key design rule:

**Session identity is defined by workout progress, not navigation.**

Navigation fields exist only as metadata to help restore the UI.

---

# Layer 3 — Workout History (Future)

Workout history records completed workouts over time.

Examples of future structures:

• workout_sessions
• exercise_sessions
• set_sessions

Possible fields:

• workout start time
• workout end time
• performed sets
• performed reps
• actual weight used

This data answers the question:

"What workouts have I done in the past?"

This layer enables features such as:

• workout summaries
• progress tracking
• training charts
• personal records

Workout history is not required for the core Gym App workflow and can be introduced later without changing existing layers.

---

# Key Boundary Rules

## Rule 1

Exercise content must never be implicitly modified by performing a workout.

Progress during a workout does not change the canonical plan unless the user intentionally edits the exercise.

---

## Rule 2

Workout session state represents **current progress only**, not historical data.

Reset Session clears this state.

---

## Rule 3

Workout history should be created only when a workout session is explicitly completed.

Session state should not double as historical storage.

---

# Relationship Between Layers

The three layers interact but remain separate.

Exercise Content
    ↓ defines
Workout Session State
    ↓ may eventually produce
Workout History

The boundaries ensure the Gym App remains simple while still allowing future growth.

---

# Example Workflow

User opens the app.

Home dashboard appears.

User starts working out.

Session progress is stored in `gym_app_state`.

User checks sets as they perform exercises.

If the user resets the session, progress clears.

In a future version, completing the workout could write a record to the history layer.

---

# Summary

The Gym App maintains three distinct layers of state:

Exercise Content
Workout Session State
Workout History

Maintaining clear boundaries between these layers keeps the architecture understandable and ensures future features can be added safely.

