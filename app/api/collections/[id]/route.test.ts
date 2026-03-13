import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE } from "./route";

const {
  mockDeleteCollection,
  mockFetchCollectionById,
  mockReassignExercisesToCollection,
  mockUpsertCollection,
} = vi.hoisted(() => ({
  mockDeleteCollection: vi.fn(),
  mockFetchCollectionById: vi.fn(),
  mockReassignExercisesToCollection: vi.fn(),
  mockUpsertCollection: vi.fn(),
}));

vi.mock("@/lib/supabase/workout-content", () => ({
  deleteCollection: mockDeleteCollection,
  fetchCollectionById: mockFetchCollectionById,
  reassignExercisesToCollection: mockReassignExercisesToCollection,
  upsertCollection: mockUpsertCollection,
}));

vi.mock("@/lib/collection-utils", () => ({
  isUnassignedCollection: (collection: { name: string } | null | undefined) =>
    collection?.name === "Unassigned",
}));

describe("DELETE /api/collections/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks deletion of the Unassigned collection", async () => {
    mockFetchCollectionById.mockResolvedValueOnce({
      id: "system-unassigned",
      name: "Unassigned",
      description: "",
      order: 99,
    });

    const response = await DELETE(
      new Request("http://localhost/api/collections/system-unassigned", {
        method: "DELETE",
        body: JSON.stringify({ destinationCollectionId: "legs" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ id: "system-unassigned" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "The Unassigned collection cannot be deleted.",
    });
    expect(mockReassignExercisesToCollection).not.toHaveBeenCalled();
    expect(mockDeleteCollection).not.toHaveBeenCalled();
  });

  it("reassigns exercises before deleting the collection", async () => {
    mockFetchCollectionById
      .mockResolvedValueOnce({
        id: "upper",
        name: "Upper Body",
        description: "",
        order: 1,
      })
      .mockResolvedValueOnce({
        id: "unassigned",
        name: "Unassigned",
        description: "",
        order: 99,
      });
    mockReassignExercisesToCollection.mockResolvedValue({ ok: true });
    mockDeleteCollection.mockResolvedValue({ ok: true });

    const response = await DELETE(
      new Request("http://localhost/api/collections/upper", {
        method: "DELETE",
        body: JSON.stringify({ destinationCollectionId: "unassigned" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ id: "upper" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockReassignExercisesToCollection).toHaveBeenCalledWith(
      "upper",
      "unassigned",
    );
    expect(mockDeleteCollection).toHaveBeenCalledWith("upper");
  });
});
