export function shouldResetSelectedExercise(params: {
  exerciseDraftId: string | null;
  exerciseEditorMode: "create" | "edit" | null;
  selectedCollectionId: string | null;
  selectedExerciseId: string | null;
  collectionExerciseIds: string[];
}): boolean {
  const {
    exerciseDraftId,
    exerciseEditorMode,
    selectedCollectionId,
    selectedExerciseId,
    collectionExerciseIds,
  } = params;

  if (!selectedCollectionId) {
    return false;
  }

  if (exerciseEditorMode === "create" && exerciseDraftId === selectedExerciseId) {
    return false;
  }

  return !collectionExerciseIds.includes(selectedExerciseId ?? "");
}
