import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE } from "./route";

const { mockDeleteWorkoutAppState } = vi.hoisted(() => ({
  mockDeleteWorkoutAppState: vi.fn(),
}));

vi.mock("@/lib/supabase/workout-app-state", () => ({
  deleteWorkoutAppState: mockDeleteWorkoutAppState,
  fetchWorkoutAppState: vi.fn(),
  saveWorkoutAppState: vi.fn(),
}));

describe("DELETE /api/workout-app-state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the persisted workout app state", async () => {
    mockDeleteWorkoutAppState.mockResolvedValueOnce({ ok: true });

    const response = await DELETE();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockDeleteWorkoutAppState).toHaveBeenCalledOnce();
  });
});
