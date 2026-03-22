# ⚠️ Architecture Drift Guard: Codex Design Conformance Review

## Purpose

This document defines a **simple review process using Codex** to check that code changes continue to follow the project's architectural design documents.

These documents are primarily written for humans, but they can also serve as **design oracles** during automated review.

The goal is to detect **architectural drift early**, before implementation gradually diverges from intended design.

---

# Core Idea

After significant implementation work, run a **Codex Design Conformance Review**.

Codex reads the design documents and compares them against the current implementation.

It reports whether the code:

• aligns with the design
• shows signs of drift
• violates architectural rules

Codex should **not modify code during this review step**.

This is strictly a **diagnostic pass**.

---

# When To Run This Review

Run the review after significant changes such as:

• session persistence changes
• navigation or routing changes
• Home dashboard redesign work
• workout session lifecycle changes
• timer/session tracking additions
• history or analytics features
• large Codex-generated refactors

The review acts as an architectural safety check.

---

# Design Documents Used As Review Sources

Codex should treat these documents as the **source of architectural intent**.

Example documents:

```
docs/ux/home-dashboard.md
docs/ux/home-dashboard-chat-starter.md
docs/architecture/workout-session-model.md
docs/architecture/workout-state-boundaries.md
```

Additional design documents may be added over time.

---

# Review Prompt Template

Use a prompt like this with Codex CLI:

```
Review the recent implementation for conformance with the project design documents.

Use these documents as the design source of truth:
- docs/ux/home-dashboard.md
- docs/ux/home-dashboard-chat-starter.md
- docs/architecture/workout-session-model.md
- docs/architecture/workout-state-boundaries.md

Tasks:

1. Read the design documents first.
2. Inspect the recent code changes in the repository.
3. Identify any mismatches between the implementation and the documented design intent.
4. Pay special attention to:
   - whether progress, not navigation, defines session identity
   - whether session state is being used as history
   - whether exercise content, session state, and future-history concerns remain separated
   - whether Home behavior still aligns with the dashboard direction

Classify findings as:

- aligned
- drift risk
- direct violation

Do not modify code.

Return:

- a short conformance verdict
- files reviewed
- any design mismatches
- any ambiguity in the docs that made review harder
- recommended fixes if needed
```

---

# Optional: Review Only Recent Changes

For faster analysis, restrict the review to modified files.

Example:

```
Review only files changed in the current branch for conformance with the design documents.
```

This keeps the review focused on new work.

---

# Architectural Invariants To Watch

These rules should remain stable as the Gym App evolves.

### Session Model

• Session identity must come from **workout progress**, not navigation.
• Navigation alone must not create durable session state.
• Reset Session is the explicit clear boundary.

### State Boundaries

• Exercise content remains canonical workout definition.
• `gym_app_state` stores latest session progress only.
• Workout history must not be inferred from session state.

### UI Direction

• Home should act as a workout decision surface.
• Resume behavior should be explicit and predictable.

---

# Why This Process Exists

Over time, implementations drift from original design intent.

This process provides a lightweight guardrail that:

• catches drift early
• reinforces architectural boundaries
• allows Codex to assist with design integrity

It complements human code review rather than replacing it.

---

# Summary

After significant changes:

1. Run a Codex Design Conformance Review.
2. Compare implementation against design documents.
3. Identify architectural drift before continuing development.

This keeps the Gym App architecture intentional as the codebase grows.

