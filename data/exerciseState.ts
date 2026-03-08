import type { Exercise } from "./exercises";

export type RuntimeExercise = Omit<Exercise, "reps" | "weight" | "notes"> & {
  reps: string;
  weight: string;
  notes: string;
};

export type PersistedExerciseState = {
  notes: string;
  sets: number;
  reps: string;
  weight: string;
};

export type PersistedAppState = {
  seedSignature?: string;
  exercisesById: Record<string, PersistedExerciseState>;
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

const toPositiveInt = (value: unknown, fallback: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  const nextValue = Math.floor(value);
  return nextValue >= 1 ? nextValue : fallback;
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

export const mergeExerciseState = (
  seedExercises: RuntimeExercise[],
  savedState: PersistedAppState | null,
): RuntimeExercise[] =>
  seedExercises.map((exercise) => {
    const savedExercise = savedState?.exercisesById[exercise.id];

    if (!savedExercise) {
      return exercise;
    }

    return {
      ...exercise,
      notes:
        typeof savedExercise.notes === "string"
          ? savedExercise.notes
          : exercise.notes,
      sets: toPositiveInt(savedExercise.sets, exercise.sets),
      reps: toStringFromValue(savedExercise.reps, exercise.reps),
      weight: toStringFromValue(savedExercise.weight, exercise.weight),
    };
  });

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
  exerciseState: RuntimeExercise[],
  setChecksByExercise: Record<string, boolean[]>,
  seedSignature: string,
  navigation: {
    activeCollectionId: string | null;
    activeExerciseIndex: number;
    activeView: "exercise-list" | "exercise-card";
  },
): PersistedAppState => ({
  seedSignature,
  exercisesById: Object.fromEntries(
    exerciseState.map((exercise) => [
      exercise.id,
      {
        notes: exercise.notes,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
      },
    ]),
  ),
  setChecksByExercise,
  activeCollectionId: navigation.activeCollectionId,
  activeExerciseIndex: navigation.activeExerciseIndex,
  activeView: navigation.activeView,
});

export const restoreNavigationState = (
  savedState: PersistedAppState | null,
  collectionIds: string[],
  exercises: RuntimeExercise[],
): NavigationState => {
  const collectionId = savedState?.activeCollectionId;

  if (!collectionId || !collectionIds.includes(collectionId)) {
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
