import { describe, expect, it } from "vitest";
import { shouldResetSelectedExercise } from "./admin-workouts-state";

describe("admin workouts selection sync", () => {
  it("preserves a newly created exercise draft while create mode is active", () => {
    expect(
      shouldResetSelectedExercise({
        exerciseDraftId: "draft-1",
        exerciseEditorMode: "create",
        selectedCollectionId: "collection-1",
        selectedExerciseId: "draft-1",
        collectionExerciseIds: [],
      }),
    ).toBe(false);
  });

  it("preserves an existing selected exercise when it belongs to the collection", () => {
    expect(
      shouldResetSelectedExercise({
        exerciseDraftId: null,
        exerciseEditorMode: "edit",
        selectedCollectionId: "collection-1",
        selectedExerciseId: "exercise-1",
        collectionExerciseIds: ["exercise-1", "exercise-2"],
      }),
    ).toBe(false);
  });

  it("resets the selected exercise when it no longer exists in the collection", () => {
    expect(
      shouldResetSelectedExercise({
        exerciseDraftId: null,
        exerciseEditorMode: "edit",
        selectedCollectionId: "collection-1",
        selectedExerciseId: "missing-exercise",
        collectionExerciseIds: ["exercise-1", "exercise-2"],
      }),
    ).toBe(true);
  });
});
