import { describe, expect, it } from "vitest";

import { getNextExerciseOrder } from "./exercise-utils";

describe("exercise utils", () => {
  it("returns the next order at the end of the destination collection", () => {
    const nextOrder = getNextExerciseOrder(
      [
        { id: "a", collectionId: "upper", name: "Bench", order: 1, sets: 3 },
        { id: "b", collectionId: "upper", name: "Press", order: 4, sets: 3 },
        { id: "c", collectionId: "legs", name: "Squat", order: 2, sets: 3 },
      ],
      "upper",
    );

    expect(nextOrder).toBe(5);
  });

  it("ignores the moved exercise when calculating the destination order", () => {
    const nextOrder = getNextExerciseOrder(
      [
        { id: "a", collectionId: "upper", name: "Bench", order: 1, sets: 3 },
        { id: "b", collectionId: "upper", name: "Press", order: 4, sets: 3 },
      ],
      "upper",
      "b",
    );

    expect(nextOrder).toBe(2);
  });
});
