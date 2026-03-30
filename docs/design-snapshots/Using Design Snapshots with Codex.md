# Using Design Snapshots with Codex

## Purpose

Design snapshots are lightweight documents that capture the **intended system behavior and constraints** for a specific area of the app.

They are used to:

- prevent regressions
- reduce AI guesswork
- preserve design decisions across sessions

They are **not** full specs and should remain short.

------

## When to Use a Design Snapshot

Use a snapshot when:

- touching persistence, auth, or architecture
- modifying behavior across multiple files
- handing off work to Codex
- resuming work after a break

Skip it for:

- small, obvious changes
- quick fixes in the same session

------

## Where It Lives

```
docs/design-snapshots/
```

Example:

```
docs/design-snapshots/gym-app-state.md
```

------

## Core Rule

Before using Codex:

> “Does this area have a design contract that must not drift?”

If yes → include the snapshot.

------

## How to Use with Codex

### 1. Always Reference the Snapshot

Start prompts with:

```
Read docs/design-snapshots/gym-app-state.md first.
Treat it as the design contract for this area.
Preserve that contract unless explicitly changed.
```

------

## A. Fixing a Bug

### Goal

Fix the issue **without violating the design**

### Prompt Pattern

```
Read:
- docs/design-snapshots/gym-app-state.md

Task:
[describe bug]

Instructions:
- preserve the design contract
- do not simplify or bypass constraints (e.g. RLS, user_id)

Before coding:
1. identify root cause
2. determine if this is design vs implementation drift
3. propose minimal fix
```

------

## B. Adding / Modifying a Feature

### Step 1 — Check Fit

Ask Codex:

```
Does this feature fit within the existing design snapshot?
```

------

### Case 1 — Fits Existing Design

```
Read:
- docs/design-snapshots/gym-app-state.md

Feature:
[describe feature]

Constraints:
- stay within current design
- do not expand scope (e.g. no history if not defined)

Before coding:
1. confirm fit
2. identify risks
3. implement minimally
```

------

### Case 2 — Does NOT Fit

```
Read:
- docs/design-snapshots/gym-app-state.md

Feature:
[describe feature]

Task:
Do not implement yet.

1. explain why this does not fit the current design
2. propose:
   - updating the existing snapshot OR
   - creating a new snapshot
3. outline the new design before coding
```

------

## What You Want Back from Codex

### For Bugs

- root cause
- design vs implementation issue
- minimal fix
- verification steps

### For Features

- fits design / does not fit design
- risks
- implementation plan
- verification steps

------

## Mental Model

- Conversation = exploration
- Snapshot = commitment
- Codex = execution constrained by commitment

------

## Key Principle

Design snapshots are not for documentation.

They exist to:

> **constrain AI behavior in areas where mistakes are expensive**

------

## Keep It Lightweight

- 5–15 lines is enough
- do not expand into full specs
- only create when needed
- expect fewer than ~10 total

------

## One-Line Shortcut

Before any Codex task in a sensitive area:

```
Use the snapshot. Preserve the contract.
```