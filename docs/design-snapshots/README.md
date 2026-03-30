# Design Snapshots

Lightweight design artifacts used to constrain AI (Codex) during implementation.

## When to use
- touching persistence, auth, or architecture
- multi-file or non-trivial changes
- resuming work after a break

## How to use
There are two separate documents that describe using design snapshots

design-snapshots/Using Design Snapshots with Codex.md
	For use with bug fixes 
design-snapshots/Using Design Snapshots Before Codex (Feature Workflow).md


1. Write a short snapshot (5–15 lines)
2. Before Codex:

   Read docs/design-snapshots/[file].md first.
   Treat it as the design contract.
   Preserve it unless explicitly changed.

## Purpose
Prevent AI from making reasonable but incorrect assumptions in critical areas.

## Rule
If the design matters, snapshot it.