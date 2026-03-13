import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PersistedAppState } from "../../data/exerciseState";

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

const temporaryState: PersistedAppState = {
  seedSignature: "integration-test-signature",
  exercisesById: {
    "integration-exercise": {
      notes: "integration note",
      sets: 2,
      reps: "10",
      weight: "25 lbs",
    },
  },
  setChecksByExercise: {
    "integration-exercise": [true, false],
  },
  activeCollectionId: "integration-collection",
  activeExerciseIndex: 0,
  activeView: "exercise-card",
};

let originalState: PersistedAppState | null = null;

describe("supabase workout app state round trip", () => {
  beforeAll(async () => {
    const { fetchWorkoutAppState } = await import("./workout-app-state");
    originalState = await fetchWorkoutAppState();
  });

  afterAll(async () => {
    const { deleteWorkoutAppState, saveWorkoutAppState } = await import(
      "./workout-app-state"
    );

    if (originalState) {
      const result = await saveWorkoutAppState(originalState);
      expect(result.ok).toBe(true);
      return;
    }

    const result = await deleteWorkoutAppState();
    expect(result.ok).toBe(true);
  });

  it("writes and reads the gym_app_state row", async () => {
    const { fetchWorkoutAppState, saveWorkoutAppState } = await import(
      "./workout-app-state"
    );

    const saveResult = await saveWorkoutAppState(temporaryState);
    expect(saveResult.ok).toBe(true);

    const fetchedState = await fetchWorkoutAppState();

    expect(fetchedState).toEqual(temporaryState);
  });
});
