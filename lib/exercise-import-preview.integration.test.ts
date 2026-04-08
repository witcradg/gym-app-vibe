import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Collection } from "@/types/collection";
import type { Exercise } from "@/types/exercise";

import { buildExerciseImportProcessCsv } from "./exercise-import-preview";
import {
  createAuthenticatedIntegrationTestClient,
  loadLocalEnvFile,
  resolveIntegrationTestUserId,
} from "./supabase/integration-test-helpers";

loadLocalEnvFile();

const SOURCE_COLLECTION_ID = "integration-test-import-preview-source";
const DRY_RUN_EXERCISE_ID = "integration-test-import-preview-dry-run";
const UPDATE_EXERCISE_ID = "integration-test-import-preview-update";
const SKIPPED_EXERCISE_ID = "integration-test-import-preview-skipped";

const sourceCollection: Collection = {
  id: SOURCE_COLLECTION_ID,
  name: "Integration Test Import Preview Source",
  description: "Temporary source collection for import preview integration tests",
  order: 9997,
};

const dryRunExercise: Exercise = {
  id: DRY_RUN_EXERCISE_ID,
  collectionId: SOURCE_COLLECTION_ID,
  name: "Integration Test Import Preview Dry Run Exercise",
  order: 1,
  sets: 2,
  reps: "8",
  weight: "20",
  notes: "Dry run should not move this record",
};

const updateExercise: Exercise = {
  id: UPDATE_EXERCISE_ID,
  collectionId: SOURCE_COLLECTION_ID,
  name: "Integration Test Import Preview Update Exercise",
  order: 2,
  sets: 2,
  reps: "10",
  weight: "25",
  notes: "Real update should move this record",
};

const skippedExercise: Exercise = {
  id: SKIPPED_EXERCISE_ID,
  collectionId: SOURCE_COLLECTION_ID,
  name: "Integration Test Import Preview Shared Exercise",
  order: 3,
  sets: 2,
  reps: "12",
  weight: "bodyweight",
  notes: "1&2 rows should skip this record",
};

let client: SupabaseClient | null = null;
let userId: string | null = null;
let originalSourceCollection: Collection | null = null;
let originalDryRunExercise: Exercise | null = null;
let originalUpdateExercise: Exercise | null = null;
let originalSkippedExercise: Exercise | null = null;

