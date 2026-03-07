# Gym App Concept

## Purpose

The Gym App is a **mobile-first workout execution tool** designed to help the user follow structured workouts at the gym with minimal friction.

The app prioritizes:

* clarity
* speed of interaction
* minimal cognitive load during workouts

It is **not intended to be a fitness analytics or tracking system** in its initial version. Instead, it functions more like a **training notebook and workout checklist**.

---

# Core Design Philosophy

The system separates **planning** from **execution**.

**Desktop / Home Environment**

Used to:

* create collections
* add exercises
* organize workout structure
* edit exercise parameters

**Phone / Gym Environment**

Used to:

* view workout collections
* execute exercises
* check off completed sets
* read exercise notes
* make occasional adjustments when needed

This separation keeps the workout experience simple and fast.

---

# Core Concepts

## Collections

Collections represent groups of exercises organized by function.

Examples:

* Day 1
* Day 2
* Warmups
* Stretches
* Rehab

Collections are the **top-level navigation** in the app.

Users typically maintain **around five collections**.

Collections are created and organized primarily in the desktop environment.

---

## Exercises

Each exercise belongs to **exactly one collection**.

Exercises contain the following properties:

* name
* number of sets
* number of reps
* target weight
* notes
* order within the collection

Exercises can be **moved between collections** when editing from the home/desktop environment.

Exercises appear in a **fixed order defined by the user**.

The phone interface respects this order but does **not enforce execution sequence**.

---

# Phone Interface

## Home Screen

The phone opens to a list of collections.

Example:

```
Day 1
Day 2
Warmups
Stretches
Rehab
```

Each collection is represented by a large tap-friendly card.

---

## Collection View

Opening a collection displays the exercises in their defined order.

Each exercise appears as a **collapsed card**.

Example:

```
Bench Press
3 × 10 @ 135

Incline DB Press
3 × 10 @ 70

Triceps Pushdown
3 × 12 @ 80
```

If an exercise is completed, a checkmark appears next to the exercise name.

```
Bench Press ✓
3 × 10 @ 135
```

Exercises **remain in place** when completed and do not move.

---

## Expanded Exercise View

Tapping an exercise expands it into an execution view.

Example layout:

```
Bench Press

3 × 10 @ 135   [Adjust]

Keep elbows tucked

☐ Set 1
☐ Set 2
☐ Set 3
```

Expanded view contains:

* exercise name
* plan (sets × reps @ weight)
* notes
* set checkboxes
* adjustment control

The interface avoids unnecessary labels where the meaning is clear.

---

## Set Completion

Each set is represented by a checkbox.

Example:

```
☐ Set 1
☐ Set 2
☐ Set 3
```

The number of checkboxes corresponds to the exercise’s configured set count.

When all sets are checked, the exercise is considered complete.

Example collapsed card:

```
Bench Press ✓
```

---

# Navigation

## Direct Navigation

Users can close the expanded card and return to the collection view.

This allows jumping freely between exercises.

---

## Swipe Navigation

While viewing an expanded exercise, users can swipe left or right to move to the previous or next exercise.

Swiping keeps the next exercise **expanded in execution mode**.

This supports smooth sequential workouts.

---

# Adjustments

Exercises include an **Adjust control**.

Example:

```
3 × 10 @ 135   [Adjust]
```

Adjustments allow modification of:

* sets
* reps
* weight

Adjustments update the exercise plan.

Edits require explicit action to reduce accidental changes.

More restrictive editing controls may be added later if necessary.

---

# Notes

Each exercise includes a **notes field**.

Notes are used for short reminders such as:

* technique cues
* reminders
* clarifying instructions

Example:

```
Keep elbows tucked
Pause at bottom
Use belt above 185
```

Notes are **persistent** and remain attached to the exercise definition.

They do not reset between workouts.

---

# Execution State

During a workout the app tracks:

* completed sets
* completed exercises

This execution state is **temporary**.

Execution state persists until the user resets it.

---

# Reset Behavior

Each collection includes a **Reset Collection** action.

Resetting clears all set checkboxes for exercises in that collection.

Example:

Before reset:

```
Bench Press ✓
Squat ✓
Pullups
```

After reset:

```
Bench Press
Squat
Pullups
```

The system does not automatically reset based on time.

This avoids unnecessary session or date complexity.

---

# UI Principles

The phone interface follows several guiding rules.

### Execution First

The phone experience prioritizes **doing the workout**, not managing it.

---

### Minimal Friction

Interactions should require as few taps as possible.

---

### Visual Clarity

Avoid unnecessary labels when layout already communicates meaning.

---

### Flexible Execution

Exercises are ordered but not enforced.

Users may perform exercises in any order.

---

### Explicit Edits

Workout parameters are normally defined at home.

Edits during workouts require intentional actions.

---

# Non-Goals for Initial Version

The initial version intentionally avoids:

* workout history
* performance analytics
* progress tracking
* workout sessions
* graphs or reports
* complex program management

These features may be considered in later versions.

---

# Summary

The Gym App is a **structured workout execution tool**.

It behaves like a **training notebook and workout checklist**, allowing users to organize exercises at home and execute workouts efficiently at the gym.

The design prioritizes simplicity, clarity, and speed of interaction over feature complexity.

