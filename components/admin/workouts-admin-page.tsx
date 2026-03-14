"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { CollectionEditor } from "@/components/admin/collection-editor";
import { CollectionsPanel } from "@/components/admin/collections-panel";
import { ExerciseEditor } from "@/components/admin/exercise-editor";
import { ExercisesPanel } from "@/components/admin/exercises-panel";
import {
  findUnassignedCollection,
  isUnassignedCollection,
  sortCollectionsForDisplay,
} from "@/lib/collection-utils";
import { shouldResetSelectedExercise } from "@/lib/admin-workouts-state";
import { getNextExerciseOrder } from "@/lib/exercise-utils";
import type { Collection } from "@/types/collection";
import type { Exercise } from "@/types/exercise";

type CollectionDraft = {
  id: string;
  name: string;
  description: string;
  order: number;
};

type ExerciseDraft = {
  id: string;
  collectionId: string;
  name: string;
  order: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
};

type RequestError = {
  error: string;
};

const sortExercises = (exercises: Exercise[]) =>
  [...exercises].sort((left, right) => {
    if (left.collectionId !== right.collectionId) {
      return left.collectionId.localeCompare(right.collectionId);
    }

    return left.order - right.order;
  });

const collectionToDraft = (collection: Collection): CollectionDraft => ({
  id: collection.id,
  name: collection.name,
  description: collection.description ?? "",
  order: collection.order,
});

const exerciseToDraft = (exercise: Exercise): ExerciseDraft => ({
  id: exercise.id,
  collectionId: exercise.collectionId,
  name: exercise.name,
  order: String(exercise.order),
  sets: String(exercise.sets),
  reps: exercise.reps ?? "",
  weight: exercise.weight ?? "",
  notes: exercise.notes ?? "",
});

async function readJson<T>(response: Response): Promise<T | RequestError> {
  return (await response.json()) as T | RequestError;
}

