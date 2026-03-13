import { describe, expect, it } from "vitest";

import {
  findUnassignedCollection,
  isUnassignedCollection,
  sortCollectionsForDisplay,
} from "./collection-utils";

describe("collection utils", () => {
  it("sorts collections by display order but forces Unassigned last", () => {
    const sorted = sortCollectionsForDisplay([
      { id: "unassigned", name: "Unassigned", order: 1 },
      { id: "legs", name: "Legs", order: 3 },
      { id: "upper", name: "Upper Body", order: 2 },
    ]);

    expect(sorted.map((collection) => collection.id)).toEqual([
      "upper",
      "legs",
      "unassigned",
    ]);
  });

  it("finds the Unassigned collection by name", () => {
    const collection = findUnassignedCollection([
      { id: "legs", name: "Legs", order: 2 },
      { id: "misc", name: "Unassigned", order: 1 },
    ]);

    expect(collection?.id).toBe("misc");
    expect(isUnassignedCollection(collection)).toBe(true);
  });
});
