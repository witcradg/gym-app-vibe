import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Collection } from "../../types/collection";
import type { Exercise } from "../../types/exercise";
import { findUnassignedCollection } from "../collection-utils";

const loadLocalEnvFile = () => {
  const envPath = join(process.cwd(), ".env.local");
  const fileContents = readFileSync(envPath, "utf8");

  for (const rawLine of fileContents.split("\n")) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex < 1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const rawValue = line.slice(equalsIndex + 1).trim();
    const unquotedValue =
      rawValue.startsWith('"') && rawValue.endsWith('"')
        ? rawValue.slice(1, -1)
        : rawValue;

    if (!process.env[key]) {
      process.env[key] = unquotedValue;
    }
  }
};

loadLocalEnvFile();

const TEST_COLLECTION_ID = "integration-test-collection";
const TEST_EXERCISE_ID = "integration-test-exercise";

const baseCollection: Collection = {
  id: TEST_COLLECTION_ID,
  name: "Integration Test Collection",
  description: "Created by integration test",
  order: 9998,
};

const updatedCollection: Collection = {
  ...baseCollection,
  name: "Integration Test Collection Updated",
  description: "Updated by integration test",
  order: 9999,
};

const baseExercise: Exercise = {
  id: TEST_EXERCISE_ID,
  collectionId: TEST_COLLECTION_ID,
  name: "Integration Test Exercise",
  order: 1,
  sets: 2,
  reps: "8",
  weight: "20 lbs",
  notes: "Created by integration test",
};

const updatedExercise: Exercise = {
  ...baseExercise,
  name: "Integration Test Exercise Updated",
  order: 2,
  sets: 3,
  reps: "10",
  weight: "25 lbs",
  notes: "Updated by integration test",
};

let originalCollection: Collection | null = null;
let originalExercise: Exercise | null = null;
let unassignedCollection: Collection | null = null;

describe("supabase workout content crud", () => {
  beforeAll(async () => {
    const { fetchCollectionById, fetchCollections, fetchExerciseById } = await import(
      "./workout-content"
    );

    originalCollection = await fetchCollectionById(TEST_COLLECTION_ID);
    originalExercise = await fetchExerciseById(TEST_EXERCISE_ID);
    unassignedCollection = findUnassignedCollection(await fetchCollections());
  });

  afterAll(async () => {
    const {
      deleteCollection,
      deleteExercise,
      upsertCollection,
      upsertExercise,
    } = await import("./workout-content");

    if (originalCollection) {
      const result = await upsertCollection(originalCollection);
      expect(result.ok).toBe(true);
    }

    if (originalExercise) {
      const result = await upsertExercise(originalExercise);
      expect(result.ok).toBe(true);
    } else {
      const result = await deleteExercise(TEST_EXERCISE_ID);
      expect(result.ok).toBe(true);
    }

    if (!originalCollection) {
      const result = await deleteCollection(TEST_COLLECTION_ID);
      expect(result.ok).toBe(true);
    }
  });

  it("creates, updates, reads, and deletes collection and exercise records", async () => {
    const {
      deleteExercise,
      reassignExercisesToCollection,
      deleteCollection,
      fetchCollectionById,
      fetchExerciseById,
      upsertCollection,
      upsertExercise,
    } = await import("./workout-content");

    const initialExerciseDelete = await deleteExercise(TEST_EXERCISE_ID);
    expect(initialExerciseDelete.ok).toBe(true);

    const initialCollectionDelete = await deleteCollection(TEST_COLLECTION_ID);
    expect(initialCollectionDelete.ok).toBe(true);

    const createCollectionResult = await upsertCollection(baseCollection);
    expect(createCollectionResult.ok).toBe(true);

    const createdCollection = await fetchCollectionById(TEST_COLLECTION_ID);
    expect(createdCollection).toEqual(baseCollection);

    const updateCollectionResult = await upsertCollection(updatedCollection);
    expect(updateCollectionResult.ok).toBe(true);

    const fetchedUpdatedCollection = await fetchCollectionById(TEST_COLLECTION_ID);
    expect(fetchedUpdatedCollection).toEqual(updatedCollection);

    const createExerciseResult = await upsertExercise(baseExercise);
    expect(createExerciseResult.ok).toBe(true);

    const createdExercise = await fetchExerciseById(TEST_EXERCISE_ID);
    expect(createdExercise).toEqual(baseExercise);

    const updateExerciseResult = await upsertExercise(updatedExercise);
    expect(updateExerciseResult.ok).toBe(true);

    const fetchedUpdatedExercise = await fetchExerciseById(TEST_EXERCISE_ID);
    expect(fetchedUpdatedExercise).toEqual(updatedExercise);

    expect(unassignedCollection).not.toBeNull();

    const reassignmentResult = await reassignExercisesToCollection(
      TEST_COLLECTION_ID,
      unassignedCollection!.id,
    );
    expect(reassignmentResult.ok).toBe(true);

    const reassignedExercise = await fetchExerciseById(TEST_EXERCISE_ID);
    expect(reassignedExercise).toEqual({
      ...updatedExercise,
      collectionId: unassignedCollection!.id,
    });

    const deleteCollectionResult = await deleteCollection(TEST_COLLECTION_ID);
    expect(deleteCollectionResult.ok).toBe(true);
    expect(await fetchCollectionById(TEST_COLLECTION_ID)).toBeNull();

    const deleteExerciseResult = await deleteExercise(TEST_EXERCISE_ID);
    expect(deleteExerciseResult.ok).toBe(true);
    expect(await fetchExerciseById(TEST_EXERCISE_ID)).toBeNull();
  });
});