export default function WorkoutsAdminPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [collectionEditorMode, setCollectionEditorMode] = useState<"create" | "edit" | null>(null);
  const [exerciseEditorMode, setExerciseEditorMode] = useState<"create" | "edit" | null>(null);
  const [collectionDraft, setCollectionDraft] = useState<CollectionDraft | null>(null);
  const [exerciseDraft, setExerciseDraft] = useState<ExerciseDraft | null>(null);
  const [deleteCollectionDestinationId, setDeleteCollectionDestinationId] = useState("");
  const [isDeleteCollectionConfirmOpen, setIsDeleteCollectionConfirmOpen] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  const selectedCollection = useMemo(
    () =>
      selectedCollectionId
        ? collections.find((collection) => collection.id === selectedCollectionId) ?? null
        : null,
    [collections, selectedCollectionId],
  );
  const unassignedCollection = useMemo(
    () => findUnassignedCollection(collections),
    [collections],
  );
  const deleteDestinationOptions = useMemo(
    () =>
      sortCollectionsForDisplay(
        collections.filter((collection) => collection.id !== selectedCollectionId),
      ).map((collection) => ({
        id: collection.id,
        name: collection.name,
      })),
    [collections, selectedCollectionId],
  );

  const collectionExercises = useMemo(
    () =>
      selectedCollectionId
        ? sortExercises(
            exercises.filter((exercise) => exercise.collectionId === selectedCollectionId),
          )
        : [],
    [exercises, selectedCollectionId],
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [collectionsResponse, exercisesResponse] = await Promise.all([
          fetch("/api/collections", { cache: "no-store" }),
          fetch("/api/exercises", { cache: "no-store" }),
        ]);

        if (!collectionsResponse.ok || !exercisesResponse.ok) {
          throw new Error("Failed to load admin data.");
        }

        const collectionsPayload = (await readJson<{ collections: Collection[] }>(
          collectionsResponse,
        )) as { collections: Collection[] };
        const exercisesPayload = (await readJson<{ exercises: Exercise[] }>(
          exercisesResponse,
        )) as { exercises: Exercise[] };

        const nextCollections = sortCollectionsForDisplay(collectionsPayload.collections);
        const nextExercises = sortExercises(exercisesPayload.exercises);

        setCollections(nextCollections);
        setExercises(nextExercises);
        setSelectedCollectionId((current) => {
          if (current && nextCollections.some((collection) => collection.id === current)) {
            return current;
          }

          return nextCollections[0]?.id ?? null;
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load admin data.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedCollectionId) {
      setSelectedExerciseId(null);
      if (exerciseEditorMode !== "create") {
        setExerciseEditorMode(null);
        setExerciseDraft(null);
      }
      return;
    }

    if (
      !shouldResetSelectedExercise({
        exerciseDraftId: exerciseDraft?.id ?? null,
        exerciseEditorMode,
        selectedCollectionId,
        selectedExerciseId,
        collectionExerciseIds: collectionExercises.map((exercise) => exercise.id),
      })
    ) {
      return;
    }

    setSelectedExerciseId(null);
    setExerciseDraft(null);
    setExerciseEditorMode(null);
  }, [collectionExercises, exerciseEditorMode, selectedCollectionId, selectedExerciseId]);

  const clearMessages = () => {
    setToastMessage(null);
    setErrorMessage(null);
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 1800);
  };

  const resetDeleteCollectionState = (nextSelectedCollectionId?: string | null) => {
    setIsDeleteCollectionConfirmOpen(false);

    if (!unassignedCollection) {
      setDeleteCollectionDestinationId("");
      return;
    }

    const nextTargetCollectionId = nextSelectedCollectionId ?? selectedCollectionId;
    const nextTargetCollection =
      nextTargetCollectionId != null
        ? collections.find((collection) => collection.id === nextTargetCollectionId) ?? null
        : null;

    if (isUnassignedCollection(nextTargetCollection)) {
      setDeleteCollectionDestinationId("");
      return;
    }

    setDeleteCollectionDestinationId(
      nextTargetCollectionId === unassignedCollection.id ? "" : unassignedCollection.id,
    );
  };

  const handleSelectCollection = (collectionId: string) => {
    clearMessages();
    setSelectedCollectionId(collectionId);
    setSelectedExerciseId(null);
    setExerciseDraft(null);
    setExerciseEditorMode(null);
    setCollectionEditorMode("edit");
    resetDeleteCollectionState(collectionId);

    const collection = collections.find((item) => item.id === collectionId) ?? null;
    setCollectionDraft(collection ? collectionToDraft(collection) : null);
  };

  const handleCreateCollection = () => {
    clearMessages();
    const nextCollectionId = crypto.randomUUID();
    setSelectedCollectionId(nextCollectionId);
    setSelectedExerciseId(null);
    setExerciseDraft(null);
    setExerciseEditorMode(null);
    setCollectionEditorMode("create");
    setIsDeleteCollectionConfirmOpen(false);
    setDeleteCollectionDestinationId(unassignedCollection?.id ?? "");
    setCollectionDraft({
      id: nextCollectionId,
      name: "",
      description: "",
      order:
        collections.reduce(
          (currentMax, collection) => Math.max(currentMax, collection.order),
          0,
        ) + 1,
    });
  };

  const handleEditCollection = () => {
    if (!selectedCollection) {
      return;
    }

    clearMessages();
    setCollectionEditorMode("edit");
    resetDeleteCollectionState(selectedCollection.id);
    setCollectionDraft(collectionToDraft(selectedCollection));
  };

  const handleDeleteCollection = async () => {
    if (!selectedCollection) {
      return;
    }

    if (isUnassignedCollection(selectedCollection)) {
      setErrorMessage("The Unassigned collection cannot be deleted.");
      return;
    }

    if (!unassignedCollection) {
      setErrorMessage(
        "The Unassigned collection is missing. Create or restore it before deleting collections.",
      );
      return;
    }

    if (!deleteCollectionDestinationId) {
      setErrorMessage("Choose a destination collection for reassigned exercises.");
      return;
    }

    if (deleteCollectionDestinationId === selectedCollection.id) {
      setErrorMessage("A collection cannot be reassigned to itself.");
      return;
    }

    clearMessages();
    setBusy(true);

    try {
      const response = await fetch(`/api/collections/${selectedCollection.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destinationCollectionId: deleteCollectionDestinationId,
        }),
      });
      const payload = await readJson<{ ok: true }>(response);

      if (!response.ok || "error" in payload) {
        throw new Error(("error" in payload && payload.error) || "Failed to delete collection.");
      }

      const destinationCollection = collections.find(
        (collection) => collection.id === deleteCollectionDestinationId,
      );
      const nextCollections = collections.filter(
        (collection) => collection.id !== selectedCollection.id,
      );
      const nextExercises = sortExercises(
        exercises.map((exercise) =>
          exercise.collectionId === selectedCollection.id
            ? { ...exercise, collectionId: deleteCollectionDestinationId }
            : exercise,
        ),
      );
      const deletedCollectionIndex = collections.findIndex(
        (collection) => collection.id === selectedCollection.id,
      );
      const fallbackCollection =
        nextCollections[deletedCollectionIndex] ??
        nextCollections[deletedCollectionIndex - 1] ??
        nextCollections[0] ??
        null;

      setCollections(nextCollections);
      setExercises(nextExercises);
      setSelectedCollectionId(fallbackCollection?.id ?? null);
      setSelectedExerciseId(null);
      setCollectionDraft(fallbackCollection ? collectionToDraft(fallbackCollection) : null);
      setCollectionEditorMode(fallbackCollection ? "edit" : null);
      resetDeleteCollectionState(fallbackCollection?.id ?? null);
      setExerciseDraft(null);
      setExerciseEditorMode(null);
      showSuccessToast(
        destinationCollection
          ? `Collection deleted. Exercises moved to ${destinationCollection.name}.`
          : "Collection deleted.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete collection.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCollection = async () => {
    if (!collectionDraft) {
      return;
    }

    if (!collectionDraft.name.trim()) {
      setErrorMessage("Collection name is required.");
      return;
    }

    if (!Number.isInteger(collectionDraft.order) || collectionDraft.order < 1) {
      setErrorMessage("Display order must be an integer greater than or equal to 1.");
      return;
    }

    clearMessages();
    setBusy(true);

    try {
      const isCreate = collectionEditorMode === "create";
      const url = isCreate
        ? "/api/collections"
        : `/api/collections/${collectionDraft.id}`;
      const method = isCreate ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: collectionDraft.id,
          name: collectionDraft.name,
          description: collectionDraft.description,
          order: collectionDraft.order,
        }),
      });

      const payload = await readJson<{ ok: true; id: string }>(response);

      if (!response.ok || "error" in payload) {
        throw new Error(("error" in payload && payload.error) || "Failed to save collection.");
      }

      const nextCollection: Collection = {
        id: collectionDraft.id,
        name: collectionDraft.name.trim(),
        description: collectionDraft.description.trim() || undefined,
        order: collectionDraft.order,
      };
      const nextCollections = sortCollectionsForDisplay([
        ...collections.filter((collection) => collection.id !== nextCollection.id),
        nextCollection,
      ]);

      setCollections(nextCollections);
      setSelectedCollectionId(nextCollection.id);
      setSelectedExerciseId(null);
      setExerciseDraft(null);
      setExerciseEditorMode(null);
      setCollectionDraft(collectionToDraft(nextCollection));
      setCollectionEditorMode("edit");
      resetDeleteCollectionState(nextCollection.id);
      showSuccessToast(isCreate ? "Collection created." : "Collection updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save collection.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCreateExercise = () => {
    if (!selectedCollectionId) {
      return;
    }

    clearMessages();
    const draft: ExerciseDraft = {
      id: crypto.randomUUID(),
      collectionId: selectedCollectionId,
      name: "",
      order: String(getNextExerciseOrder(exercises, selectedCollectionId)),
      sets: "3",
      reps: "",
      weight: "",
      notes: "",
    };

    setExerciseDraft(draft);
    setExerciseEditorMode("create");
    setSelectedExerciseId(draft.id);
    setCollectionEditorMode(null);
  };

  const handleSelectExercise = (exerciseId: string) => {
    clearMessages();
    const exercise = exercises.find((item) => item.id === exerciseId) ?? null;

    setSelectedExerciseId(exerciseId);
    setExerciseEditorMode(exercise ? "edit" : null);
    setExerciseDraft(exercise ? exerciseToDraft(exercise) : null);
    setCollectionEditorMode(null);
  };

  const handleDeleteExercise = async (exerciseId?: string) => {
    const targetId = exerciseId ?? exerciseDraft?.id ?? selectedExerciseId;
    if (!targetId) {
      return;
    }

    const shouldDelete = window.confirm("Delete this exercise?");
    if (!shouldDelete) {
      return;
    }

    clearMessages();
    setBusy(true);

    try {
      const response = await fetch(`/api/exercises/${targetId}`, {
        method: "DELETE",
      });
      const payload = await readJson<{ ok: true }>(response);

      if (!response.ok || "error" in payload) {
        throw new Error(("error" in payload && payload.error) || "Failed to delete exercise.");
      }

      const nextExercises = exercises.filter((exercise) => exercise.id !== targetId);
      setExercises(nextExercises);

      if (selectedExerciseId === targetId) {
        setSelectedExerciseId(null);
        setExerciseEditorMode(null);
        setExerciseDraft(null);
        setCollectionEditorMode(selectedCollection ? "edit" : null);
        setCollectionDraft(selectedCollection ? collectionToDraft(selectedCollection) : null);
      }

      showSuccessToast("Exercise deleted.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete exercise.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSaveExercise = async () => {
    if (!exerciseDraft) {
      return;
    }

    if (!exerciseDraft.collectionId) {
      setErrorMessage("Exercise collection is required.");
      return;
    }

    const destinationCollection = collections.find(
      (collection) => collection.id === exerciseDraft.collectionId,
    );

    if (!destinationCollection) {
      setErrorMessage("Exercise collection must be a valid collection.");
      return;
    }

    if (!exerciseDraft.name.trim()) {
      setErrorMessage("Exercise name is required.");
      return;
    }

    const parsedSets = Number.parseInt(exerciseDraft.sets, 10);
    const parsedOrder = Number.parseInt(exerciseDraft.order, 10);
    const existingExercise = exercises.find((exercise) => exercise.id === exerciseDraft.id) ?? null;
    const isCollectionChanged =
      exerciseDraft.collectionId !== (existingExercise?.collectionId ?? selectedCollectionId);
    const effectiveOrder = isCollectionChanged
      ? getNextExerciseOrder(exercises, exerciseDraft.collectionId, exerciseDraft.id)
      : parsedOrder;

    if (!Number.isInteger(parsedSets) || parsedSets < 1) {
      setErrorMessage("Sets must be an integer greater than or equal to 1.");
      return;
    }

    if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
      setErrorMessage("Order must be an integer greater than or equal to 1.");
      return;
    }

    clearMessages();
    setBusy(true);

    try {
      const isCreate = exerciseEditorMode === "create";
      const url = isCreate ? "/api/exercises" : `/api/exercises/${exerciseDraft.id}`;
      const method = isCreate ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: exerciseDraft.id,
          collectionId: exerciseDraft.collectionId,
          name: exerciseDraft.name,
          order: effectiveOrder,
          sets: parsedSets,
          reps: exerciseDraft.reps,
          weight: exerciseDraft.weight,
          notes: exerciseDraft.notes,
        }),
      });
      const payload = await readJson<{ ok: true; id: string }>(response);

      if (!response.ok || "error" in payload) {
        throw new Error(("error" in payload && payload.error) || "Failed to save exercise.");
      }

      const nextExercise: Exercise = {
        id: exerciseDraft.id,
        collectionId: exerciseDraft.collectionId,
        name: exerciseDraft.name.trim(),
        order: effectiveOrder,
        sets: parsedSets,
        reps: exerciseDraft.reps.trim() || undefined,
        weight: exerciseDraft.weight.trim() || undefined,
        notes: exerciseDraft.notes.trim() || undefined,
      };

      const nextExercises = sortExercises([
        ...exercises.filter((exercise) => exercise.id !== nextExercise.id),
        nextExercise,
      ]);

      setExercises(nextExercises);
      setSelectedCollectionId(nextExercise.collectionId);
      setSelectedExerciseId(nextExercise.id);
      setExerciseDraft(exerciseToDraft(nextExercise));
      setExerciseEditorMode("edit");
      setCollectionEditorMode(null);
      showSuccessToast(
        isCreate
          ? "Exercise created."
          : isCollectionChanged
            ? `Exercise moved to ${destinationCollection.name}.`
            : "Exercise updated.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save exercise.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCollectionFieldChange = (
    field: "name" | "description" | "order",
    value: string,
  ) => {
    setCollectionDraft((current) => {
      if (!current) {
        return current;
      }

      if (field === "order") {
        const parsedOrder = Number.parseInt(value, 10);
        return {
          ...current,
          order: Number.isInteger(parsedOrder) ? parsedOrder : 0,
        };
      }

      return { ...current, [field]: value };
    });
  };

  const handleExerciseFieldChange = (
    field: "collectionId" | "name" | "order" | "sets" | "reps" | "weight" | "notes",
    value: string,
  ) => {
    setExerciseDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const canDeleteSelectedCollection = Boolean(
    selectedCollection &&
      !isUnassignedCollection(selectedCollection) &&
      unassignedCollection &&
      deleteDestinationOptions.length > 0,
  );
  const deleteHelpText =
    collectionEditorMode === "edit" && selectedCollection
      ? isUnassignedCollection(selectedCollection)
        ? "Unassigned is a protected system collection and cannot be deleted."
        : !unassignedCollection
          ? "The Unassigned collection is missing. Restore it before deleting collections."
          : null
      : null;

  const showCollectionEditor =
    collectionEditorMode === "create" || (selectedCollection && !selectedExerciseId);
  const showExerciseEditor = Boolean(selectedExerciseId && exerciseDraft);

  return (
    <main className="admin-workouts">
      <header className="admin-workouts__header">
        <div className="admin-workouts__header-row">
          <div>
            <p className="admin-workouts__eyebrow">Desktop Admin</p>
            <h1>Workout Content</h1>
            <p>Manage collections and exercises used by the phone workout UI.</p>
          </div>

          <Link href="/" className="admin-workouts__home-link">
            Home
          </Link>
        </div>
      </header>

      {errorMessage ? <p className="admin-banner admin-banner--error">{errorMessage}</p> : null}
      {toastMessage ? (
        <div className="admin-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}

      <div className="admin-workouts__layout">
        <CollectionsPanel
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          loading={loading}
          onSelectCollection={handleSelectCollection}
          onCreateCollection={handleCreateCollection}
          onEditCollection={handleEditCollection}
        />

        <ExercisesPanel
          selectedCollection={selectedCollection}
          exercises={collectionExercises}
          selectedExerciseId={selectedExerciseId}
          loading={loading}
          onSelectExercise={handleSelectExercise}
          onCreateExercise={handleCreateExercise}
          onDeleteExercise={handleDeleteExercise}
        />

        <div className="admin-workouts__editor-column">
          {!selectedCollection && collectionEditorMode !== "create" ? (
            <section className="admin-card admin-card--empty" aria-label="Selection details">
              <div className="admin-card__header">
                <div>
                  <h3>Details</h3>
                  <p>Select a collection to manage its exercises.</p>
                </div>
              </div>
            </section>
          ) : null}

          {showCollectionEditor ? (
            <CollectionEditor
              mode={collectionEditorMode}
              draft={collectionDraft}
              loading={busy}
              message={
                collectionEditorMode === "create"
                  ? "Collection id is generated automatically."
                  : null
              }
              canDelete={canDeleteSelectedCollection}
              deleteHelpText={deleteHelpText}
              deleteExerciseCount={collectionExercises.length}
              deleteDestinationId={deleteCollectionDestinationId}
              deleteDestinationOptions={deleteDestinationOptions}
              isDeleteConfirmOpen={isDeleteCollectionConfirmOpen}
              onChange={handleCollectionFieldChange}
              onSave={handleSaveCollection}
              onCancel={() => {
                if (collectionEditorMode === "create" && !selectedCollection) {
                  setCollectionEditorMode(null);
                  setCollectionDraft(null);
                  setSelectedCollectionId(null);
                  resetDeleteCollectionState(null);
                  return;
                }

                setCollectionEditorMode(selectedCollection ? "edit" : null);
                setCollectionDraft(
                  selectedCollection ? collectionToDraft(selectedCollection) : null,
                );
                resetDeleteCollectionState(selectedCollection?.id ?? null);
              }}
              onDeleteDestinationChange={setDeleteCollectionDestinationId}
              onOpenDeleteConfirm={() => {
                clearMessages();
                setIsDeleteCollectionConfirmOpen(true);
                if (unassignedCollection && selectedCollection?.id !== unassignedCollection.id) {
                  setDeleteCollectionDestinationId(unassignedCollection.id);
                }
              }}
              onCloseDeleteConfirm={() => {
                resetDeleteCollectionState(selectedCollection?.id ?? null);
              }}
              onConfirmDelete={() => void handleDeleteCollection()}
            />
          ) : null}

          {showExerciseEditor ? (
            <ExerciseEditor
              collections={collections}
              draft={exerciseDraft}
              mode={exerciseEditorMode}
              loading={busy}
              message={selectedCollection ? `Current collection: ${selectedCollection.name}` : null}
              onChange={handleExerciseFieldChange}
              onSave={handleSaveExercise}
              onDelete={() => void handleDeleteExercise()}
              onCancel={() => {
                const selectedExercise =
                  exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;

                if (!selectedExercise) {
                  setSelectedExerciseId(null);
                  setExerciseEditorMode(null);
                  setExerciseDraft(null);
                  setCollectionEditorMode(selectedCollection ? "edit" : null);
                  setCollectionDraft(
                    selectedCollection ? collectionToDraft(selectedCollection) : null,
                  );
                  return;
                }

                setExerciseEditorMode("edit");
                setExerciseDraft(exerciseToDraft(selectedExercise));
              }}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
