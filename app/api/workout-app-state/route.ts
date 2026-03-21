import { NextResponse } from "next/server";

import type { PersistedAppState } from "@/data/exerciseState";
import {
  fetchWorkoutAppState,
  saveWorkoutAppState,
} from "@/lib/supabase/workout-app-state";

export async function GET() {
  const state = await fetchWorkoutAppState();
  return NextResponse.json({ state });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | PersistedAppState
    | null;

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { ok: false, error: "Request body must be an object." },
      { status: 400 },
    );
  }

  const result = await saveWorkoutAppState(payload);

  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
