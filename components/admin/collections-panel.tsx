import type { Collection } from "@/types/collection";
import { isUnassignedCollection } from "@/lib/collection-utils";

type CollectionsPanelProps = {
  collections: Collection[];
  selectedCollectionId: string | null;
  loading: boolean;
  onSelectCollection: (collectionId: string) => void;
  onCreateCollection: () => void;
  onEditCollection: () => void;
};

export function CollectionsPanel({
  collections,
  selectedCollectionId,
  loading,
  onSelectCollection,
  onCreateCollection,
  onEditCollection,
}: CollectionsPanelProps) {
  const selectedCollection = collections.find(
    (collection) => collection.id === selectedCollectionId,
  );

  return (
    <section className="admin-panel" aria-label="Collections">
      <div className="admin-panel__header">
        <div>
          <h2>Collections</h2>
          <p>Choose a workout grouping to manage its exercises.</p>
        </div>
        <button type="button" className="admin-button admin-button--primary" onClick={onCreateCollection}>
          New Collection
        </button>
      </div>

      <div className="admin-panel__toolbar">
        <button
          type="button"
          className="admin-button"
          onClick={onEditCollection}
          disabled={!selectedCollection}
        >
          Edit Collection
        </button>
      </div>

      {loading ? <p className="admin-empty-state">Loading collections…</p> : null}

      {!loading && collections.length < 1 ? (
        <p className="admin-empty-state">No collections yet. Create your first collection.</p>
      ) : null}

      {collections.length > 0 ? (
        <div className="admin-list" role="list">
          {collections.map((collection) => {
            const isSelected = collection.id === selectedCollectionId;

            return (
              <button
                key={collection.id}
                type="button"
                role="listitem"
                className={`admin-list-item${isSelected ? " is-selected" : ""}`}
                onClick={() => onSelectCollection(collection.id)}
              >
                <span className="admin-list-item__title-row">
                  <span className="admin-list-item__title">{collection.name}</span>
                  <span className="admin-list-item__badges">
                    {isUnassignedCollection(collection) ? (
                      <span className="admin-list-item__badge admin-list-item__badge--neutral">
                        System
                      </span>
                    ) : null}
                    {isSelected ? (
                      <span className="admin-list-item__badge">Selected</span>
                    ) : null}
                  </span>
                </span>
                <span className="admin-list-item__meta">
                  Order {collection.order}
                  {collection.description ? ` • ${collection.description}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
