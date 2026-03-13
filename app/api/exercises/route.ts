import { NextResponse } from "next/server";

import {
  fetchCollectionById,
  fetchExercises,
  upsertExercise,
} from "@/lib/supabase/workout-content";
import type { ExerciseRecordValues } from "@/types/workout-content-database";

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parsePositiveInt = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.floor(value);
    return normalized >= 1 ? normalized : null;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      return parsed;
    }
  }

  return null;
};

const parseExercisePayload = (
  payload: unknown,
): ExerciseRecordValues | { error: string } => {
  if (!payload || typeof payload !== "object") {
    return { error: "Request body must be an object." };
  }

  const record = payload as Record<string, unknown>;
  const id = normalizeString(record.id);
  const collectionId = normalizeString(record.collectionId);
  const name = normalizeString(record.name);
  const order = parsePositiveInt(record.order);
  const sets = parsePositiveInt(record.sets);

  if (!id) {
    return { error: "Exercise id is required." };
  }

  if (!collectionId) {
    return { error: "Exercise collectionId is required." };
  }

  if (!name) {
    return { error: "Exercise name is required." };
  }

  if (!order) {
    return { error: "Exercise order must be a positive integer." };
  }

  if (!sets) {
    return { error: "Exercise sets must be a positive integer." };
  }

  return {
    id,
    collectionId,
    name,
    order,
    sets,
    reps: typeof record.reps === "string" ? record.reps.trim() || undefined : undefined,
    weight:
      typeof record.weight === "string" ? record.weight.trim() || undefined : undefined,
    notes: typeof record.notes === "string" ? record.notes.trim() || undefined : undefined,
  };
};

export async function GET() {
  const exercises = await fetchExercises();
  return NextResponse.json({ exercises });
}

export async function POST(request: Request) {
  const payload = parseExercisePayload(await request.json().catch(() => null));

  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: 400 });
  }

  const collection = await fetchCollectionById(payload.collectionId);
  if (!collection) {
    return NextResponse.json(
      { error: "Exercise collectionId must reference an existing collection." },
      { status: 400 },
    );
  }

  const result = await upsertExercise(payload);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: result.recordId }, { status: 201 });
}
