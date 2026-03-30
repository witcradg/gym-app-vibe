import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Collection } from "../../types/collection";
import type { Exercise } from "../../types/exercise";
import { findUnassignedCollection } from "../collection-utils";
import {
  createAuthenticatedIntegrationTestClient,
  loadLocalEnvFile,
  resolveIntegrationTestUserId,
} from "./integration-test-helpers";

loadLocalEnvFile();

const TEST_COLLECTION_ID = "integration-test-collection";
const TEST_DESTINATION_COLLECTION_ID = "integration-test-destination-collection";
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

const destinationCollection: Collection = {
  id: TEST_DESTINATION_COLLECTION_ID,
  name: "Integration Test Destination Collection",
  description: "Target for exercise move integration test",
  order: 10000,
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
let originalDestinationCollection: Collection | null = null;
let originalExercise: Exercise | null = null;
let unassignedCollection: Collection | null = null;
let client: SupabaseClient | null = null;
let userId: string | null = null;

describe("supabase workout content crud", () => {
  beforeAll(async () => {
    client = await createAuthenticatedIntegrationTestClient();
    userId = await resolveIntegrationTestUserId(client);

    const {
      fetchCollectionByIdWithClient,
      fetchCollectionsWithClient,
      fetchExerciseByIdWithClient,
    } = await import("./workout-content");

    originalCollection = await fetchCollectionByIdWithClient(client, TEST_COLLECTION_ID);
    originalDestinationCollection = await fetchCollectionByIdWithClient(
      client,
      TEST_DESTINATION_COLLECTION_ID,
    );
    originalExercise = await fetchExerciseByIdWithClient(client, TEST_EXERCISE_ID);
    unassignedCollection = findUnassignedCollection(
      await fetchCollectionsWithClient(client),
    );
  });

  afterAll(async () => {
    if (!client || !userId) {
      return;
    }

    const {
      deleteCollectionWithClient,
      deleteExerciseWithClient,
      upsertCollectionWithClient,
      upsertExerciseWithClient,
    } = await import("./workout-content");

    if (originalCollection) {
      const result = await upsertCollectionWithClient(client, originalCollection, userId);
      expect(result.ok).toBe(true);
    }

    if (originalDestinationCollection) {
      const result = await upsertCollectionWithClient(
        client,
        originalDestinationCollection,
        userId,
      );
      expect(result.ok).toBe(true);
    }

    if (originalExercise) {
      const result = await upsertExerciseWithClient(client, originalExercise, userId);
      expect(result.ok).toBe(true);
    } else {
      const result = await deleteExerciseWithClient(client, TEST_EXERCISE_ID);
      expect(result.ok).toBe(true);
    }

    if (!originalCollection) {
      const result = await deleteCollectionWithClient(client, TEST_COLLECTION_ID);
      expect(result.ok).toBe(true);
    }

    if (!originalDestinationCollection) {
      const result = await deleteCollectionWithClient(
        client,
        TEST_DESTINATION_COLLECTION_ID,
      );
      expect(result.ok).toBe(true);
    }
  });

  it("creates, updates, reads, and deletes collection and exercise records", async () => {
    const {
      deleteExerciseWithClient,
      reassignExercisesToCollectionWithClient,
      deleteCollectionWithClient,
      fetchCollectionByIdWithClient,
      fetchExerciseByIdWithClient,
      upsertCollectionWithClient,
      upsertExerciseWithClient,
    } = await import("./workout-content");

    const initialExerciseDelete = await deleteExerciseWithClient(client!, TEST_EXERCISE_ID);
    expect(initialExerciseDelete.ok).toBe(true);

    const initialCollectionDelete = await deleteCollectionWithClient(
      client!,
      TEST_COLLECTION_ID,
    );
    expect(initialCollectionDelete.ok).toBe(true);

    const initialDestinationCollectionDelete = await deleteCollectionWithClient(
      client!,
      TEST_DESTINATION_COLLECTION_ID,
    );
    expect(initialDestinationCollectionDelete.ok).toBe(true);

    const createCollectionResult = await upsertCollectionWithClient(
      client!,
      baseCollection,
      userId!,
    );
    expect(createCollectionResult.ok).toBe(true);

    const createdCollection = await fetchCollectionByIdWithClient(client!, TEST_COLLECTION_ID);
    expect(createdCollection).toEqual(baseCollection);

    const updateCollectionResult = await upsertCollectionWithClient(
      client!,
      updatedCollection,
      userId!,
    );
    expect(updateCollectionResult.ok).toBe(true);

    const fetchedUpdatedCollection = await fetchCollectionByIdWithClient(
      client!,
      TEST_COLLECTION_ID,
    );
    expect(fetchedUpdatedCollection).toEqual(updatedCollection);

    const createDestinationCollectionResult = await upsertCollectionWithClient(
      client!,
      destinationCollection,
      userId!,
    );
    expect(createDestinationCollectionResult.ok).toBe(true);

    const createExerciseResult = await upsertExerciseWithClient(
      client!,
      baseExercise,
      userId!,
    );
    expect(createExerciseResult.ok).toBe(true);

    const createdExercise = await fetchExerciseByIdWithClient(client!, TEST_EXERCISE_ID);
    expect(createdExercise).toEqual(baseExercise);

    const updateExerciseResult = await upsertExerciseWithClient(
      client!,
      updatedExercise,
      userId!,
    );
    expect(updateExerciseResult.ok).toBe(true);

    const fetchedUpdatedExercise = await fetchExerciseByIdWithClient(
      client!,
      TEST_EXERCISE_ID,
    );
    expect(fetchedUpdatedExercise).toEqual(updatedExercise);

    const movedExercise: Exercise = {
      ...updatedExercise,
      collectionId: TEST_DESTINATION_COLLECTION_ID,
      order: 1,
    };

    const moveExerciseResult = await upsertExerciseWithClient(
      client!,
      movedExercise,
      userId!,
    );
    expect(moveExerciseResult.ok).toBe(true);

    const fetchedMovedExercise = await fetchExerciseByIdWithClient(client!, TEST_EXERCISE_ID);
    expect(fetchedMovedExercise).toEqual(movedExercise);

    expect(unassignedCollection).not.toBeNull();

    const reassignmentResult = await reassignExercisesToCollectionWithClient(
      client!,
      TEST_DESTINATION_COLLECTION_ID,
      unassignedCollection!.id,
    );
    expect(reassignmentResult.ok).toBe(true);

    const reassignedExercise = await fetchExerciseByIdWithClient(client!, TEST_EXERCISE_ID);
    expect(reassignedExercise).toEqual({
      ...movedExercise,
      collectionId: unassignedCollection!.id,
    });

    const deleteCollectionResult = await deleteCollectionWithClient(
      client!,
      TEST_COLLECTION_ID,
    );
    expect(deleteCollectionResult.ok).toBe(true);
    expect(await fetchCollectionByIdWithClient(client!, TEST_COLLECTION_ID)).toBeNull();

    const deleteDestinationCollectionResult = await deleteCollectionWithClient(
      client!,
      TEST_DESTINATION_COLLECTION_ID,
    );
    expect(deleteDestinationCollectionResult.ok).toBe(true);
    expect(
      await fetchCollectionByIdWithClient(client!, TEST_DESTINATION_COLLECTION_ID),
    ).toBeNull();

    const deleteExerciseResult = await deleteExerciseWithClient(client!, TEST_EXERCISE_ID);
    expect(deleteExerciseResult.ok).toBe(true);
    expect(await fetchExerciseByIdWithClient(client!, TEST_EXERCISE_ID)).toBeNull();
  });
});
