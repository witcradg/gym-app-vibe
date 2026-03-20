"use server";

import type { PersistedAppState } from "../../data/exerciseState";
import { createClient } from "./server";

const GYM_APP_STATE_ROW_ID = "gym-app-state";

type WorkoutAppStateRow = {
  id: string;
  state: PersistedAppState;
  updated_at?: string;
};

export async function fetchWorkoutAppState(): Promise<PersistedAppState | null> {
  const client = await createClient();

  const { data, error } = await client
    .from("gym_app_state")
    .select("id, state, updated_at")
    .eq("id", GYM_APP_STATE_ROW_ID)
    .maybeSingle();

  if (error) {
    console.error("Supabase app state fetch failed", error);
    return null;
  }

  const row = data as WorkoutAppStateRow | null;
  return row?.state ?? null;
}

export async function saveWorkoutAppState(
  state: PersistedAppState,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = await createClient();

  const { error } = await client.from("gym_app_state").upsert(
    {
      id: GYM_APP_STATE_ROW_ID,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function deleteWorkoutAppState(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const client = await createClient();

  const { error } = await client
    .from("gym_app_state")
    .delete()
    .eq("id", GYM_APP_STATE_ROW_ID);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
