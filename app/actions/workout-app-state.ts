"use server";

import "server-only";

import type { PersistedAppState } from "@/data/exerciseState";
import {
  fetchWorkoutAppState,
  saveWorkoutAppState,
} from "@/lib/supabase/workout-app-state";

export async function fetchGymWorkoutAppState(): Promise<PersistedAppState | null> {
  return fetchWorkoutAppState();
}

export async function persistGymWorkoutAppState(
  state: PersistedAppState,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return saveWorkoutAppState(state);
}
