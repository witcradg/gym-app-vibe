"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "./server";
import { sortCollectionsForDisplay } from "../collection-utils";
import type { Collection } from "../../types/collection";
import type { Exercise } from "../../types/exercise";
import type {
  CollectionRow,
  CollectionRecordValues,
  DeleteRecordResult,
  ExerciseRow,
  ExerciseRecordValues,
  UpsertCollectionResult,
  UpsertExerciseResult,
  WorkoutContentPayload,
} from "../../types/workout-content-database";

type WorkoutContentClient = SupabaseClient;

const mapCollectionRow = (row: CollectionRow): Collection => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  order: row.order_index,
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
  order_index: collection.order,
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

async function getAuthenticatedUserId(
  client: WorkoutContentClient,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const { data, error } = await client.auth.getUser();

  if (error) {
    return { ok: false, error: error.message };
  }

  const userId = data.user?.id ?? null;

  if (!userId) {
    return { ok: false, error: "Authenticated user is required." };
  }

  return { ok: true, userId };
}

export async function fetchCollectionsWithClient(
  client: WorkoutContentClient,
): Promise<Collection[]> {
  const { data, error: queryError } = await client
    .from("collections")
    .select("id, name, description, order_index")
    .order("order_index", { ascending: true })
    .order("name", { ascending: true });

  if (queryError) {
    console.error("Supabase collections fetch failed", queryError);
    return [];
  }

  return sortCollectionsForDisplay(
    (data ?? []).map((row) => mapCollectionRow(row as CollectionRow)),
  );
}

export async function fetchCollections(): Promise<Collection[]> {
  return fetchCollectionsWithClient(await createClient());
}

export async function fetchExercisesWithClient(
  client: WorkoutContentClient,
): Promise<Exercise[]> {
  const { data, error: queryError } = await client
    .from("exercises")
    .select("id, collection_id, name, order_index, sets, reps, weight, notes")
    .order("collection_id", { ascending: true })
    .order("order_index", { ascending: true });

  if (queryError) {
    console.error("Supabase exercises fetch failed", queryError);
    return [];
  }

  return (data ?? []).map((row) => mapExerciseRow(row as ExerciseRow));
}

export async function fetchExercises(): Promise<Exercise[]> {
  return fetchExercisesWithClient(await createClient());
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
  return fetchWorkoutContentCountsWithClient(await createClient());
}

export async function fetchWorkoutContentCountsWithClient(
  client: WorkoutContentClient,
): Promise<{
  collectionsCount: number;
  exercisesCount: number;
}> {
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
  const client = await createClient();
  const auth = await getAuthenticatedUserId(client);

  if (!auth.ok) {
    return auth;
  }

  return upsertCollectionWithClient(client, collection, auth.userId);
}

export async function upsertCollectionWithClient(
  client: WorkoutContentClient,
  collection: CollectionRecordValues,
  userId: string,
): Promise<UpsertCollectionResult> {
  const { data, error: queryError } = await client
    .from("collections")
    .upsert(
      {
        ...toCollectionRow(collection),
        user_id: userId,
      },
      { onConflict: "id" },
    )
    .select("id")
    .single();

  if (queryError) {
    return { ok: false, error: queryError.message };
  }

  if (!data) {
    return { ok: false, error: "Collection upsert returned no data." };
  }

  return { ok: true, recordId: data.id };
}

export async function createCollection(
  collection: CollectionRecordValues,
): Promise<UpsertCollectionResult> {
  const client = await createClient();
  const auth = await getAuthenticatedUserId(client);

  if (!auth.ok) {
    return auth;
  }

  return createCollectionWithClient(client, collection, auth.userId);
}

export async function createCollectionWithClient(
  client: WorkoutContentClient,
  collection: CollectionRecordValues,
  userId: string,
): Promise<UpsertCollectionResult> {
  const { data, error: queryError } = await client
    .from("collections")
    .insert({
      ...toCollectionRow(collection),
      user_id: userId,
    })
    .select("id")
    .single();

  if (queryError) {
    return { ok: false, error: queryError.message };
  }

  if (!data) {
    return { ok: false, error: "Collection create returned no data." };
  }

  return { ok: true, recordId: data.id };
}

export async function updateCollection(
  collection: CollectionRecordValues,
): Promise<UpsertCollectionResult> {
  return updateCollectionWithClient(await createClient(), collection);
}

export async function updateCollectionWithClient(
  client: WorkoutContentClient,
  collection: CollectionRecordValues,
): Promise<UpsertCollectionResult> {
  const { data, error: queryError } = await client
    .from("collections")
    .update(toCollectionRow(collection))
    .eq("id", collection.id)
    .select("id")
    .single();

  if (queryError) {
    return { ok: false, error: queryError.message };
  }

  if (!data) {
    return { ok: false, error: "Collection update returned no data." };
  }

  return { ok: true, recordId: data.id };
}

export async function upsertExercise(
  exercise: ExerciseRecordValues,
): Promise<UpsertExerciseResult> {
  const client = await createClient();
  const auth = await getAuthenticatedUserId(client);

  if (!auth.ok) {
    return auth;
  }

  return upsertExerciseWithClient(client, exercise, auth.userId);
}

