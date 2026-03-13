"use server";

import { createAdminClient } from "../supabase";
import type { Collection } from "../../types/collection";
import type { Exercise } from "../../types/exercise";
import type {
  CollectionRow,
  CollectionRecordValues,
  ExerciseRow,
  ExerciseRecordValues,
  UpsertCollectionResult,
  UpsertExerciseResult,
  WorkoutContentPayload,
} from "../../types/workout-content-database";

const mapCollectionRow = (row: CollectionRow): Collection => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
});

const mapExerciseRow = (row: ExerciseRow): Exercise => ({
  id: row.id,
  collectionId: row.collection_id,
  name: row.name,
  order: row.order_index,
  sets: row.sets,
  reps: row.reps ?? undefined,
  weight: row.weight ?? undefined,
  notes: row.notes ?? undefined,
});

const toCollectionRow = (collection: Collection): CollectionRow => ({
  id: collection.id,
  name: collection.name,
  description: collection.description ?? null,
});

const toExerciseRow = (exercise: Exercise): ExerciseRow => ({
  id: exercise.id,
  collection_id: exercise.collectionId,
  name: exercise.name,
  order_index: exercise.order,
  sets: exercise.sets,
  reps: exercise.reps ?? null,
  weight: exercise.weight ?? null,
  notes: exercise.notes ?? null,
});

export async function fetchCollections(): Promise<Collection[]> {
  const { client, error: configError } = createAdminClient();
  if (!client || configError) {
    console.error("Supabase collections fetch misconfigured", configError);
    return [];
  }

  const { data, error } = await client
    .from("collections")
    .select("id, name, description")
    .order("name", { ascending: true });

  if (error) {
    console.error("Supabase collections fetch failed", error);
    return [];
  }

  return (data ?? []).map((row) => mapCollectionRow(row as CollectionRow));
}

export async function fetchExercises(): Promise<Exercise[]> {
  const { client, error: configError } = createAdminClient();
  if (!client || configError) {
    console.error("Supabase exercises fetch misconfigured", configError);
    return [];
  }

  const { data, error } = await client
    .from("exercises")
    .select("id, collection_id, name, order_index, sets, reps, weight, notes")
    .order("collection_id", { ascending: true })
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Supabase exercises fetch failed", error);
    return [];
  }

  return (data ?? []).map((row) => mapExerciseRow(row as ExerciseRow));
}

export async function fetchWorkoutContent(): Promise<WorkoutContentPayload> {
  const [collections, exercises] = await Promise.all([
    fetchCollections(),
    fetchExercises(),
  ]);

  return {
    collections,
    exercises,
    source: "supabase",
  };
}

export async function fetchWorkoutContentCounts(): Promise<{
  collectionsCount: number;
  exercisesCount: number;
}> {
  const { client, error: configError } = createAdminClient();
  if (!client || configError) {
    throw new Error(configError ?? "Supabase admin credentials are not set.");
  }

  const [{ count: collectionsCount, error: collectionsError }, { count: exercisesCount, error: exercisesError }] =
    await Promise.all([
      client.from("collections").select("*", { count: "exact", head: true }),
      client.from("exercises").select("*", { count: "exact", head: true }),
    ]);

  if (collectionsError) {
    throw new Error(`Collections read failed: ${collectionsError.message}`);
  }

  if (exercisesError) {
    throw new Error(`Exercises read failed: ${exercisesError.message}`);
  }

  return {
    collectionsCount: collectionsCount ?? 0,
    exercisesCount: exercisesCount ?? 0,
  };
}

export async function upsertCollection(
  collection: CollectionRecordValues,
): Promise<UpsertCollectionResult> {
  const { client, error: configError } = createAdminClient();
  if (!client || configError) {
    return {
      ok: false,
      error: configError ?? "Supabase admin credentials are not set.",
    };
  }

  const { data, error } = await client
    .from("collections")
    .upsert(toCollectionRow(collection), { onConflict: "id" })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, recordId: data.id };
}

export async function upsertExercise(
  exercise: ExerciseRecordValues,
): Promise<UpsertExerciseResult> {
  const { client, error: configError } = createAdminClient();
  if (!client || configError) {
    return {
      ok: false,
      error: configError ?? "Supabase admin credentials are not set.",
    };
  }

  const { data, error } = await client
    .from("exercises")
    .upsert(toExerciseRow(exercise), { onConflict: "id" })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, recordId: data.id };
}
