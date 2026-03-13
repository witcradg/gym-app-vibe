"use server";

import type { PersistedAppState } from "../../data/exerciseState";
import { createAdminClient } from "../supabase";

const WORKOUT_APP_STATE_ID = "workout-app-state";

type WorkoutAppStateRow = {
  id: string;
  state: PersistedAppState;
  updated_at?: string;
};

export async function fetchWorkoutAppState(): Promise<PersistedAppState | null> {
  const { client, error: configError } = createAdminClient();
  if (!client || configError) {
    console.error("Supabase app state fetch misconfigured", configError);
    return null;
  }

  const { data, error } = await client
    .from("app_state")
    .select("id, state, updated_at")
    .eq("id", WORKOUT_APP_STATE_ID)
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
  const { client, error: configError } = createAdminClient();
  if (!client || configError) {
    return {
      ok: false,
      error: configError ?? "Supabase admin credentials are not set.",
    };
  }

  const { error } = await client.from("app_state").upsert(
    {
      id: WORKOUT_APP_STATE_ID,
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
