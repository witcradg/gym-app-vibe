import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Collection } from "../../types/collection";
import type { PersistedAppState } from "../../data/exerciseState";
import type { Exercise } from "../../types/exercise";
import HomeClient from "./home-client";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) =>
    createElement("a", { href, ...props }, children),
}));

vi.mock("../../app/actions/workout-app-state", () => ({
  persistGymWorkoutAppState: vi.fn(async () => ({ ok: true as const })),
}));

describe("HomeClient exercise list status symbols", () => {
  const collections: Collection[] = [
    {
      id: "c-1",
      name: "Upper",
      order: 1,
    },
  ];

  const exercises: Exercise[] = [
    {
      id: "e-1",
      collectionId: "c-1",
      name: "Bench Press",
      order: 1,
      sets: 3,
      reps: "8",
      weight: "100",
    },
  ];

  const renderExerciseList = (setChecks: boolean[]) => {
    const persistedAppState: PersistedAppState = {
      version: 1,
      setChecksByExercise: {
        "e-1": setChecks,
      },
      activeCollectionId: "c-1",
      activeExerciseIndex: 0,
      activeView: "exercise-list",
    };

    return renderToStaticMarkup(
      createElement(HomeClient, {
        collections,
        exercises,
        initialPersistedAppState: persistedAppState,
        authStatus: "authenticated",
      }),
    );
  };

  it("hides the status symbol on exercise cards when no sets are checked", () => {
    const markup = renderExerciseList([false, false, false]);

    expect(markup).not.toContain("exercise-card__status");
    expect(markup).not.toContain("◓");
    expect(markup).not.toContain("✓");
  });

  it("shows the in-progress symbol on exercise cards when some sets are checked", () => {
    const markup = renderExerciseList([true, false, false]);

    expect(markup).toContain('exercise-card__status exercise-card__status--in-progress');
    expect(markup).toContain("aria-label=\"In progress\"");
    expect(markup).toContain("◓");
    expect(markup).not.toContain("✓");
  });

  it("shows the complete symbol on exercise cards when all sets are checked", () => {
    const markup = renderExerciseList([true, true, true]);

    expect(markup).toContain('exercise-card__status exercise-card__status--complete');
    expect(markup).toContain("aria-label=\"Complete\"");
    expect(markup).toContain("✓");
    expect(markup).not.toContain("◓");
  });
});
