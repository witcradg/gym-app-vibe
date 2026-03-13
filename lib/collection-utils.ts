import type { Collection } from "@/types/collection";

export const UNASSIGNED_COLLECTION_NAME = "Unassigned";

const normalizeCollectionName = (value: string) => value.trim().toLowerCase();

export function isUnassignedCollectionName(name: string): boolean {
  return normalizeCollectionName(name) ===
    normalizeCollectionName(UNASSIGNED_COLLECTION_NAME);
}

export function isUnassignedCollection(
  collection: Pick<Collection, "name"> | null | undefined,
): boolean {
  return Boolean(collection && isUnassignedCollectionName(collection.name));
}

export function findUnassignedCollection<T extends Pick<Collection, "name">>(
  collections: T[],
): T | null {
  return collections.find((collection) => isUnassignedCollectionName(collection.name)) ?? null;
}

export function sortCollectionsForDisplay<T extends Pick<Collection, "name" | "order">>(
  collections: T[],
): T[] {
  return [...collections].sort((left, right) => {
    const leftIsUnassigned = isUnassignedCollectionName(left.name);
    const rightIsUnassigned = isUnassignedCollectionName(right.name);

    if (leftIsUnassigned !== rightIsUnassigned) {
      return leftIsUnassigned ? 1 : -1;
    }

    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.name.localeCompare(right.name);
  });
}
