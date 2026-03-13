"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEventHandler,
} from "react";
import { persistGymWorkoutAppState } from "./actions/workout-app-state";
import type { Collection } from "../types/collection";
import type { Exercise } from "../types/exercise";
import {
  buildInitialSetChecks,
  buildPersistenceState,
  buildSetChecksState,
  createSeedExercises,
  deriveExerciseCompletionStatus,
  mergeExerciseState,
  restoreNavigationState,
} from "../data/exerciseState";
import type {
  NavigationView,
  PersistedAppState,
} from "../data/exerciseState";

const SWIPE_VERTICAL_MIN_PX = 55;
const SWIPE_HORIZONTAL_MIN_PX = 75;
const SWIPE_DIRECTION_RATIO = 1.5;

type SwipeDirection = "horizontal" | "vertical" | null;

const getSwipeDirection = (
  deltaX: number,
  deltaY: number,
): SwipeDirection => {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  const isHorizontal =
    absX >= SWIPE_HORIZONTAL_MIN_PX && absX > absY * SWIPE_DIRECTION_RATIO;
  if (isHorizontal) {
    return "horizontal";
  }

  const isVertical =
    absY >= SWIPE_VERTICAL_MIN_PX && absY > absX * SWIPE_DIRECTION_RATIO;
  if (isVertical) {
    return "vertical";
  }

  return null;
};

const completionUi = {
  "not-started": { symbol: "○", label: "Not started" },
  "in-progress": { symbol: "◐", label: "In progress" },
  complete: { symbol: "✓", label: "Complete" },
} as const;

type HomeClientProps = {
  collections: Collection[];
  exercises: Exercise[];
  initialPersistedAppState: PersistedAppState | null;
};

