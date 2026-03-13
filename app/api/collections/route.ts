import { NextResponse } from "next/server";

import { fetchCollections, upsertCollection } from "@/lib/supabase/workout-content";
import type { CollectionRecordValues } from "@/types/workout-content-database";

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseCollectionPayload = (
  payload: unknown,
): CollectionRecordValues | { error: string } => {
  if (!payload || typeof payload !== "object") {
    return { error: "Request body must be an object." };
  }

  const id = normalizeString((payload as Record<string, unknown>).id);
  const name = normalizeString((payload as Record<string, unknown>).name);
  const rawDescription = (payload as Record<string, unknown>).description;

  if (!id) {
    return { error: "Collection id is required." };
  }

  if (!name) {
    return { error: "Collection name is required." };
  }

  return {
    id,
    name,
    description:
      typeof rawDescription === "string" ? rawDescription.trim() || undefined : undefined,
  };
};

export async function GET() {
  const collections = await fetchCollections();
  return NextResponse.json({ collections });
}

export async function POST(request: Request) {
  const payload = parseCollectionPayload(await request.json().catch(() => null));

  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: 400 });
  }

  const result = await upsertCollection(payload);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: result.recordId }, { status: 201 });
}
