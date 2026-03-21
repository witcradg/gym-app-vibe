import { describe, expect, it } from "vitest";

import {
  createSeedExercises,
  hasResumableWorkoutState,
  normalizePersistedAppState,
  type PersistedAppState,
} from "./exerciseState";
import type { Exercise } from "../types/exercise";

const exercises: Exercise[] = [
  {
    id: "e-1",
    collectionId: "c-1",
    name: "Bench Press",
    order: 1,
    sets: 3,
    reps: "8",
    weight: "100",
    notes: "Touch and go",
  },
];

describe("normalizePersistedAppState", () => {
  it("drops legacy canonical exercise content and keeps resumable session state", () => {
    const normalized = normalizePersistedAppState(
      {
        setChecksByExercise: {
          "e-1": [true, false, false],
        },
        activeCollectionId: "c-1",
        activeExerciseIndex: 0,
        activeView: "exercise-card",
        // Legacy shape still present in old rows.
        exercisesById: {
          "e-1": {
            sets: 99,
            reps: "99",
            weight: "999",
            notes: "legacy",
          },
        },
      } as PersistedAppState & {
        exercisesById: Record<string, unknown>;
      },
      createSeedExercises(exercises),
      ["c-1"],
    );

    expect(normalized).toEqual({
      version: undefined,
      status: undefined,
      updatedAt: undefined,
      setChecksByExercise: {
        "e-1": [true, false, false],
      },
      activeCollectionId: "c-1",
      activeExerciseIndex: 0,
      activeView: "exercise-card",
    });
  });

  it("returns null when persisted state has no resumable workout data", () => {
    const normalized = normalizePersistedAppState(
      {
        setChecksByExercise: {
          "e-1": [false, false, false],
        },
        activeCollectionId: null,
        activeExerciseIndex: 0,
        activeView: "exercise-list",
      },
      createSeedExercises(exercises),
      ["c-1"],
    );

    expect(normalized).toBeNull();
  });
});

describe("hasResumableWorkoutState", () => {
  it("returns true when a workout has checked sets", () => {
    expect(
      hasResumableWorkoutState({
        setChecksByExercise: {
          "e-1": [true, false, false],
        },
      }),
    ).toBe(true);
  });

  it("returns false for empty session state", () => {
    expect(
      hasResumableWorkoutState({
        setChecksByExercise: {
          "e-1": [false, false, false],
        },
        activeCollectionId: null,
      }),
    ).toBe(false);
  });
});