describe("exercise import preview integration", () => {
  beforeAll(async () => {
    client = await createAuthenticatedIntegrationTestClient();
    userId = await resolveIntegrationTestUserId(client);

    const {
      fetchCollectionByIdWithClient,
      fetchExerciseByIdWithClient,
      upsertCollectionWithClient,
      upsertExerciseWithClient,
    } = await import("./supabase/workout-content");

    originalSourceCollection = await fetchCollectionByIdWithClient(client, SOURCE_COLLECTION_ID);
    originalDryRunExercise = await fetchExerciseByIdWithClient(client, DRY_RUN_EXERCISE_ID);
    originalUpdateExercise = await fetchExerciseByIdWithClient(client, UPDATE_EXERCISE_ID);
    originalSkippedExercise = await fetchExerciseByIdWithClient(client, SKIPPED_EXERCISE_ID);

    expect((await upsertCollectionWithClient(client, sourceCollection, userId)).ok).toBe(true);
    expect((await upsertExerciseWithClient(client, dryRunExercise, userId)).ok).toBe(true);
    expect((await upsertExerciseWithClient(client, updateExercise, userId)).ok).toBe(true);
    expect((await upsertExerciseWithClient(client, skippedExercise, userId)).ok).toBe(true);
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
    } = await import("./supabase/workout-content");

    if (originalDryRunExercise) {
      expect((await upsertExerciseWithClient(client, originalDryRunExercise, userId)).ok).toBe(
        true,
      );
    } else {
      expect((await deleteExerciseWithClient(client, DRY_RUN_EXERCISE_ID)).ok).toBe(true);
    }

    if (originalUpdateExercise) {
      expect((await upsertExerciseWithClient(client, originalUpdateExercise, userId)).ok).toBe(
        true,
      );
    } else {
      expect((await deleteExerciseWithClient(client, UPDATE_EXERCISE_ID)).ok).toBe(true);
    }

    if (originalSkippedExercise) {
      expect((await upsertExerciseWithClient(client, originalSkippedExercise, userId)).ok).toBe(
        true,
      );
    } else {
      expect((await deleteExerciseWithClient(client, SKIPPED_EXERCISE_ID)).ok).toBe(true);
    }

    if (originalSourceCollection) {
      expect((await upsertCollectionWithClient(client, originalSourceCollection, userId)).ok).toBe(
        true,
      );
    } else {
      expect((await deleteCollectionWithClient(client, SOURCE_COLLECTION_ID)).ok).toBe(true);
    }
  });

  it("does not write during dry run and applies updates for real runs", async () => {
    const {
      fetchExerciseByIdWithClient,
      fetchExerciseImportPreviewMatchByNameWithClient,
      updateExerciseCollectionIdByIdWithClient,
    } = await import("./supabase/workout-content");

    const dryRunCsv = await buildExerciseImportProcessCsv(
      [
        `1| ${dryRunExercise.name} |`,
        `1&2| ${skippedExercise.name} |`,
      ].join("\n"),
      "dry-run",
      (name) => fetchExerciseImportPreviewMatchByNameWithClient(client!, name),
      async (exerciseId, collectionId) => {
        const result = await updateExerciseCollectionIdByIdWithClient(
          client!,
          exerciseId,
          collectionId,
        );

        if (!result.ok) {
          throw new Error(result.error);
        }
      },
    );

    expect(dryRunCsv).toContain(
      `1,${SOURCE_COLLECTION_ID},day-1,${dryRunExercise.name},${DRY_RUN_EXERCISE_ID},WOULD_UPDATE,`,
    );
    expect(dryRunCsv).toContain(
      `1&2,${SOURCE_COLLECTION_ID},,${skippedExercise.name},${SKIPPED_EXERCISE_ID},SKIPPED,TARGET_1_AND_2_SKIPPED`,
    );
    expect((await fetchExerciseByIdWithClient(client!, DRY_RUN_EXERCISE_ID))?.collectionId).toBe(
      SOURCE_COLLECTION_ID,
    );
    expect((await fetchExerciseByIdWithClient(client!, SKIPPED_EXERCISE_ID))?.collectionId).toBe(
      SOURCE_COLLECTION_ID,
    );

    const updatesCsv = await buildExerciseImportProcessCsv(
      [
        `?| ${updateExercise.name} |`,
        `1&2| ${skippedExercise.name} |`,
      ].join("\n"),
      "updates",
      (name) => fetchExerciseImportPreviewMatchByNameWithClient(client!, name),
      async (exerciseId, collectionId) => {
        const result = await updateExerciseCollectionIdByIdWithClient(
          client!,
          exerciseId,
          collectionId,
        );

        if (!result.ok) {
          throw new Error(result.error);
        }
      },
    );

    expect(updatesCsv).toContain(
      `?,${SOURCE_COLLECTION_ID},unassigned,${updateExercise.name},${UPDATE_EXERCISE_ID},UPDATED,`,
    );
    expect(updatesCsv).toContain(
      `1&2,${SOURCE_COLLECTION_ID},,${skippedExercise.name},${SKIPPED_EXERCISE_ID},SKIPPED,TARGET_1_AND_2_SKIPPED`,
    );
    expect((await fetchExerciseByIdWithClient(client!, UPDATE_EXERCISE_ID))?.collectionId).toBe(
      "unassigned",
    );
    expect((await fetchExerciseByIdWithClient(client!, SKIPPED_EXERCISE_ID))?.collectionId).toBe(
      SOURCE_COLLECTION_ID,
    );
  });
});
