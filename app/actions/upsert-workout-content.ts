"use server";

import "server-only";

import {
  upsertCollection,
  upsertExercise,
} from "@/lib/supabase/workout-content";
import type {
  CollectionRecordValues,
  ExerciseRecordValues,
  UpsertCollectionResult,
  UpsertExerciseResult,
} from "@/types/workout-content-database";

export async function saveCollection(
  collection: CollectionRecordValues,
): Promise<UpsertCollectionResult> {
  return upsertCollection(collection);
}

export async function saveExercise(
  exercise: ExerciseRecordValues,
): Promise<UpsertExerciseResult> {
  return upsertExercise(exercise);
}
