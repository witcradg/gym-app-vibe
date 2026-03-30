# Using Design Snapshots *Before* Codex (Feature Workflow)

## Purpose

This workflow is used when adding or modifying a feature where **AI will implement the code (Codex)** and you want to:

- prevent incorrect assumptions
- avoid regressions
- preserve architectural intent
- improve multi-session continuity

This is not about slowing down development.
It is about **locking the design before execution**.

------

# Core Idea

AI participates in two distinct roles:

1. **Design partner** (ChatGPT / discussion)
2. **Implementation engine** (Codex)

Design Snapshots separate these roles.

------

# Workflow Overview

```text
1. Discuss feature with AI
2. Let design emerge
3. Decide direction
4. IF non-trivial → create Design Snapshot
5. Give snapshot to Codex
6. Implement
7. Verify
```

------

# Step-by-Step

## Step 1 — Discuss the Feature

Use AI normally:

- explore approaches
- ask for tradeoffs
- refine structure

Goal:

> Reach a clear direction, not perfect documentation

------

## Step 2 — Decide If Snapshot Is Needed

Ask:

> “Would Codex likely make a reasonable but wrong assumption here?”

If YES → create snapshot
If NO → go straight to implementation

------

## Step 3 — Create the Design Snapshot

Location:

```text
docs/design-snapshots/
```

Structure:

```md
# [feature-name]

## Problem
What are we solving?

## Design
How it works (key rules, constraints, relationships)

## Dependencies
What systems it relies on

## Risks
Where this could break or be misunderstood
```

Guidelines:

- 5–15 lines total
- no over-explaining
- capture constraints, not prose
- focus on what must NOT drift

------

## Step 4 — Hand Off to Codex

Always start with:

```text
Read docs/design-snapshots/[file].md first.
Treat it as the design contract.
Preserve that contract unless explicitly changed.
```

------

# Implementation Patterns

## Pattern A — Feature Fits Existing Design

Example: extending gym-app-state

```text
Read:
- docs/design-snapshots/gym-app-state.md

Feature:
[describe feature]

Constraints:
- stay within current design
- do not expand scope (e.g. no history if not defined)

Before coding:
1. confirm this fits the design
2. identify risks
3. implement minimally
```

------

## Pattern B — Feature Does NOT Fit Design

Example: adding workout history to current-state model

```text
Read:
- docs/design-snapshots/gym-app-state.md

Feature:
[describe feature]

Task:
Do NOT implement yet.

1. explain why this does not fit the current design
2. propose:
   - updating the existing snapshot OR
   - creating a new snapshot
3. outline the new design
```

------

# What This Prevents

Without snapshots, Codex will:

- infer missing constraints
- simplify data models incorrectly
- merge unrelated concerns
- bypass security unintentionally

With snapshots, Codex:

- respects system boundaries
- flags design mismatches
- avoids hidden regressions
- becomes a constrained executor

------

# Mental Model

- Discussion = exploration
- Snapshot = commitment
- Codex = execution within constraints

------

# When NOT to Use This

Skip snapshots when:

- change is small and obvious
- working in a single uninterrupted session
- no persistence, auth, or architecture involved

------

# Key Principle

> The snapshot is not documentation.
> It is a **constraint system for AI behavior**.

------

# One-Line Shortcut

Before using Codex:

```text
If this design matters, snapshot it.
```

------

# Expected Outcomes

If used correctly:

- fewer regressions
- fewer AI “guesses”
- clearer feature boundaries
- easier resume after time away
- better multi-agent consistency

------

# Final Reminder

You are not designing twice.

You are:

> **freezing the result of design so implementation cannot drift**