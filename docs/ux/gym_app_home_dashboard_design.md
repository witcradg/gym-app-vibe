# Gym App Concept: Home as Workout Dashboard

## Purpose
This document captures the concept of evolving the Gym App home page into a **Workout Dashboard**. The home page becomes the place a user goes when beginning a workout session and deciding what to do next.

This is a conceptual direction, not a finalized specification.

---

# Core Idea

Instead of acting purely as a navigation entry point, the home page should function as a **Workout Control Center**.

It answers three key questions for the user:

1. Do I have a workout already in progress?
2. What did I last work on?
3. What workout should I do next?

The page becomes the **decision surface** before entering workout execution.

---

# Conceptual Model

The app naturally divides into two modes:

**Decision Mode**

User is deciding what workout to start or resume.

**Workout Execution Mode**

User is actively performing a workout.

The Home Dashboard is the entry to **Decision Mode**.

---

# Minimal V1 Home Dashboard

A minimal first implementation should require no new database schema and reuse existing state.

## Section 1 — Resume Workout (if session exists)

Shown only when `gym_app_state` contains meaningful progress.

Example:

Resume Workout
Collection: Push Day
Exercise: Incline Press
Completed Sets: 3

Button:

Resume Workout


## Section 2 — Suggested Workout

Based on simple logic such as alternating collections.

Example:

Last Completed Workout: Day 1
Suggested Next Workout: Day 2

Buttons:

Start Day 1
Start Day 2


## Section 3 — Always Available Elements

Warmups and stretches may appear implicitly or be automatically included in any workout.

These do not need separate controls initially.


## Section 4 — Session Controls

Session management actions live on the dashboard.

Examples:

Reset Session
Start New Workout


---

# Interaction Flow

User opens the app.

Home dashboard loads.

If progress exists:

User sees "Resume Workout".

If no progress exists:

User selects a workout collection.

User enters Workout Execution Mode.


---

# Workout Session Lifecycle

Proposed lifecycle rules:

Session begins when:

• First meaningful progress occurs (first checked set)

Session persists until:

• User resets session

Session timer (future feature):

• Starts on first meaningful progress
• Stops explicitly or after inactivity


---

# Why This Direction Is Useful

This structure clarifies several design issues:

• Home button semantics
• Reset Session meaning
• Session persistence expectations
• Future workout timing
• Future workout history


---

# Non-Goals For V1

The dashboard concept does not require:

• Workout history
• Charts
• Complex scheduling
• Schema changes

Those can be added later.


---

# Relationship To Current Architecture

Current architecture already supports this direction:

• Exercise definitions are canonical
• Session progress is stored in `gym_app_state`

The dashboard simply becomes a clearer UI surface for these concepts.


---

# Future Evolution

Possible future additions:

• Last completed workout tracking
• Suggested workout rotation
• Workout session timer
• Workout completion summaries
• Progress charts


---

# Summary

The Home Dashboard reframes the app around a simple workflow:

Home Dashboard
    ↓
Start or Resume Workout
    ↓
Workout Execution

This separates decision-making from workout execution and aligns the UI with how users actually begin workouts.

