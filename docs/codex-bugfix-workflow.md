# Codex Bugfix Workflow

This document defines the standard workflow for fixing bugs in **gym-app-vibe** when using Codex or other AI coding agents.

It complements the project development workflow defined in:

docs/dev-workflow.md

The goal is to produce **small, correct fixes with reliable regression protection**, without introducing unnecessary refactoring or complexity.

---

# Purpose

When fixing bugs, the agent should:

- identify the real root cause
- implement the smallest correct fix
- preserve the domain model
- avoid unrelated refactors
- add regression tests when logic or data behavior is affected

Codex works best when given **clear context and a definition of done**, similar to working with a human teammate. :contentReference[oaicite:0]{index=0}

---

# When To Use This Workflow

Use this workflow when a task involves:

- fixing a bug
- correcting behavior
- resolving test failures
- repairing data handling
- fixing persistence issues
- resolving runtime errors

This workflow should **not be used for large refactors or feature development**.

---

# Bugfix Execution Steps

## 1. Understand the Bug

Read the issue description carefully and confirm:

- what behavior is broken
- what the expected behavior should be
- where the problem appears in the code

If necessary, inspect:

- related files
- data models
- helpers
- persistence logic
- UI inputs

---

## 2. Identify the Root Cause

Determine the specific reason the bug occurs.

Examples:

- incorrect type handling
- data normalization issues
- persistence errors
- state synchronization problems
- incorrect conditional logic
- missing validation

Do **not** fix symptoms without identifying the root cause.

---

## 3. Locate the Smallest Correct Fix

Prefer solutions that:

- modify the smallest number of files
- avoid introducing new abstractions
- preserve existing architecture
- keep behavior consistent with the domain model

Avoid:

- unnecessary refactors
- renaming unrelated code
- stylistic rewrites
- broad structural changes

---

## 4. Implement the Fix

Apply the minimal code change required to resolve the bug.

Ensure that:

- the fix aligns with the Exercise domain model
- string-capable fields remain strings
- existing saved data remains compatible where practical

Do not change unrelated behavior.

---

## 5. Add a Regression Test (When Appropriate)

Add a test if the bug involved:

- data handling
- normalization
- persistence
- logic
- state transitions

The regression test should:

- reproduce the failing behavior
- pass once the fix is applied
- remain small and targeted

Example regression targets:

- decimal weight values (`"7.5"`)
- string weights (`"bodyweight"`)
- rep ranges (`"8-10"`)
- localStorage round-trip behavior

---

# Validation Steps

Before considering the fix complete, run:

```
npm run test
npm run type-check
npm run lint
```

Confirm:

- tests pass
- types are valid
- no new lint errors were introduced

---

# Commit Structure

When practical, separate commits like this:

### Implementation commit

Example:

fix: allow decimal and string weight values

### Test commit

Example:

test: add regression tests for exercise state

Reasons:

- clearer git history
- easier review
- easier debugging
- easier git bisect

---

# Expected Output From Codex

When completing a bugfix task, the agent should report:

1. Root cause of the bug
2. Files changed
3. Description of the fix
4. Tests added (if any)
5. Commands used for verification

---

# Guardrails

Agents performing bugfixes should follow these guardrails:

- do not introduce unrelated refactors
- do not modify architecture without explicit instruction
- do not convert string fields to numeric fields
- do not expand scope beyond the described bug
- keep tests focused and minimal

---

# Relationship to Project Workflow

This file defines the **bugfix-specific workflow**.

General development practices live in:

docs/dev-workflow.md

Agents and developers should consult both when implementing fixes.
