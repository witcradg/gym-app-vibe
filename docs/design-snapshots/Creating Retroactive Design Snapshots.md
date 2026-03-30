# Creating Retroactive Design Snapshots

## Purpose

Retroactive design snapshots capture the **current intended behavior and constraints** of an existing feature.

They are used to:

- prevent future regressions
- avoid re-discovering design through code
- give AI (Codex) a stable contract to preserve
- make future changes safer and more predictable

------

# When to Use This

Create a retroactive snapshot when:

- a feature already exists and works
- the design is spread across multiple files or sessions
- you plan to modify or extend the feature
- the area is sensitive (state, auth, persistence, integrations)

------

# Core Idea

You are not redesigning the system.

You are:

> **Extracting and freezing the design from existing code and knowledge**

------

# Workflow

```text
1. Identify feature area
2. Use Codex to analyze code
3. Capture design snapshot
4. Resolve ambiguities (if needed)
5. Save to docs/design-snapshots/
6. Use snapshot for all future changes
```

------

# How to Use Codex

## Step 1 — Ask for Analysis (NOT Implementation)

Use a prompt like:

```text
Read the code for [feature area].

Create a lightweight design snapshot for the current implementation.

Goal:
- capture the existing design contract
- identify what behavior appears intentional
- identify constraints that must be preserved
- call out any ambiguities or inconsistencies

Output format:
- Problem
- Design
- Dependencies
- Risks
- Non-goals (if clear)

Important:
- do not redesign
- distinguish observed behavior vs inferred intent
- explicitly mark uncertainty
```

------

## Step 2 — Review and Refine

You should:

- confirm what is correct
- fix anything Codex misinterprets
- clarify intent where needed
- remove accidental complexity from the description

------

## Step 3 — Save Snapshot

Location:

```text
docs/design-snapshots/
```

Example:

```text
docs/design-snapshots/gym-app-state.md
```

Keep it short (5–15 lines where possible).

------

# What the Snapshot Must Capture

A good retroactive snapshot should include:

## 1. Observed Behavior

What the system definitely does today

## 2. Design Contract

What must not change (constraints, invariants)

## 3. Dependencies

External systems or assumptions

## 4. Risks

Where future changes could break things

## 5. Non-Goals (optional)

What the system is explicitly NOT responsible for

------

# Critical Distinction

Separate:

- **Observed behavior** (from code)
- **Intended design** (what should be preserved)

If they differ, prefer the intended design and note the mismatch.

------

# How to Use the Snapshot Later

Before any Codex task:

```text
Read docs/design-snapshots/[file].md first.
Treat it as the design contract.
Preserve it unless explicitly changed.
```

------

# Common Mistakes to Avoid

❌ Letting Codex “clean up” ambiguity by inventing intent
❌ Turning the snapshot into a full spec
❌ Capturing every implementation detail
❌ Blindly trusting the code as the correct design
❌ Skipping review of Codex output

------

# When to Update the Snapshot

Update it when:

- the design intentionally changes
- new constraints are introduced
- a feature expands beyond its original scope

Do NOT update it for minor implementation details.

------

# Mental Model

- Code = current behavior
- Snapshot = intended contract
- Codex = executor constrained by contract

------

# One-Line Rule

```text
If a feature already exists and matters, snapshot it before changing it.
```

------

# Outcome

Used correctly, retroactive snapshots:

- reduce regressions
- make AI behavior more predictable
- improve multi-session continuity
- preserve system integrity over time

------

# Final Reminder

You are not documenting the past.

You are:

> **protecting the future behavior of the system**