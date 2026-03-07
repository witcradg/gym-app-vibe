# Gym App v1 Implementation Plan

## Step 0 - Project Baseline
Confirm the Next.js project runs successfully and the current page renders.

No functional changes.

## Step 1 - Collections Home Screen
Build a mobile-first home screen that lists workout collections as large tap-friendly cards using simple local seed data.

Define minimal seed data structures for:

collections
exercises

Do not implement collection detail behavior yet.

## Step 2 - Collection Detail Screen
## Step 2 - Collection Detail Screen
Open a selected collection and show exercises in fixed user-defined order as collapsed cards.

Do not implement expanded exercise interaction yet.

## Step 3 - Expanded Exercise View
Allow tapping an exercise card to open an expanded execution view with exercise name, plan summary, notes area, set list, and close control.

## Step 4 - Set Checkboxes
Render one checkbox per set in the expanded view and allow checking/unchecking to track set completion.

## Step 5 - Completion Indicator
Mark an exercise as complete when all set checkboxes are checked and show a completion indicator on the collapsed card.

## Step 6 - Notes
Support viewing and editing short exercise notes in the expanded view, with notes remaining persistent.

## Step 7 - Adjust Control
Add an explicit Adjust action in the expanded view to update sets, reps, and weight with intentional user input.

## Step 8 - Swipe Navigation
While an exercise is expanded, enable swipe left/right navigation to previous/next exercise, keeping the target exercise expanded.

## Step 9 - Reset Collection
Add a Reset Collection action that clears all completed set checkboxes and completion indicators for that collection.

## Step 10 - Local Persistence
Persist execution state locally (e.g., localStorage) so completion, notes, and adjustments survive reloads without backend services.

## Constraints
- Keep implementation intentionally simple.
- Do not add backend, database, Supabase, auth, or analytics.
- Do not add workout history, session tracking, or complex abstractions.
- Prefer simple React components, minimal structure, and readable code.
