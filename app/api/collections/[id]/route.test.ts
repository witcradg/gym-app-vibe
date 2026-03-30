import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PATCH } from "./route";

const {
  mockDeleteCollection,
  mockFetchCollectionById,
  mockReassignExercisesToCollection,
  mockUpdateCollection,
  mockUpsertCollection,
} = vi.hoisted(() => ({
  mockDeleteCollection: vi.fn(),
  mockFetchCollectionById: vi.fn(),
  mockReassignExercisesToCollection: vi.fn(),
  mockUpdateCollection: vi.fn(),
  mockUpsertCollection: vi.fn(),
}));

vi.mock("@/lib/supabase/workout-content", () => ({
  deleteCollection: mockDeleteCollection,
  fetchCollectionById: mockFetchCollectionById,
  reassignExercisesToCollection: mockReassignExercisesToCollection,
  updateCollection: mockUpdateCollection,
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

describe("PATCH /api/collections/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates an existing collection without using upsert", async () => {
    mockFetchCollectionById.mockResolvedValueOnce({
      id: "upper",
      name: "Upper Body",
      description: "Old description",
      order: 1,
    });
    mockUpdateCollection.mockResolvedValueOnce({ ok: true, recordId: "upper" });

    const response = await PATCH(
      new Request("http://localhost/api/collections/upper", {
        method: "PATCH",
        body: JSON.stringify({ description: "New description" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ id: "upper" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, id: "upper" });
    expect(mockUpdateCollection).toHaveBeenCalledWith({
      id: "upper",
      name: "Upper Body",
      description: "New description",
      order: 1,
    });
    expect(mockUpsertCollection).not.toHaveBeenCalled();
  });

  it("rejects an invalid order update", async () => {
    mockFetchCollectionById.mockResolvedValueOnce({
      id: "upper",
      name: "Upper Body",
      description: "Old description",
      order: 1,
    });

    const response = await PATCH(
      new Request("http://localhost/api/collections/upper", {
        method: "PATCH",
        body: JSON.stringify({ order: 0 }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ id: "upper" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Collection order must be a positive integer.",
    });
    expect(mockUpdateCollection).not.toHaveBeenCalled();
    expect(mockUpsertCollection).not.toHaveBeenCalled();
  });
});
