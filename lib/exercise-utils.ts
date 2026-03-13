import type { Exercise } from "@/types/exercise";

export function getNextExerciseOrder(
  exercises: Exercise[],
  collectionId: string,
  excludedExerciseId?: string,
): number {
  return (
    exercises.reduce((currentMax, exercise) => {
      if (exercise.collectionId !== collectionId) {
        return currentMax;
      }

      if (excludedExerciseId && exercise.id === excludedExerciseId) {
        return currentMax;
      }

      return Math.max(currentMax, exercise.order);
    }, 0) + 1
  );
}