export default function HomeClient({
  collections,
  exercises,
  initialPersistedAppState,
}: HomeClientProps) {
  const exerciseSeedSignature = useMemo(() => JSON.stringify(exercises), [exercises]);
  const seedExercises = useMemo(() => createSeedExercises(exercises), [exercises]);
  const compatiblePersistedAppState = useMemo(
    () =>
      initialPersistedAppState?.seedSignature === exerciseSeedSignature
        ? initialPersistedAppState
        : null,
    [exerciseSeedSignature, initialPersistedAppState],
  );
  const initialExerciseState = useMemo(
    () => mergeExerciseState(seedExercises, compatiblePersistedAppState),
    [compatiblePersistedAppState, seedExercises],
  );
  const initialSetChecks = useMemo(
    () => buildSetChecksState(initialExerciseState, compatiblePersistedAppState),
    [compatiblePersistedAppState, initialExerciseState],
  );
  const initialNavigation = useMemo(
    () =>
      restoreNavigationState(
        compatiblePersistedAppState,
        collections.map((collection) => collection.id),
        initialExerciseState,
      ),
    [collections, compatiblePersistedAppState, initialExerciseState],
  );

  const [exerciseState, setExerciseState] = useState(initialExerciseState);
  const [setChecksByExercise, setSetChecksByExercise] = useState(() =>
    Object.keys(initialSetChecks).length > 0
      ? initialSetChecks
      : buildInitialSetChecks(seedExercises),
  );
  const [view, setView] = useState<NavigationView>(initialNavigation.view);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    initialNavigation.activeCollectionId,
  );
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(
    initialNavigation.activeExerciseIndex,
  );
  const [isAdjustingPlan, setIsAdjustingPlan] = useState(false);
  const [isJumpMenuOpen, setIsJumpMenuOpen] = useState(false);
  const [showResetFeedback, setShowResetFeedback] = useState(false);
  const hasMountedRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);
  const resetFeedbackTimerRef = useRef<number | null>(null);
  const cardSwipeStartRef = useRef<{
    x: number;
    y: number;
    isBlocked: boolean;
  } | null>(null);
  const listSwipeStartRef = useRef<{ x: number; y: number } | null>(null);

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

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      const persistenceState = buildPersistenceState(
        exerciseState,
        setChecksByExercise,
        exerciseSeedSignature,
        {
          activeCollectionId,
          activeExerciseIndex,
          activeView: view === "exercise-card" ? "exercise-card" : "exercise-list",
        },
      );

      void persistGymWorkoutAppState(persistenceState).then((result) => {
        if (!result.ok) {
          console.error("Failed to persist workout app state", result.error);
        }
      });
    }, 250);
  }, [
    activeCollectionId,
    activeExerciseIndex,
    exerciseState,
    exerciseSeedSignature,
    setChecksByExercise,
    view,
  ]);

  useEffect(
    () => () => {
      if (resetFeedbackTimerRef.current) {
        window.clearTimeout(resetFeedbackTimerRef.current);
      }

      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
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
    setActiveCollectionId(collectionId);
    setActiveExerciseIndex(0);
    setView("exercise-list");
    setIsAdjustingPlan(false);
    setIsJumpMenuOpen(false);
    setShowResetFeedback(false);
  };

  const navigateToCollections = () => {
    setView("collections");
    setActiveCollectionId(null);
    setActiveExerciseIndex(0);
    setIsAdjustingPlan(false);
    setIsJumpMenuOpen(false);
    setShowResetFeedback(false);
  };

  const openExerciseCardByIndex = (exerciseIndex: number) => {
    setActiveExerciseIndex(exerciseIndex);
    setView("exercise-card");
    setIsAdjustingPlan(false);
    setIsJumpMenuOpen(false);
  };

  const navigateToExerciseList = () => {
    setView("exercise-list");
    setIsAdjustingPlan(false);
    setIsJumpMenuOpen(false);
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

  const isExerciseComplete = (exerciseId: string, expectedSetCount: number) =>
    deriveExerciseCompletionStatus(
      setChecksByExercise[exerciseId],
      expectedSetCount,
    ) === "complete";

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

    setActiveExerciseIndex(nextIndex);
    setIsAdjustingPlan(false);
    setIsJumpMenuOpen(false);
  };

  const jumpToExerciseIndex = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= orderedExercises.length) {
      return;
    }

    setActiveExerciseIndex(nextIndex);
    setIsAdjustingPlan(false);
    setIsJumpMenuOpen(false);
  };

  const handleExerciseCardTouchStart: TouchEventHandler<HTMLElement> = (event) => {
    const touch = event.touches[0];
    const target = event.target as HTMLElement;

    cardSwipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      isBlocked: Boolean(
        target.closest("textarea, input, button, .exercise-jump-overlay"),
      ),
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
    const swipeDirection = getSwipeDirection(deltaX, deltaY);

    if (swipeDirection === "horizontal" && deltaX > 0) {
      navigateToExerciseList();
      return;
    }

    if (swipeDirection !== "vertical") {
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
    const swipeDirection = getSwipeDirection(deltaX, deltaY);

    if (swipeDirection === "horizontal" && deltaX > 0) {
      navigateToCollections();
    }
  };

  const activeExercise =
    view === "exercise-card" ? orderedExercises[activeExerciseIndex] ?? null : null;

  if (view === "exercise-card" && selectedCollection && activeExercise) {
    const currentExercisePosition = activeExerciseIndex + 1;
    const totalExercises = orderedExercises.length;
    const currentExerciseCompletion = deriveExerciseCompletionStatus(
      setChecksByExercise[activeExercise.id],
      activeExercise.sets,
    );
    const currentCompletionUi = completionUi[currentExerciseCompletion];

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

          <button
            type="button"
            className="exercise-progress-button"
            onClick={() => setIsJumpMenuOpen(true)}
            aria-label="Open exercise jump menu"
          >
            <span>{currentExercisePosition} / {totalExercises}</span>
            <span
              className={`exercise-progress-status exercise-progress-status--${currentExerciseCompletion}`}
              aria-label={currentCompletionUi.label}
            >
              {currentCompletionUi.symbol}
            </span>
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

          {isJumpMenuOpen ? (
            <div
              className="exercise-jump-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="Jump to exercise"
            >
              <div className="exercise-jump-sheet">
                <div className="exercise-jump-sheet__header">
                  <p className="exercise-jump-sheet__title">Jump to exercise</p>
                  <button
                    type="button"
                    className="exercise-jump-sheet__close"
                    onClick={() => setIsJumpMenuOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="exercise-jump-list">
                  {orderedExercises.map((exercise, index) => {
                    const completion = deriveExerciseCompletionStatus(
                      setChecksByExercise[exercise.id],
                      exercise.sets,
                    );
                    const completionForUi = completionUi[completion];

                    return (
                    <button
                      key={exercise.id}
                      type="button"
                      className={`exercise-jump-item${
                        index === activeExerciseIndex ? " is-active" : ""
                      }`}
                      onClick={() => jumpToExerciseIndex(index)}
                    >
                      <span className="exercise-jump-item__position">
                        {index + 1}.
                      </span>
                      <span className="exercise-jump-item__name">{exercise.name}</span>
                      <span
                        className={`exercise-jump-item__status exercise-jump-item__status--${completion}`}
                        aria-label={completionForUi.label}
                      >
                        {completionForUi.symbol}
                      </span>
                    </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
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
        <div className="home__title-row">
          <h1>Gym App</h1>
          <Link href="/admin/workouts" className="home__manage-link">
            Manage Content
          </Link>
        </div>
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
