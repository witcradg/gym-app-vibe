# Draggable Ordering Outline

## Goal

Replace manual numeric order editing with drag-and-drop ordering in the admin UI while keeping `order_index` as the persisted database field.

## Why

- Better UX than asking the user to manage order numbers directly.
- Reduces accidental ordering collisions.
- Lets the app own normalization of order values after every reorder.

## Recommended Scope

Start with exercise ordering inside a collection.

Do not start with collection ordering unless exercise reordering is working well first.

## Proposed Behavior

1. In `/admin/workouts`, allow dragging exercises within the selected collection.
2. The user expresses relative position by dragging, not by editing order numbers.
3. After drop, rewrite the selected collection's exercise `order_index` values to `1..n` in the new order.
4. Persist the updated exercise records to Supabase.
5. Refresh local admin state so the UI reflects the saved order immediately.

## Data Model

- Keep `exercises.order_index` in the database.
- Treat it as an implementation detail for persistence and sorting.
- Prefer not to expose exercise order as a primary manual input once drag-and-drop exists.

## Suggested Implementation Steps

1. Add a small reorder helper that takes a collection's exercises and returns the reordered list with normalized `order` values.
2. Add a bulk save path for reordered exercises.
3. Update the admin exercises panel to support drag-and-drop within the current collection.
4. On drop, compute the new list order and rewrite all affected exercise `order` values.
5. Persist the full reordered collection to Supabase.
6. Keep the moved exercise selected after save if practical.
7. Add focused tests for reorder normalization and persistence.

## Persistence Strategy

- Reindex the affected collection after each reorder.
- Use deterministic sequential values: `1, 2, 3, ...`.
- Do not try to preserve gaps.
- Do not depend on manual cleanup of duplicate order values.

## Risks

- Partial saves could leave ordering inconsistent if updates are not coordinated cleanly.
- Drag-and-drop can add UI complexity quickly if overbuilt.
- Mobile-style drag affordances are not needed here; this should stay desktop-first.

## Recommended Constraints

- Keep the implementation simple.
- Avoid introducing a large drag-and-drop framework unless native interactions prove insufficient.
- Do not change collection `order_index` behavior as part of the first exercise-reordering pass.
- Do not mix reorder work with unrelated admin UI redesign.

## Follow-Up Option

If exercise drag-and-drop works well, a later follow-up could apply the same pattern to collection ordering:

- drag collections in the left panel
- rewrite collection `order_index`
- keep `Unassigned` forced last in display logic
