import { NextResponse } from "next/server";

import type { PersistedAppState } from "@/data/exerciseState";
import {
  deleteWorkoutAppState,
  fetchWorkoutAppState,
  saveWorkoutAppState,
} from "@/lib/supabase/workout-app-state";

const getPayloadSource = (request: Request, fallback: string) =>
  request.headers.get("x-gym-app-payload-source") ?? fallback;

export async function GET(request: Request) {
  const route = new URL(request.url).pathname;
  const state = await fetchWorkoutAppState({
    route,
    payloadSource: getPayloadSource(request, "client-rehydrate"),
  });
  return NextResponse.json({ state });
}

export async function POST(request: Request) {
  const route = new URL(request.url).pathname;
  const payload = (await request.json().catch(() => null)) as
    | PersistedAppState
    | null;

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { ok: false, error: "Request body must be an object." },
      { status: 400 },
    );
  }

  const result = await saveWorkoutAppState(payload, {
    route,
    payloadSource: getPayloadSource(request, "client-persist"),
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}

export async function DELETE() {
  const result = await deleteWorkoutAppState();

  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
