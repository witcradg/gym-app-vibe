import { describe, expect, it } from "vitest";

import type { Collection } from "@/types/collection";
import type { Exercise } from "@/types/exercise";

import { buildPrintableExerciseSections } from "./printable-exercises";

describe("buildPrintableExerciseSections", () => {
  const collections: Collection[] = [
    { id: "upper", name: "Upper", order: 1 },
    { id: "legs", name: "Legs", order: 2 },
    { id: "misc", name: "Unassigned", order: 3 },
  ];

  const exercises: Exercise[] = [
    {
      id: "e-2",
      collectionId: "upper",
      name: "Row",
      order: 2,
      sets: 3,
      reps: "8",
      weight: "80",
    },
    {
      id: "e-1",
      collectionId: "upper",
      name: "Bench Press",
      order: 1,
      sets: 3,
      reps: "8",
      weight: "100",
    },
    {
      id: "e-3",
      collectionId: "legs",
      name: "Squat",
      order: 1,
      sets: 3,
      reps: "5",
      weight: "225",
    },
  ];

  it("builds sections for every collection with exercises", () => {
    const result = buildPrintableExerciseSections(collections, exercises, null);

    expect(result.map((section) => section.collection.id)).toEqual(["upper", "legs"]);
    expect(result[0]?.exercises.map((exercise) => exercise.id)).toEqual(["e-1", "e-2"]);
    expect(result[1]?.exercises.map((exercise) => exercise.id)).toEqual(["e-3"]);
  });

  it("filters down to a single selected collection", () => {
    const result = buildPrintableExerciseSections(collections, exercises, "legs");

    expect(result).toHaveLength(1);
    expect(result[0]?.collection.id).toBe("legs");
    expect(result[0]?.exercises.map((exercise) => exercise.id)).toEqual(["e-3"]);
  });
});
