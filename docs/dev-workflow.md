# Development Workflow

This document defines the default development workflow for gym-app-vibe.

The goal is to keep the project easy to evolve while protecting real workout usability.

This is a small personal project, so the workflow prioritizes:

- clarity
- small changes
- practical testing
- minimal process overhead

---

# Core Principles

- Prefer small, targeted changes over broad refactors.
- When a real-use bug is discovered, fix the bug and add a regression test if logic or data behavior is involved.
- Keep implementation and test commits separate when practical.
- Treat the Exercise domain model as the source of truth.
- Preserve real workout usability over theoretical architectural purity.
- Avoid unnecessary abstractions until the app clearly needs them.

---

# Source-of-Truth Model

The canonical exercise data model is defined in:

types/exercise.ts

Agents and documentation must treat this file as the authoritative definition of the Exercise structure.
Do not redefine the model in documentation.

Rules:

- `sets` is numeric
- `reps` is string-capable
- `weight` is string-capable
- `notes` is string-capable

Do **not** coerce `reps` or `weight` into numbers during:

- UI input
- state handling
- persistence
- hydration
- normalization

Examples of valid values:

```
weight: "7.5"
weight: "bodyweight"
weight: "bar + 10"

reps: "10"
reps: "8-10"
reps: "AMRAP"
```

---

# Integer Input Rule

For required integer fields in forms and API payloads:

- keep draft form state as `string`
- parse and validate at save or submit time
- reject invalid integer values in both `POST` and `PATCH` handlers with `400`

For numeric inputs in the UI, prefer:

- `type="number"`
- `min={1}`
- `step={1}`
- `inputMode="numeric"` when appropriate

Do not silently coerce partial or invalid integer input into fallback values during editing.

---

# Default Change Workflow

For most fixes or features:

1. Understand the issue or feature.
2. Identify the smallest correct change.
3. Implement the change.
4. Add focused tests if logic or data behavior changed.
5. Run validation commands.
6. Perform a manual smoke test when the change affects workout use.

---

# When To Add Tests

Add tests when changes affect:

- data models
- normalization logic
- hydration/merge logic
- persistence (localStorage)
- calculations
- state transitions
- bug fixes involving behavior

Skip tests for:

- copy edits
- styling changes
- layout tweaks
- purely visual changes

---

# Testing Preference

Prefer tests in this order:

1. Pure logic tests
2. Regression tests for bugs
3. Small component tests when needed
4. Manual workout smoke tests

Avoid heavy or complex test suites unless the app clearly requires them.

---

# Regression Test Rule

When a bug is discovered during real use:

1. Fix the bug.
2. Add a targeted regression test that would have failed before the fix.
3. Keep the test focused on the fragile behavior that broke.

Example regression cases:

- decimal weight values
- string weights like "bodyweight"
- localStorage round-trip issues
- normalization edge cases

---

# Commit Conventions

When practical, separate commits like this:

Implementation commit examples:

- `fix: allow decimal and string weight values`
- `feat: add exercise collection filtering`
- `refactor: extract exercise state helpers`

Test commit examples:

- `test: add regression tests for exercise state`
- `test: cover localStorage round-trip`

Reasons:

- cleaner Git history
- easier code review
- easier debugging and bisecting

---

# Validation Checklist

Before finishing a change, run what applies:

```
npm run test
npm run type-check
npm run lint
```

Fix issues before committing when practical.

---

# Manual Workout Smoke Test

Use this after changes affecting workout behavior.

## Editing

Verify:

- sets can be changed
- reps can be edited
- weight accepts decimal values
- weight accepts alphanumeric values
- notes can be edited

## Persistence

Verify:

- refresh preserves edits
- reopening the app preserves edits
- values are not unexpectedly coerced

## Workout Flow

Verify:

- swipe navigation works
- set checkboxes work
- completion tracking behaves correctly
- inputs do not lose focus unexpectedly

## Data Sanity

Verify:

- `sets` remains numeric
- `reps` remains string-capable
- `weight` remains string-capable
- older saved values do not break hydration

---

# Codex Guidance

When instructing Codex for fixes or features:

Prefer instructions that:

- implement the smallest correct change
- respect the source-of-truth Exercise model
- add focused regression tests when logic changes
- avoid unnecessary refactors
- keep tests small and readable

---

# Notes

This file exists so that development habits do not rely on memory or chat history.

Agents and developers should consult this document when making changes to the project.
