"use server";

import "server-only";

import { fetchWorkoutContent } from "@/lib/supabase/workout-content";
import type { WorkoutContentPayload } from "@/types/workout-content-database";

export async function fetchGymWorkoutContent(): Promise<WorkoutContentPayload> {
  return fetchWorkoutContent();
}
