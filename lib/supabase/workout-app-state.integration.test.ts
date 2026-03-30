import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PersistedAppState } from "../../data/exerciseState";
import {
  createAuthenticatedIntegrationTestClient,
  loadLocalEnvFile,
  resolveIntegrationTestUserId,
} from "./integration-test-helpers";

loadLocalEnvFile();

const temporaryState: PersistedAppState = {
  version: 1,
  setChecksByExercise: {
    "integration-exercise": [true, false],
  },
  activeCollectionId: "integration-collection",
  activeExerciseIndex: 0,
  activeView: "exercise-card",
};

let originalState: PersistedAppState | null = null;
let client: SupabaseClient | null = null;
let userId: string | null = null;

describe("supabase workout app state round trip", () => {
  beforeAll(async () => {
    client = await createAuthenticatedIntegrationTestClient();
    userId = await resolveIntegrationTestUserId(client);

    const { fetchWorkoutAppStateWithClient } = await import("./workout-app-state");
    originalState = await fetchWorkoutAppStateWithClient(client, userId);
  });

  afterAll(async () => {
    if (!client || !userId) {
      return;
    }

    const { deleteWorkoutAppStateWithClient, saveWorkoutAppStateWithClient } = await import(
      "./workout-app-state"
    );

    if (originalState) {
      const result = await saveWorkoutAppStateWithClient(client, userId, originalState);
      expect(result.ok).toBe(true);
      return;
    }

    const result = await deleteWorkoutAppStateWithClient(client, userId);
    expect(result.ok).toBe(true);
  });

  it("writes and reads the gym_app_state row", async () => {
    const { fetchWorkoutAppStateWithClient, saveWorkoutAppStateWithClient } = await import(
      "./workout-app-state"
    );

    const saveResult = await saveWorkoutAppStateWithClient(
      client!,
      userId!,
      temporaryState,
    );
    expect(saveResult.ok).toBe(true);

    const fetchedState = await fetchWorkoutAppStateWithClient(client!, userId!);

    expect(fetchedState).toEqual(temporaryState);
  });
});
