"use client";

import { useRouter } from "next/navigation";

type CollectionOption = {
  id: string;
  name: string;
};

type CollectionSelectProps = {
  collections: CollectionOption[];
  selectedCollectionId: string | null;
};

export default function CollectionSelect({
  collections,
  selectedCollectionId,
}: CollectionSelectProps) {
  const router = useRouter();

  return (
    <label className="printable-page__select-label">
      <span>Collection</span>
      <select
        className="printable-page__select"
        value={selectedCollectionId ?? "all"}
        onChange={(event) => {
          const nextValue = event.target.value;
          const href =
            nextValue === "all"
              ? "/printable-exercises"
              : `/printable-exercises?collection=${encodeURIComponent(nextValue)}`;

          router.push(href);
        }}
      >
        <option value="all">All collections</option>
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.name}
          </option>
        ))}
      </select>
    </label>
  );
}
