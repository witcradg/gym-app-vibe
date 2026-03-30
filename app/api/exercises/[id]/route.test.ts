import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH } from "./route";

const {
  mockDeleteExercise,
  mockFetchCollectionById,
  mockFetchExerciseById,
  mockUpdateExercise,
  mockUpsertExercise,
} = vi.hoisted(() => ({
  mockDeleteExercise: vi.fn(),
  mockFetchCollectionById: vi.fn(),
  mockFetchExerciseById: vi.fn(),
  mockUpdateExercise: vi.fn(),
  mockUpsertExercise: vi.fn(),
}));

vi.mock("@/lib/supabase/workout-content", () => ({
  deleteExercise: mockDeleteExercise,
  fetchCollectionById: mockFetchCollectionById,
  fetchExerciseById: mockFetchExerciseById,
  updateExercise: mockUpdateExercise,
  upsertExercise: mockUpsertExercise,
}));

describe("PATCH /api/exercises/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates an existing exercise without using upsert", async () => {
    mockFetchExerciseById.mockResolvedValueOnce({
      id: "bench-press",
      collectionId: "upper",
      name: "Bench Press",
      order: 1,
      sets: 3,
      reps: "5",
      weight: "185",
      notes: "Old note",
    });
    mockFetchCollectionById.mockResolvedValueOnce({
      id: "upper",
      name: "Upper Body",
      description: "",
      order: 1,
    });
    mockUpdateExercise.mockResolvedValueOnce({ ok: true, recordId: "bench-press" });

    const response = await PATCH(
      new Request("http://localhost/api/exercises/bench-press", {
        method: "PATCH",
        body: JSON.stringify({ notes: "New note" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ id: "bench-press" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, id: "bench-press" });
    expect(mockUpdateExercise).toHaveBeenCalledWith({
      id: "bench-press",
      collectionId: "upper",
      name: "Bench Press",
      order: 1,
      sets: 3,
      reps: "5",
      weight: "185",
      notes: "New note",
    });
    expect(mockUpsertExercise).not.toHaveBeenCalled();
  });

  it("rejects an invalid order update", async () => {
    mockFetchExerciseById.mockResolvedValueOnce({
      id: "bench-press",
      collectionId: "upper",
      name: "Bench Press",
      order: 1,
      sets: 3,
      reps: "5",
      weight: "185",
      notes: "Old note",
    });

    const response = await PATCH(
      new Request("http://localhost/api/exercises/bench-press", {
        method: "PATCH",
        body: JSON.stringify({ order: 0 }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ id: "bench-press" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Exercise order must be a positive integer.",
    });
    expect(mockFetchCollectionById).not.toHaveBeenCalled();
    expect(mockUpdateExercise).not.toHaveBeenCalled();
    expect(mockUpsertExercise).not.toHaveBeenCalled();
  });

  it("rejects an invalid sets update", async () => {
    mockFetchExerciseById.mockResolvedValueOnce({
      id: "bench-press",
      collectionId: "upper",
      name: "Bench Press",
      order: 1,
      sets: 3,
      reps: "5",
      weight: "185",
      notes: "Old note",
    });

    const response = await PATCH(
      new Request("http://localhost/api/exercises/bench-press", {
        method: "PATCH",
        body: JSON.stringify({ sets: "0" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ id: "bench-press" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Exercise sets must be a positive integer.",
    });
    expect(mockFetchCollectionById).not.toHaveBeenCalled();
    expect(mockUpdateExercise).not.toHaveBeenCalled();
    expect(mockUpsertExercise).not.toHaveBeenCalled();
  });
});
