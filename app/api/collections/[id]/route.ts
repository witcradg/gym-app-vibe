import { NextResponse } from "next/server";

import {
  deleteCollection,
  fetchCollectionById,
  upsertCollection,
} from "@/lib/supabase/workout-content";

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const collection = await fetchCollectionById(id);

  if (!collection) {
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }

  return NextResponse.json({ collection });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const existing = await fetchCollectionById(id);

  if (!existing) {
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const name = normalizeString(payload.name) ?? existing.name;
  const description =
    payload.description === null
      ? undefined
      : typeof payload.description === "string"
        ? payload.description.trim() || undefined
        : existing.description;

  const result = await upsertCollection({
    id,
    name,
    order:
      typeof payload.order === "number" &&
      Number.isInteger(payload.order) &&
      payload.order >= 1
        ? payload.order
        : existing.order,
    description,
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
  const result = await deleteCollection(id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
