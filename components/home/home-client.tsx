"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEventHandler,
} from "react";
import { sortCollectionsForDisplay } from "../../lib/collection-utils";
import {
  buildExerciseEditPatch,
  hasExerciseEditPatch,
} from "../../lib/exercise-edit-patch";
import type { Collection } from "../../types/collection";
import type { Exercise } from "../../types/exercise";
import {
  buildInitialSetChecks,
  buildPersistenceState,
  createSeedExercises,
  deriveExerciseCompletionStatus,
  hasCheckedSets,
  normalizePersistedAppState,
  restoreNavigationState,
} from "../../data/exerciseState";
import type {
  NavigationView,
  PersistedAppState,
} from "../../data/exerciseState";

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
  "in-progress": { symbol: "◓", label: "In progress" },
  complete: { symbol: "✓", label: "Complete" },
} as const;

const gymAppDebugEnabled = process.env.NEXT_PUBLIC_GYM_APP_DEBUG_STATE === "1";

const countCheckedSets = (setChecksByExercise: Record<string, boolean[]>) =>
  Object.values(setChecksByExercise).reduce(
    (total, setChecks) => total + setChecks.filter(Boolean).length,
    0,
  );

type ExerciseSaveState = {
  exerciseId: string;
  kind: "error" | "success";
  message: string;
} | null;

type HomeClientProps = {
  collections: Collection[];
  exercises: Exercise[];
  initialPersistedAppState: PersistedAppState | null;
  authStatus: "authenticated" | "anonymous";
};

type DebugStateSource = "default" | "local" | "server";

type DebugSaveStatus = {
  at: string;
  checkedCount: number;
  keepalive: boolean;
  source: string;
  status: "attempt" | "success" | "error";
  error?: string;
};

