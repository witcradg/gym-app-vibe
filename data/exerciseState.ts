import type { Exercise } from "../types/exercise";

export type RuntimeExercise = Omit<Exercise, "reps" | "weight" | "notes"> & {
  reps: string;
  weight: string;
  notes: string;
};

export type PersistedAppState = {
  version?: 1;
  status?: "in_progress" | "completed";
  updatedAt?: string;
  setChecksByExercise: Record<string, boolean[]>;
  activeCollectionId?: string | null;
  activeExerciseIndex?: number;
  activeView?: "exercise-list" | "exercise-card";
};

export type NavigationView = "collections" | "exercise-list" | "exercise-card";

export type NavigationState = {
  view: NavigationView;
  activeCollectionId: string | null;
  activeExerciseIndex: number;
};

export type ExerciseCompletionStatus =
  | "not-started"
  | "in-progress"
  | "complete";

const toPositiveIntFromSeed = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const nextValue = Math.floor(value);
    return nextValue >= 1 ? nextValue : fallback;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      return parsed;
    }
  }

  return fallback;
};

const toStringFromValue = (value: unknown, fallback: string) => {
  if (typeof value === "string") {
    return value;
  }

  // Backward compatibility for older numeric saved data.
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
};

export const createSeedExercises = (seedExercises: Exercise[]): RuntimeExercise[] =>
  seedExercises.map((exercise) => ({
    ...exercise,
    sets: toPositiveIntFromSeed(exercise.sets, 1),
    reps: toStringFromValue(exercise.reps, ""),
    weight: toStringFromValue(exercise.weight, ""),
    notes: toStringFromValue(exercise.notes, ""),
  }));

export const buildSetChecksState = (
  currentExercises: RuntimeExercise[],
  savedState: PersistedAppState | null,
) =>
  Object.fromEntries(
    currentExercises.map((exercise) => {
      const savedSetChecks = savedState?.setChecksByExercise[exercise.id];
      const normalizedSetChecks = Array.from({ length: exercise.sets }, (_, index) =>
        Boolean(savedSetChecks?.[index]),
      );

      return [exercise.id, normalizedSetChecks];
    }),
  );

export const buildInitialSetChecks = (seedExercises: RuntimeExercise[]) =>
  Object.fromEntries(
    seedExercises.map((exercise) => [
      exercise.id,
      Array.from({ length: exercise.sets }, () => false),
    ]),
  );

export const buildPersistenceState = (
  setChecksByExercise: Record<string, boolean[]>,
  navigation: {
    activeCollectionId: string | null;
    activeExerciseIndex: number;
    activeView: "exercise-list" | "exercise-card";
  },
): PersistedAppState => ({
  version: 1,
  setChecksByExercise,
  activeCollectionId: navigation.activeCollectionId,
  activeExerciseIndex: navigation.activeExerciseIndex,
  activeView: navigation.activeView,
});

export const hasCheckedSets = (
  setChecksByExercise: Record<string, boolean[]>,
) =>
  Object.values(setChecksByExercise).some((setChecks) => setChecks.some(Boolean));

export const hasResumableWorkoutState = (
  state: PersistedAppState | null | undefined,
) =>
  Boolean(
    state &&
      (state.activeCollectionId ||
        hasCheckedSets(state.setChecksByExercise ?? {})),
  );

export const normalizePersistedAppState = (
  savedState: PersistedAppState | null,
  currentExercises: RuntimeExercise[],
  collectionIds: string[],
): PersistedAppState | null => {
  if (!savedState) {
    return null;
  }

  const setChecksByExercise = buildSetChecksState(currentExercises, savedState);
  const navigation = restoreNavigationState(savedState, collectionIds, currentExercises);

  return {
    version: savedState.version === 1 ? 1 : undefined,
    status: savedState.status,
    updatedAt: savedState.updatedAt,
    setChecksByExercise,
    activeCollectionId: navigation.activeCollectionId,
    activeExerciseIndex: navigation.activeExerciseIndex,
    activeView:
      navigation.view === "collections" ? undefined : navigation.view,
  };
};

const findResumeTarget = (
  savedState: PersistedAppState | null,
  collectionIds: string[],
  exercises: RuntimeExercise[],
) => {
  const availableCollectionIds = new Set(collectionIds);

  for (const exercise of exercises) {
    if (!availableCollectionIds.has(exercise.collectionId)) {
      continue;
    }

    const hasProgress = savedState?.setChecksByExercise?.[exercise.id]?.some(Boolean);
    if (!hasProgress) {
      continue;
    }

    const activeExerciseIndex = exercises
      .filter((item) => item.collectionId === exercise.collectionId)
      .findIndex((item) => item.id === exercise.id);

    return {
      activeCollectionId: exercise.collectionId,
      activeExerciseIndex: Math.max(activeExerciseIndex, 0),
    };
  }

  return null;
};

export const restoreNavigationState = (
  savedState: PersistedAppState | null,
  collectionIds: string[],
  exercises: RuntimeExercise[],
): NavigationState => {
  const collectionId = savedState?.activeCollectionId;

  if (!collectionId || !collectionIds.includes(collectionId)) {
    const resumeTarget = findResumeTarget(savedState, collectionIds, exercises);

    if (resumeTarget) {
      return {
        view: "exercise-list",
        activeCollectionId: resumeTarget.activeCollectionId,
        activeExerciseIndex: resumeTarget.activeExerciseIndex,
      };
    }

    return {
      view: "collections",
      activeCollectionId: null,
      activeExerciseIndex: 0,
    };
  }

  const collectionExerciseCount = exercises.filter(
    (exercise) => exercise.collectionId === collectionId,
  ).length;

  if (collectionExerciseCount < 1) {
    return {
      view: "exercise-list",
      activeCollectionId: collectionId,
      activeExerciseIndex: 0,
    };
  }

  const rawIndex = savedState?.activeExerciseIndex;
  const normalizedIndex =
    typeof rawIndex === "number" && Number.isFinite(rawIndex)
      ? Math.max(0, Math.floor(rawIndex))
      : 0;
  const clampedIndex = Math.min(normalizedIndex, collectionExerciseCount - 1);
  const savedView = savedState?.activeView;

  return {
    view: savedView === "exercise-card" ? "exercise-card" : "exercise-list",
    activeCollectionId: collectionId,
    activeExerciseIndex: clampedIndex,
  };
};

export const deriveExerciseCompletionStatus = (
  setChecks: boolean[] | undefined,
  expectedSetCount: number,
): ExerciseCompletionStatus => {
  if (expectedSetCount < 1) {
    return "not-started";
  }

  const checkedSetCount = Array.from({ length: expectedSetCount }, (_, index) =>
    Boolean(setChecks?.[index]),
  ).filter(Boolean).length;

  if (checkedSetCount === expectedSetCount) {
    return "complete";
  }

  if (checkedSetCount > 0) {
    return "in-progress";
  }

  return "not-started";
};
