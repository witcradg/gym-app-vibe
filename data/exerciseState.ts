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
};

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
});
