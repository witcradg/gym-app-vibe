"use server";

import "server-only";

import type { PersistedAppState } from "@/data/exerciseState";
import { fetchWorkoutAppState } from "@/lib/supabase/workout-app-state";

export async function fetchGymWorkoutAppState(): Promise<PersistedAppState | null> {
  return fetchWorkoutAppState();
}
