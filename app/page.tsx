"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEventHandler,
} from "react";
import { collections } from "../data/collections";
import { exercises } from "../data/exercises";

const STORAGE_KEY = "gym-app-v1-state";
const EXERCISE_SEED_SIGNATURE = JSON.stringify(exercises);

type RuntimeExercise = {
  id: string;
  collectionId: string;
  name: string;
  order: number;
  sets: number;
  reps: number;
  weight: number;
  notes: string;
};

type PersistedExerciseState = {
  notes: string;
  sets: number;
  reps: number;
  weight: number;
};

type PersistedAppState = {
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

const toNonNegativeIntFromSeed = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const nextValue = Math.floor(value);
    return nextValue >= 0 ? nextValue : fallback;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return fallback;
};

const seedExercises: RuntimeExercise[] = exercises.map((exercise) => ({
  ...exercise,
  sets: toPositiveIntFromSeed(exercise.sets, 1),
  reps: toPositiveIntFromSeed(exercise.reps, 10),
  weight: toNonNegativeIntFromSeed(exercise.weight, 0),
  notes: typeof exercise.notes === "string" ? exercise.notes : "",
}));

const toPositiveInt = (value: unknown, fallback: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  const nextValue = Math.floor(value);
  return nextValue >= 1 ? nextValue : fallback;
};

const toNonNegativeInt = (value: unknown, fallback: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  const nextValue = Math.floor(value);
  return nextValue >= 0 ? nextValue : fallback;
};

const mergeExerciseState = (savedState: PersistedAppState | null) =>
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
      reps: toPositiveInt(savedExercise.reps, exercise.reps),
      weight: toNonNegativeInt(savedExercise.weight, exercise.weight),
    };
  });

