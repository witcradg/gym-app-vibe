"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEventHandler,
} from "react";
import { collections } from "../data/collections";
import { exercises } from "../data/exercises";
import {
  buildInitialSetChecks,
  buildPersistenceState,
  buildSetChecksState,
  createSeedExercises,
  mergeExerciseState,
  restoreNavigationState,
} from "../data/exerciseState";
import type {
  NavigationView,
  PersistedAppState,
  RuntimeExercise,
} from "../data/exerciseState";

const STORAGE_KEY = "gym-app-v1-state";
const EXERCISE_SEED_SIGNATURE = JSON.stringify(exercises);
const seedExercises = createSeedExercises(exercises);

export default function Home() {
  const [exerciseState, setExerciseState] = useState(seedExercises);
  const [setChecksByExercise, setSetChecksByExercise] = useState(() =>
    buildInitialSetChecks(seedExercises),
  );
  const [view, setView] = useState<NavigationView>("collections");
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null,
  );
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [isAdjustingPlan, setIsAdjustingPlan] = useState(false);
  const [showResetFeedback, setShowResetFeedback] = useState(false);
  const hasLoadedPersistenceRef = useRef(false);
  const resetFeedbackTimerRef = useRef<number | null>(null);
  const cardSwipeStartRef = useRef<{
    x: number;
    y: number;
    isBlocked: boolean;
  } | null>(null);
  const listSwipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const latestStateRef = useRef<{
    exerciseState: RuntimeExercise[];
    setChecksByExercise: Record<string, boolean[]>;
    activeCollectionId: string | null;
    activeExerciseIndex: number;
    view: NavigationView;
  }>({
    exerciseState: seedExercises,
    setChecksByExercise: buildInitialSetChecks(seedExercises),
    activeCollectionId: null,
    activeExerciseIndex: 0,
    view: "collections",
  });

  const selectedCollection = useMemo(
    () =>
      activeCollectionId
        ? collections.find((collection) => collection.id === activeCollectionId) ??
          null
        : null,
    [activeCollectionId],
  );

  const orderedExercises = useMemo(() => {
    if (!activeCollectionId) {
      return [];
    }

    return exerciseState
      .filter((exercise) => exercise.collectionId === activeCollectionId)
      .sort((a, b) => a.order - b.order);
  }, [activeCollectionId, exerciseState]);

  const persistNow = useCallback(() => {
    if (!hasLoadedPersistenceRef.current) {
      return;
    }

    const latest = latestStateRef.current;
    const persistenceState = buildPersistenceState(
      latest.exerciseState,
      latest.setChecksByExercise,
      EXERCISE_SEED_SIGNATURE,
      {
        activeCollectionId: latest.activeCollectionId,
        activeExerciseIndex: latest.activeExerciseIndex,
        activeView: latest.view === "exercise-card" ? "exercise-card" : "exercise-list",
      },
    );

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistenceState));
  }, []);

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

      const mergedExercises = mergeExerciseState(seedExercises, savedState);
      const mergedSetChecks = buildSetChecksState(mergedExercises, savedState);
      const restoredNavigation = restoreNavigationState(
        savedState,
        collections.map((collection) => collection.id),
        mergedExercises,
      );

      setExerciseState(mergedExercises);
      setSetChecksByExercise(mergedSetChecks);
      setActiveCollectionId(restoredNavigation.activeCollectionId);
      setActiveExerciseIndex(restoredNavigation.activeExerciseIndex);
      setView(restoredNavigation.view);
    } catch {
      // Ignore invalid saved data and continue with seed data.
    } finally {
      hasLoadedPersistenceRef.current = true;
    }
  }, []);

  useEffect(() => {
    latestStateRef.current = {
      exerciseState,
      setChecksByExercise,
      activeCollectionId,
      activeExerciseIndex,
      view,
    };
  }, [exerciseState, setChecksByExercise, activeCollectionId, activeExerciseIndex, view]);

  useEffect(() => {
    persistNow();
  }, [
    activeCollectionId,
    activeExerciseIndex,
    exerciseState,
    persistNow,
    setChecksByExercise,
    view,
  ]);

  useEffect(
    () => () => {
      if (resetFeedbackTimerRef.current) {
        window.clearTimeout(resetFeedbackTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (view !== "exercise-card") {
      return;
    }

    if (orderedExercises.length < 1) {
      setView("exercise-list");
      setActiveExerciseIndex(0);
      return;
    }

    if (activeExerciseIndex >= orderedExercises.length) {
      setActiveExerciseIndex(orderedExercises.length - 1);
      return;
    }

    if (activeExerciseIndex < 0) {
      setActiveExerciseIndex(0);
    }
  }, [activeExerciseIndex, orderedExercises.length, view]);

  const openCollection = (collectionId: string) => {
    persistNow();
    setActiveCollectionId(collectionId);
    setActiveExerciseIndex(0);
    setView("exercise-list");
    setIsAdjustingPlan(false);
    setShowResetFeedback(false);
  };

  const navigateToCollections = () => {
    persistNow();
    setView("collections");
    setActiveCollectionId(null);
    setActiveExerciseIndex(0);
    setIsAdjustingPlan(false);
    setShowResetFeedback(false);
  };

  const openExerciseCardByIndex = (exerciseIndex: number) => {
    persistNow();
    setActiveExerciseIndex(exerciseIndex);
    setView("exercise-card");
    setIsAdjustingPlan(false);
  };

  const navigateToExerciseList = () => {
    persistNow();
    setView("exercise-list");
    setIsAdjustingPlan(false);
  };

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
    if (field !== "sets") {
      setExerciseState((currentExercises) =>
        currentExercises.map((exercise) =>
          exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise,
        ),
      );
      return;
    }

    const nextValue = Number.parseInt(value, 10);

    if (Number.isNaN(nextValue) || nextValue < 1) {
      return;
    }

    setExerciseState((currentExercises) =>
      currentExercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, [field]: nextValue } : exercise,
      ),
    );

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
    if (!activeCollectionId) {
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

  const moveToAdjacentExercise = (offset: -1 | 1) => {
    const nextIndex = activeExerciseIndex + offset;

    if (nextIndex < 0 || nextIndex >= orderedExercises.length) {
      return;
    }

    persistNow();
    setActiveExerciseIndex(nextIndex);
    setIsAdjustingPlan(false);
  };

  const handleExerciseCardTouchStart: TouchEventHandler<HTMLElement> = (event) => {
    const touch = event.touches[0];
    const target = event.target as HTMLElement;

    cardSwipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      isBlocked: Boolean(target.closest("textarea, input, button")),
    };
  };

  const handleExerciseCardTouchEnd: TouchEventHandler<HTMLElement> = (event) => {
    const swipeStart = cardSwipeStartRef.current;
    cardSwipeStartRef.current = null;

    if (!swipeStart || swipeStart.isBlocked) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;
    const swipeThreshold = 56;

    const horizontalSwipe =
      Math.abs(deltaX) >= swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
    const verticalSwipe =
      Math.abs(deltaY) >= swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX) * 1.2;

    if (horizontalSwipe && deltaX > 0) {
      navigateToExerciseList();
      return;
    }

    if (!verticalSwipe) {
      return;
    }

    if (deltaY < 0) {
      moveToAdjacentExercise(1);
      return;
    }

    moveToAdjacentExercise(-1);
  };

  const handleExerciseListTouchStart: TouchEventHandler<HTMLElement> = (event) => {
    const touch = event.touches[0];
    listSwipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleExerciseListTouchEnd: TouchEventHandler<HTMLElement> = (event) => {
    const swipeStart = listSwipeStartRef.current;
    listSwipeStartRef.current = null;

    if (!swipeStart) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;
    const swipeThreshold = 56;

    if (
      deltaX > swipeThreshold &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.2
    ) {
      navigateToCollections();
    }
  };

  const activeExercise =
    view === "exercise-card" ? orderedExercises[activeExerciseIndex] ?? null : null;

  if (view === "exercise-card" && selectedCollection && activeExercise) {
    return (
      <main className="home">
        <section
          className="exercise-expanded"
          aria-label="Exercise execution"
          onTouchStart={handleExerciseCardTouchStart}
          onTouchEnd={handleExerciseCardTouchEnd}
        >
          <button
            type="button"
            className="close-button"
            onClick={navigateToExerciseList}
          >
            Back to list
          </button>

          <div className="exercise-expanded__header">
            <h1 className="exercise-expanded__name">{activeExercise.name}</h1>
            <div className="exercise-expanded__plan-row">
              <p className="exercise-expanded__plan">
                {activeExercise.sets} × {activeExercise.reps} @ {activeExercise.weight}
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
                value={activeExercise.sets}
                onChange={(event) =>
                  handlePlanChange(activeExercise.id, "sets", event.target.value)
                }
                aria-label="Sets"
              />
              <span className="plan-adjust-separator">×</span>
              <input
                type="text"
                className="plan-adjust-input"
                inputMode="text"
                value={activeExercise.reps}
                onChange={(event) =>
                  handlePlanChange(activeExercise.id, "reps", event.target.value)
                }
                aria-label="Reps"
              />
              <span className="plan-adjust-separator">@</span>
              <input
                type="text"
                className="plan-adjust-input"
                inputMode="text"
                value={activeExercise.weight}
                onChange={(event) =>
                  handlePlanChange(activeExercise.id, "weight", event.target.value)
                }
                aria-label="Weight"
              />
            </div>
          ) : null}

          <textarea
            className="exercise-expanded__notes-input"
            value={activeExercise.notes}
            onChange={(event) => handleChangeNote(activeExercise.id, event.target.value)}
            rows={4}
            aria-label="Exercise notes"
          />

          <div className="set-placeholder-list" aria-label="Set list">
            {Array.from({ length: activeExercise.sets }, (_, index) => (
              <label key={index} className="set-placeholder-item">
                <input
                  type="checkbox"
                  className="set-checkbox"
                  checked={setChecksByExercise[activeExercise.id]?.[index] ?? false}
                  onChange={() => handleToggleSet(activeExercise.id, index)}
                />
                <span>Set {index + 1}</span>
              </label>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (view === "exercise-list" && selectedCollection) {
    return (
      <main className="home">
        <header className="home__header">
          <div className="collection-header-actions">
            <button
              type="button"
              className="back-button"
              onClick={navigateToCollections}
            >
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

        <section
          className="exercise-list"
          aria-label={`${selectedCollection.name} exercises`}
          onTouchStart={handleExerciseListTouchStart}
          onTouchEnd={handleExerciseListTouchEnd}
        >
          {orderedExercises.map((exercise, index) => (
            <button
              key={exercise.id}
              type="button"
              className="exercise-card"
              onClick={() => openExerciseCardByIndex(index)}
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
            onClick={() => openCollection(collection.id)}
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
