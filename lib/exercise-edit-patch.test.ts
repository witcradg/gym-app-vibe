import { describe, expect, it } from "vitest";

import { buildExerciseEditPatch, hasExerciseEditPatch } from "./exercise-edit-patch";

describe("exercise edit patch", () => {
  it("returns only changed editable fields", () => {
    const patch = buildExerciseEditPatch(
      {
        notes: "before",
        reps: "8",
        sets: 3,
        weight: "135",
      },
      {
        notes: "after",
        reps: "10",
        sets: 3,
        weight: "135",
      },
    );

    expect(patch).toEqual({
      notes: "after",
      reps: "10",
    });
  });

  it("reports when no editable fields changed", () => {
    const patch = buildExerciseEditPatch(
      {
        notes: "",
        reps: "8",
        sets: 3,
        weight: "135",
      },
      {
        notes: "",
        reps: "8",
        sets: 3,
        weight: "135",
      },
    );

    expect(hasExerciseEditPatch(patch)).toBe(false);
  });
});