export async function upsertExerciseWithClient(
  client: WorkoutContentClient,
  exercise: ExerciseRecordValues,
  userId: string,
): Promise<UpsertExerciseResult> {
  const { data, error: queryError } = await client
    .from("exercises")
    .upsert(
      {
        ...toExerciseRow(exercise),
        user_id: userId,
      },
      { onConflict: "id" },
    )
    .select("id")
    .single();

  if (queryError) {
    return { ok: false, error: queryError.message };
  }

  if (!data) {
    return { ok: false, error: "Exercise upsert returned no data." };
  }

  return { ok: true, recordId: data.id };
}

export async function createExercise(
  exercise: ExerciseRecordValues,
): Promise<UpsertExerciseResult> {
  const client = await createClient();
  const auth = await getAuthenticatedUserId(client);

  if (!auth.ok) {
    return auth;
  }

  return createExerciseWithClient(client, exercise, auth.userId);
}

export async function createExerciseWithClient(
  client: WorkoutContentClient,
  exercise: ExerciseRecordValues,
  userId: string,
): Promise<UpsertExerciseResult> {
  const { data, error: queryError } = await client
    .from("exercises")
    .insert({
      ...toExerciseRow(exercise),
      user_id: userId,
    })
    .select("id")
    .single();

  if (queryError) {
    return { ok: false, error: queryError.message };
  }

  if (!data) {
    return { ok: false, error: "Exercise create returned no data." };
  }

  return { ok: true, recordId: data.id };
}

export async function updateExercise(
  exercise: ExerciseRecordValues,
): Promise<UpsertExerciseResult> {
  return updateExerciseWithClient(await createClient(), exercise);
}

export async function updateExerciseWithClient(
  client: WorkoutContentClient,
  exercise: ExerciseRecordValues,
): Promise<UpsertExerciseResult> {
  const { data, error: queryError } = await client
    .from("exercises")
    .update(toExerciseRow(exercise))
    .eq("id", exercise.id)
    .select("id")
    .single();

  if (queryError) {
    return { ok: false, error: queryError.message };
  }

  if (!data) {
    return { ok: false, error: "Exercise update returned no data." };
  }

  return { ok: true, recordId: data.id };
}

export async function fetchCollectionById(
  id: string,
): Promise<Collection | null> {
  return fetchCollectionByIdWithClient(await createClient(), id);
}

export async function fetchCollectionByIdWithClient(
  client: WorkoutContentClient,
  id: string,
): Promise<Collection | null> {
  const { data, error: queryError } = await client
    .from("collections")
    .select("id, name, description, order_index")
    .eq("id", id)
    .maybeSingle();

  if (queryError) {
    console.error("Supabase collection fetch failed", queryError);
    return null;
  }

  return data ? mapCollectionRow(data as CollectionRow) : null;
}

export async function fetchExerciseById(id: string): Promise<Exercise | null> {
  return fetchExerciseByIdWithClient(await createClient(), id);
}

export async function fetchExerciseByIdWithClient(
  client: WorkoutContentClient,
  id: string,
): Promise<Exercise | null> {
  const { data, error: queryError } = await client
    .from("exercises")
    .select("id, collection_id, name, order_index, sets, reps, weight, notes")
    .eq("id", id)
    .maybeSingle();

  if (queryError) {
    console.error("Supabase exercise fetch failed", queryError);
    return null;
  }

  return data ? mapExerciseRow(data as ExerciseRow) : null;
}

export async function deleteCollection(id: string): Promise<DeleteRecordResult> {
  return deleteCollectionWithClient(await createClient(), id);
}

export async function deleteCollectionWithClient(
  client: WorkoutContentClient,
  id: string,
): Promise<DeleteRecordResult> {
  const { error: queryError } = await client.from("collections").delete().eq("id", id);

  if (queryError) {
    return { ok: false, error: queryError.message };
  }

  return { ok: true };
}

export async function reassignExercisesToCollection(
  sourceCollectionId: string,
  destinationCollectionId: string,
): Promise<DeleteRecordResult> {
  return reassignExercisesToCollectionWithClient(
    await createClient(),
    sourceCollectionId,
    destinationCollectionId,
  );
}

export async function reassignExercisesToCollectionWithClient(
  client: WorkoutContentClient,
  sourceCollectionId: string,
  destinationCollectionId: string,
): Promise<DeleteRecordResult> {
  const { error: queryError } = await client
    .from("exercises")
    .update({ collection_id: destinationCollectionId })
    .eq("collection_id", sourceCollectionId);

  if (queryError) {
    return { ok: false, error: queryError.message };
  }

  return { ok: true };
}

export async function deleteExercise(id: string): Promise<DeleteRecordResult> {
  return deleteExerciseWithClient(await createClient(), id);
}

export async function deleteExerciseWithClient(
  client: WorkoutContentClient,
  id: string,
): Promise<DeleteRecordResult> {
  const { error: queryError } = await client.from("exercises").delete().eq("id", id);

  if (queryError) {
    return { ok: false, error: queryError.message };
  }

  return { ok: true };
}
