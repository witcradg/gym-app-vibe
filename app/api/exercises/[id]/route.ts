import { NextResponse } from "next/server";

import {
  fetchCollectionById,
  deleteExercise,
  fetchExerciseById,
  upsertExercise,
} from "@/lib/supabase/workout-content";

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const exercise = await fetchExerciseById(id);

  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found." }, { status: 404 });
  }

  return NextResponse.json({ exercise });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const existing = await fetchExerciseById(id);

  if (!existing) {
    return NextResponse.json({ error: "Exercise not found." }, { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const nextCollectionId = normalizeString(payload.collectionId) ?? existing.collectionId;
  const collection = await fetchCollectionById(nextCollectionId);
  if (!collection) {
    return NextResponse.json(
      { error: "Exercise collectionId must reference an existing collection." },
      { status: 400 },
    );
  }

  const result = await upsertExercise({
    id,
    collectionId: nextCollectionId,
    name: normalizeString(payload.name) ?? existing.name,
    order: parsePositiveInt(payload.order) ?? existing.order,
    sets: parsePositiveInt(payload.sets) ?? existing.sets,
    reps:
      payload.reps === null
        ? undefined
        : typeof payload.reps === "string"
          ? payload.reps.trim() || undefined
          : existing.reps,
    weight:
      payload.weight === null
        ? undefined
        : typeof payload.weight === "string"
          ? payload.weight.trim() || undefined
          : existing.weight,
    notes:
      payload.notes === null
        ? undefined
        : typeof payload.notes === "string"
          ? payload.notes.trim() || undefined
          : existing.notes,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: result.recordId });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await deleteExercise(id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
