import { sortCollectionsForDisplay } from "./collection-utils";
import type { Collection } from "../types/collection";
import type { Exercise } from "../types/exercise";

export type PrintableExerciseSection = {
  collection: Collection;
  exercises: Exercise[];
};

const sortExercisesWithinCollection = (exercises: Exercise[]) =>
  [...exercises].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.name.localeCompare(right.name);
  });

export function buildPrintableExerciseSections(
  collections: Collection[],
  exercises: Exercise[],
  selectedCollectionId: string | null,
): PrintableExerciseSection[] {
  const exercisesByCollectionId = new Map<string, Exercise[]>();

  for (const exercise of exercises) {
    const currentExercises = exercisesByCollectionId.get(exercise.collectionId) ?? [];
    currentExercises.push(exercise);
    exercisesByCollectionId.set(exercise.collectionId, currentExercises);
  }

  const visibleCollections = sortCollectionsForDisplay(collections).filter((collection) => {
    if (selectedCollectionId && collection.id !== selectedCollectionId) {
      return false;
    }

    return (exercisesByCollectionId.get(collection.id) ?? []).length > 0;
  });

  return visibleCollections.map((collection) => ({
    collection,
    exercises: sortExercisesWithinCollection(exercisesByCollectionId.get(collection.id) ?? []),
  }));
}