const buildSetChecksState = (
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

const buildInitialSetChecks = () =>
  Object.fromEntries(
    seedExercises.map((exercise) => [
      exercise.id,
      Array.from({ length: exercise.sets }, () => false),
    ]),
  );

export default function Home() {
  const [exerciseState, setExerciseState] = useState(seedExercises);
  const [setChecksByExercise, setSetChecksByExercise] = useState(buildInitialSetChecks);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    null,
  );
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [isAdjustingPlan, setIsAdjustingPlan] = useState(false);
  const [showResetFeedback, setShowResetFeedback] = useState(false);
  const hasLoadedPersistenceRef = useRef(false);
  const resetFeedbackTimerRef = useRef<number | null>(null);
  const swipeStartRef = useRef<{
    x: number;
    y: number;
    isBlocked: boolean;
  } | null>(null);

  const selectedCollection = useMemo(
    () =>
      selectedCollectionId
        ? collections.find((collection) => collection.id === selectedCollectionId) ??
          null
        : null,
    [selectedCollectionId],
  );

  const orderedExercises = useMemo(() => {
    if (!selectedCollectionId) {
      return [];
    }

    return exerciseState
      .filter((exercise) => exercise.collectionId === selectedCollectionId)
      .sort((a, b) => a.order - b.order);
  }, [selectedCollectionId, exerciseState]);

  const handleOpenCollection = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setSelectedExerciseId(null);
    setIsAdjustingPlan(false);
    setShowResetFeedback(false);
  };

  const handleBack = () => {
    setSelectedCollectionId(null);
    setSelectedExerciseId(null);
    setIsAdjustingPlan(false);
    setShowResetFeedback(false);
  };

  useEffect(() => {
    setIsAdjustingPlan(false);
  }, [selectedExerciseId]);

  useEffect(() => {
    try {
      const savedRaw = window.localStorage.getItem(STORAGE_KEY);

      if (!savedRaw) {
        hasLoadedPersistenceRef.current = true;
        return;
      }

      const savedState = JSON.parse(savedRaw) as PersistedAppState;

      if (savedState.seedSignature !== EXERCISE_SEED_SIGNATURE) {
        window.localStorage.removeItem(STORAGE_KEY);
        hasLoadedPersistenceRef.current = true;
        return;
      }

      const mergedExercises = mergeExerciseState(savedState);
      const mergedSetChecks = buildSetChecksState(mergedExercises, savedState);

      setExerciseState(mergedExercises);
      setSetChecksByExercise(mergedSetChecks);
    } catch {
      // Ignore invalid saved data and continue with seed data.
    } finally {
      hasLoadedPersistenceRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedPersistenceRef.current) {
      return;
    }

    const persistenceState: PersistedAppState = {
      seedSignature: EXERCISE_SEED_SIGNATURE,
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
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistenceState));
  }, [exerciseState, setChecksByExercise]);

  useEffect(
    () => () => {
      if (resetFeedbackTimerRef.current) {
        window.clearTimeout(resetFeedbackTimerRef.current);
      }
    },
    [],
  );

  const handleChangeNote = (exerciseId: string, notes: string) => {
    setExerciseState((currentExercises) =>
      currentExercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, notes } : exercise,
      ),
    );
  };

  const handleToggleSet = (exerciseId: string, setIndex: number) => {
    setSetChecksByExercise((currentChecks) => {
      const nextSetChecks = [...(currentChecks[exerciseId] ?? [])];
      nextSetChecks[setIndex] = !nextSetChecks[setIndex];

      return {
        ...currentChecks,
        [exerciseId]: nextSetChecks,
      };
    });
  };

  const handlePlanChange = (
    exerciseId: string,
    field: "sets" | "reps" | "weight",
    value: string,
  ) => {
    const nextValue = Number.parseInt(value, 10);

    if (Number.isNaN(nextValue)) {
      return;
    }

    if ((field === "sets" || field === "reps") && nextValue < 1) {
      return;
    }

    if (field === "weight" && nextValue < 0) {
      return;
    }

    setExerciseState((currentExercises) =>
      currentExercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, [field]: nextValue } : exercise,
      ),
    );

    if (field === "sets") {
      setSetChecksByExercise((currentChecks) => {
        const currentSetChecks = currentChecks[exerciseId] ?? [];
        const resizedSetChecks =
          currentSetChecks.length >= nextValue
            ? currentSetChecks.slice(0, nextValue)
            : [
                ...currentSetChecks,
                ...Array.from({ length: nextValue - currentSetChecks.length }, () => false),
              ];

        return {
          ...currentChecks,
          [exerciseId]: resizedSetChecks,
        };
      });
    }
  };

  const isExerciseComplete = (exerciseId: string, expectedSetCount: number) => {
    const setChecks = setChecksByExercise[exerciseId] ?? [];

    return (
      setChecks.length === expectedSetCount &&
      setChecks.length > 0 &&
      setChecks.every(Boolean)
    );
  };

  const handleResetCollection = () => {
    if (!selectedCollectionId) {
      return;
    }

    setSetChecksByExercise((currentChecks) => {
      const nextChecks = { ...currentChecks };

      for (const exercise of orderedExercises) {
        nextChecks[exercise.id] = Array.from({ length: exercise.sets }, () => false);
      }

      return nextChecks;
    });

    setShowResetFeedback(true);

    if (resetFeedbackTimerRef.current) {
      window.clearTimeout(resetFeedbackTimerRef.current);
    }

    resetFeedbackTimerRef.current = window.setTimeout(() => {
      setShowResetFeedback(false);
      resetFeedbackTimerRef.current = null;
    }, 1800);
  };

  if (selectedCollection) {
    const selectedExerciseIndex = selectedExerciseId
      ? orderedExercises.findIndex((exercise) => exercise.id === selectedExerciseId)
      : -1;
    const selectedExercise =
      selectedExerciseIndex >= 0 ? orderedExercises[selectedExerciseIndex] : null;

    if (selectedExercise) {
      const moveToAdjacentExercise = (offset: -1 | 1) => {
        const nextIndex = selectedExerciseIndex + offset;

        if (nextIndex < 0 || nextIndex >= orderedExercises.length) {
          return;
        }

        setSelectedExerciseId(orderedExercises[nextIndex].id);
      };

      const handleTouchStart: TouchEventHandler<HTMLElement> = (event) => {
        const touch = event.touches[0];
        const target = event.target as HTMLElement;

        swipeStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          isBlocked: Boolean(target.closest("textarea, input, button")),
        };
      };

      const handleTouchEnd: TouchEventHandler<HTMLElement> = (event) => {
        const swipeStart = swipeStartRef.current;
        swipeStartRef.current = null;

        if (!swipeStart || swipeStart.isBlocked) {
          return;
        }

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - swipeStart.x;
        const deltaY = touch.clientY - swipeStart.y;
        const swipeThreshold = 56;

        if (
          Math.abs(deltaX) < swipeThreshold ||
          Math.abs(deltaX) < Math.abs(deltaY) * 1.2
        ) {
          return;
        }

        if (deltaX < 0) {
          moveToAdjacentExercise(1);
          return;
        }

        moveToAdjacentExercise(-1);
      };

      return (
        <main className="home">
          <section
            className="exercise-expanded"
            aria-label="Exercise execution"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              className="close-button"
              onClick={() => {
                setSelectedExerciseId(null);
                setIsAdjustingPlan(false);
              }}
            >
              Close
            </button>

            <div className="exercise-expanded__header">
              <h1 className="exercise-expanded__name">{selectedExercise.name}</h1>
              <div className="exercise-expanded__plan-row">
                <p className="exercise-expanded__plan">
                  {selectedExercise.sets} × {selectedExercise.reps} @{" "}
                  {selectedExercise.weight}
                </p>
                <button
                  type="button"
                  className="adjust-button"
                  onClick={() => setIsAdjustingPlan((currentValue) => !currentValue)}
                >
                  {isAdjustingPlan ? "Done" : "Adjust"}
                </button>
              </div>
            </div>

            {isAdjustingPlan ? (
              <div className="plan-adjust-row">
                <input
                  type="number"
                  className="plan-adjust-input"
                  min={1}
                  inputMode="numeric"
                  value={selectedExercise.sets}
                  onChange={(event) =>
                    handlePlanChange(selectedExercise.id, "sets", event.target.value)
                  }
                  aria-label="Sets"
                />
                <span className="plan-adjust-separator">×</span>
                <input
                  type="number"
                  className="plan-adjust-input"
                  min={1}
                  inputMode="numeric"
                  value={selectedExercise.reps}
                  onChange={(event) =>
                    handlePlanChange(selectedExercise.id, "reps", event.target.value)
                  }
                  aria-label="Reps"
                />
                <span className="plan-adjust-separator">@</span>
                <input
                  type="number"
                  className="plan-adjust-input"
                  min={0}
                  inputMode="numeric"
                  value={selectedExercise.weight}
                  onChange={(event) =>
                    handlePlanChange(selectedExercise.id, "weight", event.target.value)
                  }
                  aria-label="Weight"
                />
              </div>
            ) : null}

            <textarea
              className="exercise-expanded__notes-input"
              value={selectedExercise.notes}
              onChange={(event) =>
                handleChangeNote(selectedExercise.id, event.target.value)
              }
              rows={4}
              aria-label="Exercise notes"
            />

            <div className="set-placeholder-list" aria-label="Set list">
              {Array.from({ length: selectedExercise.sets }, (_, index) => (
                <label key={index} className="set-placeholder-item">
                  <input
                    type="checkbox"
                    className="set-checkbox"
                    checked={
                      setChecksByExercise[selectedExercise.id]?.[index] ?? false
                    }
                    onChange={() => handleToggleSet(selectedExercise.id, index)}
                  />
                  <span>Set {index + 1}</span>
                </label>
              ))}
            </div>
          </section>
        </main>
      );
    }

    return (
      <main className="home">
        <header className="home__header">
          <div className="collection-header-actions">
            <button type="button" className="back-button" onClick={handleBack}>
              Back
            </button>
            <button
              type="button"
              className="reset-button"
              onClick={handleResetCollection}
            >
              Reset Collection
            </button>
            <p
              className={`reset-feedback${showResetFeedback ? " is-visible" : ""}`}
              role="status"
              aria-live="polite"
            >
              Collection reset
            </p>
          </div>
          <h1>{selectedCollection.name}</h1>
        </header>

        <section className="exercise-list" aria-label={`${selectedCollection.name} exercises`}>
          {orderedExercises.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              className="exercise-card"
              onClick={() => setSelectedExerciseId(exercise.id)}
            >
              <span className="exercise-card__name-row">
                <span className="exercise-card__name">{exercise.name}</span>
                {isExerciseComplete(exercise.id, exercise.sets) ? (
                  <span className="exercise-card__complete" aria-label="Completed">
                    ✓
                  </span>
                ) : null}
              </span>
              <span className="exercise-card__plan">
                {exercise.sets} × {exercise.reps} @ {exercise.weight}
              </span>
            </button>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className="home">
      <header className="home__header">
        <h1>Gym App</h1>
        <p>Select a collection.</p>
      </header>

      <section className="collections" aria-label="Workout collections">
        {collections.map((collection) => (
          <button
            key={collection.id}
            type="button"
            className="collection-card"
            onClick={() => handleOpenCollection(collection.id)}
          >
            <span className="collection-card__name">{collection.name}</span>
            {collection.description ? (
              <span className="collection-card__description">
                {collection.description}
              </span>
            ) : null}
          </button>
        ))}
      </section>
    </main>
  );
}