export default function HomeClient({
  collections,
  exercises,
  initialPersistedAppState,
  authStatus,
}: HomeClientProps) {
  const pathname = usePathname();
  const orderedCollections = useMemo(
    () => sortCollectionsForDisplay(collections),
    [collections],
  );
  const seedExercises = useMemo(() => createSeedExercises(exercises), [exercises]);
  const collectionIds = useMemo(
    () => orderedCollections.map((collection) => collection.id),
    [orderedCollections],
  );
  const initialPersistedSessionState = useMemo(
    () => normalizePersistedAppState(initialPersistedAppState, seedExercises, collectionIds),
    [collectionIds, initialPersistedAppState, seedExercises],
  );
  const initialNavigation = useMemo(
    () =>
      restoreNavigationState(
        initialPersistedSessionState,
        collectionIds,
        seedExercises,
      ),
    [collectionIds, initialPersistedSessionState, seedExercises],
  );

  const [exerciseState, setExerciseState] = useState(seedExercises);
  const [setChecksByExercise, setSetChecksByExercise] = useState(
    () =>
      initialPersistedSessionState?.setChecksByExercise ?? buildInitialSetChecks(seedExercises),
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
  const hasAttemptedRehydrateRef = useRef(false);
  const hasCurrentResumableStateRef = useRef(false);
  const hasHydratedPersistedSessionRef = useRef(initialPersistedAppState !== null);
  const hasUserMutatedSessionRef = useRef(false);
  const hasExplicitSessionResetRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);
  const resetFeedbackTimerRef = useRef<number | null>(null);
  const exerciseSaveFeedbackTimerRef = useRef<number | null>(null);
  const latestPersistedSessionRef = useRef<PersistedAppState | null>(null);
  const cardSwipeStartRef = useRef<{
    x: number;
    y: number;
    isBlocked: boolean;
  } | null>(null);
  const listSwipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const savedEditableStateRef = useRef(
    Object.fromEntries(
      seedExercises.map((exercise) => [
        exercise.id,
        {
          notes: exercise.notes,
          reps: exercise.reps,
          sets: exercise.sets,
          weight: exercise.weight,
        },
      ]),
    ),
  );
  const adjustStartStateRef = useRef<{
    exerciseId: string;
    reps: string;
    sets: number;
    weight: string;
  } | null>(null);
  const [exerciseSaveState, setExerciseSaveState] = useState<ExerciseSaveState>(null);
  const [debugPersistedStateFound, setDebugPersistedStateFound] = useState(
    initialPersistedAppState !== null,
  );
  const [debugStateSource, setDebugStateSource] = useState<DebugStateSource>(
    initialPersistedAppState ? "server" : "default",
  );
  const [debugLoadedCheckedCount, setDebugLoadedCheckedCount] = useState(() =>
    countCheckedSets(initialPersistedAppState?.setChecksByExercise ?? {}),
  );
  const [debugHydrationApplied, setDebugHydrationApplied] = useState(
    initialPersistedAppState !== null,
  );
  const [debugLastSaveStatus, setDebugLastSaveStatus] = useState<DebugSaveStatus | null>(null);

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

  const applyPersistedSessionState = (savedState: PersistedAppState | null) => {
    setDebugPersistedStateFound(savedState !== null);
    setDebugLoadedCheckedCount(countCheckedSets(savedState?.setChecksByExercise ?? {}));
    const normalizedState = normalizePersistedAppState(
      savedState,
      exerciseState,
      collectionIds,
    );

    if (!normalizedState) {
      setDebugHydrationApplied(false);
      return;
    }

    const normalizedNavigation = restoreNavigationState(
      normalizedState,
      collectionIds,
      exerciseState,
    );

    setDebugStateSource("server");
    setDebugHydrationApplied(true);
    setSetChecksByExercise(normalizedState.setChecksByExercise);
    setView(normalizedNavigation.view);
    setActiveCollectionId(normalizedNavigation.activeCollectionId);
    setActiveExerciseIndex(normalizedNavigation.activeExerciseIndex);
    setIsAdjustingPlan(false);
    setIsJumpMenuOpen(false);
    setShowResetFeedback(false);
  };

  const hasCurrentResumableState =
    view !== "collections" || activeCollectionId !== null || hasCheckedSets(setChecksByExercise);

  useEffect(() => {
    hasCurrentResumableStateRef.current = hasCurrentResumableState;
  }, [hasCurrentResumableState]);

  const canPersistWorkoutSession = () =>
    hasHydratedPersistedSessionRef.current ||
    hasUserMutatedSessionRef.current ||
    hasExplicitSessionResetRef.current;

  const markSessionMutated = () => {
    hasUserMutatedSessionRef.current = true;
    setDebugStateSource("local");
  };

  const persistCurrentWorkoutSession = async (
    state: PersistedAppState,
    keepalive = false,
    payloadSource = "client-persist",
  ) => {
    setDebugLastSaveStatus({
      at: new Date().toISOString(),
      checkedCount: countCheckedSets(state.setChecksByExercise ?? {}),
      keepalive,
      source: payloadSource,
      status: "attempt",
    });
    const response = await fetch("/api/workout-app-state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-gym-app-payload-source": payloadSource,
      },
      body: JSON.stringify(state),
      cache: "no-store",
      keepalive,
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;

    if (!response.ok || !payload?.ok) {
      const errorMessage = payload?.error || "Failed to persist workout app state.";
      setDebugLastSaveStatus({
        at: new Date().toISOString(),
        checkedCount: countCheckedSets(state.setChecksByExercise ?? {}),
        keepalive,
        source: payloadSource,
        status: "error",
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }

    setDebugLastSaveStatus({
      at: new Date().toISOString(),
      checkedCount: countCheckedSets(state.setChecksByExercise ?? {}),
      keepalive,
      source: payloadSource,
      status: "success",
    });
  };

  useEffect(() => {
    latestPersistedSessionRef.current = buildPersistenceState(setChecksByExercise, {
      activeCollectionId,
      activeExerciseIndex,
      activeView: view === "exercise-card" ? "exercise-card" : "exercise-list",
    });
  }, [activeCollectionId, activeExerciseIndex, setChecksByExercise, view]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      if (!canPersistWorkoutSession()) {
        return;
      }

      const persistenceState = latestPersistedSessionRef.current;
      if (!persistenceState) {
        return;
      }

      void persistCurrentWorkoutSession(
        persistenceState,
        false,
        "autosave-debounce",
      ).catch((error) => {
        console.error(
          "Failed to persist workout app state",
          error instanceof Error ? error.message : error,
        );
      });
    }, 250);
  }, [
    activeCollectionId,
    activeExerciseIndex,
    setChecksByExercise,
    view,
  ]);

  useEffect(() => {
    if (hasAttemptedRehydrateRef.current || hasCurrentResumableState) {
      return;
    }

    hasAttemptedRehydrateRef.current = true;

    let cancelled = false;

    async function rehydratePersistedSession() {
      try {
        const response = await fetch("/api/workout-app-state", {
          cache: "no-store",
          headers: {
            "x-gym-app-payload-source": "client-rehydrate",
          },
        });
        const payload = (await response.json().catch(() => null)) as
          | { state?: PersistedAppState | null }
          | null;

        if (!response.ok || cancelled) {
          return;
        }

        setDebugPersistedStateFound((payload?.state ?? null) !== null);
        setDebugLoadedCheckedCount(
          countCheckedSets(payload?.state?.setChecksByExercise ?? {}),
        );
        hasHydratedPersistedSessionRef.current = true;

        if (hasCurrentResumableStateRef.current) {
          return;
        }

        applyPersistedSessionState(payload?.state ?? null);
      } catch {
        // Silent failure: the app should still remain usable without resume.
      }
    }

    void rehydratePersistedSession();

    return () => {
      cancelled = true;
    };
  }, [collectionIds, exerciseState, hasCurrentResumableState]);

  useEffect(
    () => () => {
      if (resetFeedbackTimerRef.current) {
        window.clearTimeout(resetFeedbackTimerRef.current);
      }

      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
      }

      if (exerciseSaveFeedbackTimerRef.current) {
        window.clearTimeout(exerciseSaveFeedbackTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const flushPersistedSession = () => {
      if (!canPersistWorkoutSession()) {
        return;
      }

      const persistenceState = latestPersistedSessionRef.current;
      if (!persistenceState) {
        return;
      }

      void persistCurrentWorkoutSession(
        persistenceState,
        true,
        "lifecycle-flush",
      ).catch(() => {
        // Best effort only during abrupt lifecycle transitions.
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPersistedSession();
      }
    };

    window.addEventListener("pagehide", flushPersistedSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushPersistedSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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
    markSessionMutated();
    setActiveCollectionId(collectionId);
    setActiveExerciseIndex(0);
    setView("exercise-list");
    setIsAdjustingPlan(false);
    setIsJumpMenuOpen(false);
    setShowResetFeedback(false);
  };

  const navigateToCollections = () => {
    markSessionMutated();
    setView("collections");
    setActiveCollectionId(null);
    setActiveExerciseIndex(0);
    setIsAdjustingPlan(false);
    setIsJumpMenuOpen(false);
    setShowResetFeedback(false);
  };

  const openExerciseCardByIndex = (exerciseIndex: number) => {
    markSessionMutated();
    setActiveExerciseIndex(exerciseIndex);
    setView("exercise-card");
    setIsAdjustingPlan(false);
    setIsJumpMenuOpen(false);
  };

  const navigateToExerciseList = () => {
    markSessionMutated();
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

  const queueExerciseSaveFeedback = (
    exerciseId: string,
    kind: "error" | "success",
    message: string,
  ) => {
    setExerciseSaveState({ exerciseId, kind, message });

    if (exerciseSaveFeedbackTimerRef.current) {
      window.clearTimeout(exerciseSaveFeedbackTimerRef.current);
    }

    exerciseSaveFeedbackTimerRef.current = window.setTimeout(() => {
      setExerciseSaveState(null);
      exerciseSaveFeedbackTimerRef.current = null;
    }, 1800);
  };

  const persistExercisePatch = async (
    exerciseId: string,
    patch: Record<string, string | number>,
  ) => {
    const response = await fetch(`/api/exercises/${exerciseId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.error || "Failed to save exercise changes.");
    }
  };

  const handleToggleSet = (exerciseId: string, setIndex: number) => {
    markSessionMutated();
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

  const handleAdjustToggle = async () => {
    if (!activeExercise) {
      return;
    }

    if (!isAdjustingPlan) {
      adjustStartStateRef.current = {
        exerciseId: activeExercise.id,
        reps: activeExercise.reps,
        sets: activeExercise.sets,
        weight: activeExercise.weight,
      };
      setIsAdjustingPlan(true);
      return;
    }

    const startState = adjustStartStateRef.current;
    setIsAdjustingPlan(false);
    adjustStartStateRef.current = null;

    if (!startState || startState.exerciseId !== activeExercise.id) {
      return;
    }

    const patch = buildExerciseEditPatch(
      {
        notes: activeExercise.notes,
        reps: startState.reps,
        sets: startState.sets,
        weight: startState.weight,
      },
      {
        notes: activeExercise.notes,
        reps: activeExercise.reps,
        sets: activeExercise.sets,
        weight: activeExercise.weight,
      },
    );

    delete patch.notes;

    if (!hasExerciseEditPatch(patch)) {
      return;
    }

    try {
      await persistExercisePatch(activeExercise.id, patch);
      savedEditableStateRef.current[activeExercise.id] = {
        notes: savedEditableStateRef.current[activeExercise.id]?.notes ?? activeExercise.notes,
        reps: activeExercise.reps,
        sets: activeExercise.sets,
        weight: activeExercise.weight,
      };
      queueExerciseSaveFeedback(activeExercise.id, "success", "Plan saved");
    } catch (error) {
      queueExerciseSaveFeedback(
        activeExercise.id,
        "error",
        error instanceof Error ? error.message : "Failed to save plan changes.",
      );
    }
  };

  const handleSaveNotes = async () => {
    if (!activeExercise) {
      return;
    }

    const previous = savedEditableStateRef.current[activeExercise.id] ?? {
      notes: "",
      reps: activeExercise.reps,
      sets: activeExercise.sets,
      weight: activeExercise.weight,
    };
    const patch = buildExerciseEditPatch(previous, {
      notes: activeExercise.notes,
      reps: previous.reps,
      sets: previous.sets,
      weight: previous.weight,
    });

    if (typeof patch.notes !== "string") {
      return;
    }

    try {
      await persistExercisePatch(activeExercise.id, { notes: patch.notes });
      savedEditableStateRef.current[activeExercise.id] = {
        ...previous,
        notes: activeExercise.notes,
      };
      queueExerciseSaveFeedback(activeExercise.id, "success", "Notes saved");
    } catch (error) {
      queueExerciseSaveFeedback(
        activeExercise.id,
        "error",
        error instanceof Error ? error.message : "Failed to save notes.",
      );
    }
  };

  const handleRevertNotes = () => {
    if (!activeExercise) {
      return;
    }

    const savedNotes = savedEditableStateRef.current[activeExercise.id]?.notes ?? "";

    setExerciseState((currentExercises) =>
      currentExercises.map((exercise) =>
        exercise.id === activeExercise.id ? { ...exercise, notes: savedNotes } : exercise,
      ),
    );
    setExerciseSaveState(null);
  };

  const handleResetCollection = () => {
    hasExplicitSessionResetRef.current = true;
    markSessionMutated();

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
    markSessionMutated();
    const nextIndex = activeExerciseIndex + offset;

    if (nextIndex < 0 || nextIndex >= orderedExercises.length) {
      return;
    }

    setActiveExerciseIndex(nextIndex);
    setIsAdjustingPlan(false);
    setIsJumpMenuOpen(false);
  };

  const jumpToExerciseIndex = (nextIndex: number) => {
    markSessionMutated();
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
  const notesDirty =
    activeExercise != null
      ? activeExercise.notes !==
        (savedEditableStateRef.current[activeExercise.id]?.notes ?? "")
      : false;

    const debugPanel = gymAppDebugEnabled ? (
    <section
      aria-label="Workout state debug"
      style={{
        marginBottom: "1rem",
        border: "1px solid rgba(148, 163, 184, 0.5)",
        borderRadius: "0.75rem",
        padding: "0.75rem",
        background: "rgba(15, 23, 42, 0.04)",
        fontSize: "0.85rem",
      }}
    >
      <strong style={{ display: "block", marginBottom: "0.5rem" }}>
        Debug: Workout State
      </strong>
      <div>route: {pathname}</div>
      <div>auth: {authStatus}</div>
      <div>persisted found: {String(debugPersistedStateFound)}</div>
      <div>state source: {debugStateSource}</div>
      <div>loaded checked count: {debugLoadedCheckedCount}</div>
      <div>visible checked count: {countCheckedSets(setChecksByExercise)}</div>
      <div>hydration applied: {String(debugHydrationApplied)}</div>
      <div>
        last save: {debugLastSaveStatus
          ? `${debugLastSaveStatus.status} | ${debugLastSaveStatus.source} | checked=${debugLastSaveStatus.checkedCount} | keepalive=${String(debugLastSaveStatus.keepalive)} | ${debugLastSaveStatus.at}${debugLastSaveStatus.error ? ` | ${debugLastSaveStatus.error}` : ""}`
          : "none"}
      </div>
    </section>
  ) : null;

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
        {debugPanel}
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
                onClick={() => void handleAdjustToggle()}
              >
                {isAdjustingPlan ? "Done" : "Adjust"}
              </button>
            </div>
            {exerciseSaveState?.exerciseId === activeExercise.id ? (
              <p
                className={`exercise-save-feedback exercise-save-feedback--${exerciseSaveState.kind}`}
                role="status"
                aria-live="polite"
              >
                {exerciseSaveState.message}
              </p>
            ) : null}
          </div>

          {isAdjustingPlan ? (
            <div className="plan-adjust-row">
              <input
                type="number"
                className="plan-adjust-input"
                min={1}
                step={1}
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

          {notesDirty ? (
            <div className="notes-actions">
              <p className="notes-unsaved">Unsaved changes</p>
              <div className="notes-actions__buttons">
                <button
                  type="button"
                  className="reset-button"
                  onClick={handleRevertNotes}
                >
                  Revert
                </button>
                <button
                  type="button"
                  className="reset-button reset-button--primary"
                  onClick={() => void handleSaveNotes()}
                >
                  Save Notes
                </button>
              </div>
            </div>
          ) : null}

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
        {debugPanel}

        <header className="home__header">
          <div className="collection-header-actions">
            <button
              type="button"
              className="back-button"
              onClick={navigateToCollections}
            >
              Back
            </button>
          </div>
          <h1>{selectedCollection.name}</h1>
        </header>

        <section
          className="exercise-list"
          aria-label={`${selectedCollection.name} exercises`}
          onTouchStart={handleExerciseListTouchStart}
          onTouchEnd={handleExerciseListTouchEnd}
        >
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
                className="exercise-card"
                onClick={() => openExerciseCardByIndex(index)}
              >
                <span className="exercise-card__name-row">
                  <span className="exercise-card__name">{exercise.name}</span>
                  {completion !== "not-started" ? (
                    <span
                      className={`exercise-card__status exercise-card__status--${completion}`}
                      aria-label={completionForUi.label}
                    >
                      {completionForUi.symbol}
                    </span>
                  ) : null}
                </span>
                <span className="exercise-card__plan">
                  {exercise.sets} × {exercise.reps} @ {exercise.weight}
                </span>
              </button>
            );
          })}
        </section>
      </main>
    );
  }

  return (
    <main className="home">
      {debugPanel}

      <header className="home__header">
        <div className="home__title-row">
          <h1>Gym App</h1>
          <div className="home__header-actions">
            <button
              type="button"
              className="reset-button"
              onClick={handleResetCollection}
            >
              Reset Session
            </button>
            <Link href="/dashboard/workouts" className="home__manage-link">
              Dashboard
            </Link>
          </div>
        </div>
        <p
          className={`home__reset-feedback${showResetFeedback ? " is-visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          Session reset
        </p>
        <p>Select a collection.</p>
      </header>

      <section className="collections" aria-label="Workout collections">
        {orderedCollections.map((collection) => (
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
