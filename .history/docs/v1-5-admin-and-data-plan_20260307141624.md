# Gym App – v1.5 Admin and Data Plan

## Purpose

This document defines the next phase of development following the **v1 prototype** of the Gym App.

The v1 prototype successfully validated the **mobile workout execution model**. However, two critical gaps prevent the app from being truly usable in day-to-day workouts:

1. There is no interface to **create, edit, or manage exercises and collections**.
2. The app has not yet integrated the real exercise inventory contained in `docs/GymExerciseDatabase.md`.

The goal of v1.5 is to address these limitations while **avoiding unnecessary architectural complexity**.

---

# Current Limitation

The prototype currently relies on **hard-coded seed data**. This means that modifying workouts requires editing code.

This creates several problems:

* exercises cannot be added easily
* workouts cannot be adjusted quickly
* the system cannot evolve naturally through use
* real exercise data cannot be integrated easily

Because of this, the prototype cannot yet be used as a daily gym tool.

---

# Objectives of v1.5

The next iteration focuses on **data usability rather than execution UX**.

Goals:

* Import the real exercise inventory from `GymExerciseDatabase.md`
* Provide a simple **desktop-oriented admin interface**
* Allow workouts and exercises to be managed without editing code
* Maintain the lightweight architecture of the prototype

---

# Guiding Principle

The project should continue to avoid premature complexity.

The v1 prototype deliberately avoided:

* backend services
* authentication
* databases
* analytics
* complex state management

This principle continues in v1.5.

The system should remain **simple and local-first** until real usage proves that additional infrastructure is necessary.

---

# Phase A – Normalize Exercise Data

The first step is converting the exercise information contained in:

```
docs/GymExerciseDatabase.md
```

into the application's internal data structure.

### Target Data Structure

Exercises should follow a structure similar to the existing seed format.

Example:

```json
{
  "id": "bench-press",
  "name": "Bench Press",
  "sets": 3,
  "reps": 10,
  "weight": 135,
  "notes": "Keep elbows tucked"
}
```

Collections should group exercises:

```json
{
  "id": "day-1",
  "name": "Day 1",
  "exerciseIds": [
    "bench-press",
    "incline-dumbbell-press",
    "triceps-pushdown"
  ]
}
```

### Outcome

This step ensures the system runs on **real exercise data instead of placeholder seed data**.

---

# Phase B – Desktop Admin Interface

The next requirement is a **simple management interface**.

This interface is primarily intended for use on a desktop computer when planning workouts at home.

## Admin Capabilities

The admin interface should allow:

### Collection Management

* create collections (Day 1, Day 2, etc.)
* rename collections
* delete collections
* reorder exercises inside collections

### Exercise Management

* create exercises
* edit exercises
* delete exercises
* assign exercises to collections
* move exercises between collections

### Exercise Editing

Editable fields:

* exercise name
* sets
* reps
* weight
* notes

---

# Admin Interface Approach

The admin UI can exist inside the same application.

Example route:

```
/admin
```

Possible subroutes:

```
/admin/collections
/admin/exercises
/admin/exercise/[id]
```

This interface does **not need to be optimized for mobile**.

It is intended for **desktop editing and workout planning**.

---

# Phase C – Local Persistence

All data should continue to persist locally.

The simplest approach is:

```
localStorage
```

Advantages:

* zero backend complexity
* instant iteration
* sufficient for personal usage
* easy debugging

This keeps the architecture consistent with the v1 prototype.

---

# Why a Database Is Deferred

A database introduces additional complexity:

* schema design
* migrations
* authentication
* deployment infrastructure
* remote state management

These costs are not yet justified.

A database becomes useful when one or more of the following occur:

* workouts must sync across multiple devices
* the app is shared with other users
* long-term workout history becomes important
* the local data model becomes too fragile

Until then, **local storage remains the simplest solution**.

---

# Expected Result of v1.5

After completing v1.5, the system should allow the following workflow:

### At Home (Desktop)

```
open admin
edit exercises
assign exercises to collections
adjust sets/reps/weight
save
```

### At the Gym (Phone)

```
open collection
expand exercise
check sets
swipe to next exercise
complete workout
reset collection
```

This closes the gap between **prototype and usable personal tool**.

---

# Future Considerations

Once the system is used regularly, additional improvements may become valuable.

Possible future directions include:

* durable storage beyond localStorage
* optional workout history
* syncing across devices
* exporting and importing workout data
* more advanced workout planning tools

These should only be explored **after real usage reveals their necessity**.

---

# Summary

The v1 prototype proved that the **mobile workout execution interface works well**.

The next step is enabling **content management and real exercise data**.

v1.5 therefore focuses on:

* integrating the existing exercise database
* building a lightweight desktop admin interface
* maintaining a simple local-first architecture

This phase should transform the project from a **technical prototype** into a **practical personal gym tool**.
