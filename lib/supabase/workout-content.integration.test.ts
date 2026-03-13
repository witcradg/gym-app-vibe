import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

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

describe("supabase workout content reads", () => {
  it("reads both tables and returns their counts", async () => {
    const { fetchWorkoutContentCounts } = await import("./workout-content");
    const counts = await fetchWorkoutContentCounts();

    expect(counts.collectionsCount).toBeGreaterThanOrEqual(0);
    expect(counts.exercisesCount).toBeGreaterThanOrEqual(0);

    console.log("Supabase table counts", counts);
  });
});
