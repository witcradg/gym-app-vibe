import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const {
  mockCreateExercise,
  mockFetchCollectionById,
  mockFetchExercises,
} = vi.hoisted(() => ({
  mockCreateExercise: vi.fn(),
  mockFetchCollectionById: vi.fn(),
  mockFetchExercises: vi.fn(),
}));

vi.mock("@/lib/supabase/workout-content", () => ({
  createExercise: mockCreateExercise,
  fetchCollectionById: mockFetchCollectionById,
  fetchExercises: mockFetchExercises,
}));

describe("POST /api/exercises", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new exercise in an existing collection", async () => {
    mockFetchCollectionById.mockResolvedValueOnce({
      id: "upper",
      name: "Upper Body",
      description: "",
      order: 1,
    });
    mockCreateExercise.mockResolvedValueOnce({ ok: true, recordId: "bench-press" });

    const response = await POST(
      new Request("http://localhost/api/exercises", {
        method: "POST",
        body: JSON.stringify({
          id: "bench-press",
          collectionId: "upper",
          name: "Bench Press",
          order: 1,
          sets: 3,
          reps: "5",
          weight: "185",
          notes: "Pause on chest",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true, id: "bench-press" });
    expect(mockCreateExercise).toHaveBeenCalledWith({
      id: "bench-press",
      collectionId: "upper",
      name: "Bench Press",
      order: 1,
      sets: 3,
      reps: "5",
      weight: "185",
      notes: "Pause on chest",
    });
  });
});
