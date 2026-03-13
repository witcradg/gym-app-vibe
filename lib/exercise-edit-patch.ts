type EditableExerciseFields = {
  notes: string;
  reps: string;
  sets: number;
  weight: string;
};

export type ExerciseEditPatch = Partial<EditableExerciseFields>;

export const buildExerciseEditPatch = (
  previous: EditableExerciseFields,
  next: EditableExerciseFields,
): ExerciseEditPatch => {
  const patch: ExerciseEditPatch = {};

  if (previous.notes !== next.notes) {
    patch.notes = next.notes;
  }

  if (previous.reps !== next.reps) {
    patch.reps = next.reps;
  }

  if (previous.sets !== next.sets) {
    patch.sets = next.sets;
  }

  if (previous.weight !== next.weight) {
    patch.weight = next.weight;
  }

  return patch;
};

export const hasExerciseEditPatch = (patch: ExerciseEditPatch): boolean =>
  Object.keys(patch).length > 0;
