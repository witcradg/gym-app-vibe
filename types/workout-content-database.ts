import type { Collection } from "@/types/collection";
import type { Exercise } from "@/types/exercise";

export type CollectionRecordFields = {
  "Collection ID": string;
  Name: string;
  Description?: string;
};

export type ExerciseRecordFields = {
  "Exercise ID": string;
  "Collection ID": string;
  Name: string;
  Order: number;
  Sets: number;
  Reps?: string;
  Weight?: string;
  Notes?: string;
};

export type CollectionRecordValues = Collection & {
  recordId?: string;
};

export type ExerciseRecordValues = Exercise & {
  recordId?: string;
};

export type CollectionRow = {
  id: string;
  name: string;
  description: string | null;
};

export type ExerciseRow = {
  id: string;
  collection_id: string;
  name: string;
  order_index: number;
  sets: number;
  reps: string | null;
  weight: string | null;
  notes: string | null;
};

export type WorkoutContentPayload = {
  collections: Collection[];
  exercises: Exercise[];
  source: "supabase";
};

export type UpsertCollectionResult =
  | { ok: true; recordId: string }
  | { ok: false; error: string };

export type UpsertExerciseResult =
  | { ok: true; recordId: string }
  | { ok: false; error: string };

export type DeleteRecordResult =
  | { ok: true }
  | { ok: false; error: string };
