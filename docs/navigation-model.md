# Navigation Model

This document defines the intended navigation behavior for the gym-app-vibe prototype.

The navigation model was established after real workout testing and is designed to minimize accidental gestures during exercise execution.

This document exists so that future changes do not unintentionally break the interaction model.

---

# Navigation Hierarchy

The application has three navigation levels:

1. Collection List (Home Screen)
2. Exercise List (Collection View)
3. Exercise Card (Workout Execution View)

Navigation always moves **up or down this hierarchy**.

```
Collections
  ↓
Exercise List
  ↓
Exercise Card
```

---

# Gesture Model

Gestures have **different meanings depending on the current screen**.

## 1. Collection List (Home)

Purpose: choose a workout collection.

Allowed interactions:

- vertical scrolling
- tap to open a collection

Not allowed:

- horizontal swipe navigation
- vertical exercise paging

This prevents accidental navigation while browsing collections.

---

## 2. Exercise List

Purpose: browse exercises within a selected collection.

Allowed interactions:

- vertical scrolling through exercises
- tap an exercise to open the exercise card
- horizontal swipe right to return to the collection list

Not allowed:

- vertical paging between exercises

---

## 3. Exercise Card (Workout Execution)

Purpose: execute the workout exercise-by-exercise.

Behavior:

- one exercise card is shown at a time
- the card is locked in place (no free scrolling between cards)

Gestures:

- swipe **up** → next exercise
- swipe **down** → previous exercise
- swipe **right** → return to exercise list

Navigation between exercise cards must **autosave current state first**.

---

# Autosave Behavior

Autosave occurs when:

- moving to the next exercise
- moving to the previous exercise
- leaving the exercise card view

Saved data includes:

- sets completion
- reps
- weight
- notes

This ensures that accidental exits do not lose workout progress.

---

# Scroll vs Swipe Rules

Lists should always scroll normally.

```
Collection list → vertical scroll
Exercise list   → vertical scroll
Exercise card   → vertical swipe paging
```

Vertical swipe paging must **only exist in the exercise card view**.

---

# Design Goals

This navigation model is intended to:

- prevent accidental app exits
- make workout execution predictable
- keep browsing behavior simple
- support one-handed gym use
- minimize gesture conflicts with mobile browsers

---

# Implementation Notes

Navigation should be implemented with explicit view state such as:

```
collections
exercise-list
exercise-card
```

Swipe handlers should only be attached to the views that require them.

Do not attach swipe navigation globally.

---

# Future Considerations

Possible improvements that should preserve this model:

- restoring last exercise position on reload
- adding visible progress indicators (e.g. `3 / 12`)
- adding explicit next/previous buttons as backup controls
- workout resume functionality

These changes must **not alter the gesture model defined above**.

---

# Related Documents

Development workflow:

```
docs/dev-workflow.md
```

Bugfix workflow for navigation issues:

```
docs/codex-bugfix-workflow.md
```