import { describe, expect, it } from "vitest";
import type { Exercise } from "./exercises";
import {
  buildPersistenceState,
  createSeedExercises,
  deriveExerciseCompletionStatus,
  mergeExerciseState,
  restoreNavigationState,
} from "./exerciseState";

describe("exerciseState model and persistence", () => {
  it("keeps reps/weight as strings during seed normalization", () => {
    const seed: Exercise[] = [
      {
        id: "e-1",
        collectionId: "c-1",
        name: "Dumbbell Press",
        order: 1,
        sets: 3,
        reps: "8-10",
        weight: "7.5",
      },
      {
        id: "e-2",
        collectionId: "c-1",
        name: "Push-up",
        order: 2,
        sets: 2,
        weight: "bodyweight",
      },
      {
        id: "e-3",
        collectionId: "c-1",
        name: "Barbell Row",
        order: 3,
        sets: 4,
        weight: "bar + 10",
      },
    ];

    const normalized = createSeedExercises(seed);

    expect(normalized[0].reps).toBe("8-10");
    expect(normalized[0].weight).toBe("7.5");
    expect(normalized[1].weight).toBe("bodyweight");
    expect(normalized[2].weight).toBe("bar + 10");
    expect(typeof normalized[0].weight).toBe("string");
    expect(typeof normalized[0].reps).toBe("string");
    expect(typeof normalized[0].sets).toBe("number");
  });

  it("hydrates and persists reps/weight as strings without coercion", () => {
    const seed = createSeedExercises([
      {
        id: "e-1",
        collectionId: "c-1",
        name: "Dumbbell Press",
        order: 1,
        sets: 3,
      },
    ]);

    const hydrated = mergeExerciseState(seed, {
      seedSignature: "sig",
      exercisesById: {
        "e-1": {
          notes: "steady tempo",
          sets: 5,
          reps: "8-10",
          weight: "bar + 10",
        },
      },
      setChecksByExercise: {},
    });

    const persisted = buildPersistenceState(hydrated, { "e-1": [] }, "sig", {
      activeCollectionId: "c-1",
      activeExerciseIndex: 0,
      activeView: "exercise-card",
    });
    const roundTrip = JSON.parse(JSON.stringify(persisted)) as typeof persisted;

    expect(hydrated[0].sets).toBe(5);
    expect(typeof hydrated[0].sets).toBe("number");
    expect(hydrated[0].reps).toBe("8-10");
    expect(hydrated[0].weight).toBe("bar + 10");
    expect(typeof roundTrip.exercisesById["e-1"].reps).toBe("string");
    expect(typeof roundTrip.exercisesById["e-1"].weight).toBe("string");
    expect(roundTrip.exercisesById["e-1"].reps).toBe("8-10");
    expect(roundTrip.exercisesById["e-1"].weight).toBe("bar + 10");
  });

  it("converts legacy numeric saved reps/weight into strings on hydration", () => {
    const seed = createSeedExercises([
      {
        id: "e-1",
        collectionId: "c-1",
        name: "Legacy Exercise",
        order: 1,
        sets: 3,
      },
    ]);

    const hydrated = mergeExerciseState(seed, {
      seedSignature: "sig",
      exercisesById: {
        "e-1": {
          notes: "",
          sets: 3,
          reps: 10 as unknown as string,
          weight: 7.5 as unknown as string,
        },
      },
      setChecksByExercise: {},
    });

    expect(hydrated[0].reps).toBe("10");
    expect(hydrated[0].weight).toBe("7.5");
    expect(typeof hydrated[0].reps).toBe("string");
    expect(typeof hydrated[0].weight).toBe("string");
  });

  it("restores clamped exercise-card navigation from persisted state", () => {
    const runtime = createSeedExercises([
      {
        id: "e-1",
        collectionId: "c-1",
        name: "A",
        order: 1,
        sets: 2,
      },
      {
        id: "e-2",
        collectionId: "c-1",
        name: "B",
        order: 2,
        sets: 2,
      },
    ]);

    const navigation = restoreNavigationState(
      {
        exercisesById: {},
        setChecksByExercise: {},
        activeCollectionId: "c-1",
        activeExerciseIndex: 99,
        activeView: "exercise-card",
      },
      ["c-1"],
      runtime,
    );

    expect(navigation.view).toBe("exercise-card");
    expect(navigation.activeCollectionId).toBe("c-1");
    expect(navigation.activeExerciseIndex).toBe(1);
  });

  it("falls back to collections when persisted collection is invalid", () => {
    const navigation = restoreNavigationState(
      {
        exercisesById: {},
        setChecksByExercise: {},
        activeCollectionId: "missing",
        activeExerciseIndex: 3,
        activeView: "exercise-card",
      },
      ["c-1"],
      [],
    );

    expect(navigation.view).toBe("collections");
    expect(navigation.activeCollectionId).toBeNull();
    expect(navigation.activeExerciseIndex).toBe(0);
  });

  it("derives not-started, in-progress, and complete from set checks", () => {
    expect(deriveExerciseCompletionStatus(undefined, 3)).toBe("not-started");
    expect(deriveExerciseCompletionStatus([false, false, false], 3)).toBe(
      "not-started",
    );
    expect(deriveExerciseCompletionStatus([true, false, false], 3)).toBe(
      "in-progress",
    );
    expect(deriveExerciseCompletionStatus([true, true, true], 3)).toBe("complete");
  });
});
