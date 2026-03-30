import { describe, expect, it } from "vitest";

import {
  createAuthenticatedIntegrationTestClient,
  loadLocalEnvFile,
} from "./integration-test-helpers";

loadLocalEnvFile();

describe("supabase workout content reads", () => {
  it("reads both tables and returns their counts", async () => {
    const { fetchWorkoutContentCountsWithClient } = await import("./workout-content");
    const counts = await fetchWorkoutContentCountsWithClient(
      await createAuthenticatedIntegrationTestClient(),
    );

    expect(counts.collectionsCount).toBeGreaterThanOrEqual(0);
    expect(counts.exercisesCount).toBeGreaterThanOrEqual(0);

    console.log("Supabase table counts", counts);
  });
});
