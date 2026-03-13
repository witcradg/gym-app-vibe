type CollectionDraft = {
  id: string;
  name: string;
  description: string;
  order: number;
};

type CollectionEditorProps = {
  mode: "create" | "edit" | null;
  draft: CollectionDraft | null;
  loading: boolean;
  message: string | null;
  canDelete: boolean;
  deleteHelpText: string | null;
  deleteExerciseCount: number;
  deleteDestinationId: string;
  deleteDestinationOptions: Array<{ id: string; name: string }>;
  isDeleteConfirmOpen: boolean;
  onChange: (field: "name" | "description" | "order", value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onDeleteDestinationChange: (value: string) => void;
  onOpenDeleteConfirm: () => void;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: () => void;
};

export function CollectionEditor({
  mode,
  draft,
  loading,
  message,
  canDelete,
  deleteHelpText,
  deleteExerciseCount,
  deleteDestinationId,
  deleteDestinationOptions,
  isDeleteConfirmOpen,
  onChange,
  onSave,
  onCancel,
  onDeleteDestinationChange,
  onOpenDeleteConfirm,
  onCloseDeleteConfirm,
  onConfirmDelete,
}: CollectionEditorProps) {
  return (
    <section className="admin-card" aria-label="Collection editor">
      <div className="admin-card__header">
        <div>
          <h3>Collection Details</h3>
          <p>
            {mode === "create"
              ? "Create a collection without manually editing the id."
              : "Update the selected collection name and description."}
          </p>
        </div>
      </div>

      {!draft ? (
        <p className="admin-empty-state">
          Select a collection or create a new one to edit its details.
        </p>
      ) : (
        <div className="admin-form">
          <label className="admin-field">
            <span>Name</span>
            <input
              type="text"
              value={draft.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Upper Body"
            />
          </label>

          <label className="admin-field">
            <span>Display Order</span>
            <input
              type="number"
              min={1}
              step={1}
              value={String(draft.order)}
              onChange={(event) => onChange("order", event.target.value)}
              placeholder="1"
            />
          </label>

          <label className="admin-field">
            <span>Description</span>
            <textarea
              rows={4}
              value={draft.description}
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="Optional description"
            />
          </label>

          {message ? <p className="admin-inline-message">{message}</p> : null}

          <div className="admin-actions">
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={onSave}
              disabled={loading}
            >
              {mode === "create" ? "Create Collection" : "Save Collection"}
            </button>
            <button
              type="button"
              className="admin-button"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>

          {mode === "edit" ? (
            <div className="admin-danger-zone">
              <div className="admin-danger-zone__header">
                <div>
                  <h4>Delete Collection</h4>
                  <p>
                    {deleteExerciseCount > 0
                      ? "Delete this collection and move its exercises to another collection."
                      : "Delete this collection. No exercises are currently assigned to it."}
                  </p>
                </div>
              </div>

              {deleteHelpText ? (
                <p className="admin-inline-message">{deleteHelpText}</p>
              ) : null}

              {canDelete && isDeleteConfirmOpen ? (
                <>
                  <label className="admin-field">
                    <span>Move Exercises To</span>
                    <select
                      value={deleteDestinationId}
                      onChange={(event) => onDeleteDestinationChange(event.target.value)}
                      disabled={loading}
                    >
                      {deleteDestinationOptions.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <p className="admin-inline-message">
                    This will delete the collection and move its exercises to the selected
                    destination.
                  </p>

                  <div className="admin-actions">
                    <button
                      type="button"
                      className="admin-button admin-button--danger"
                      onClick={onConfirmDelete}
                      disabled={loading || !deleteDestinationId}
                    >
                      Delete and Move Exercises
                    </button>
                    <button
                      type="button"
                      className="admin-button"
                      onClick={onCloseDeleteConfirm}
                      disabled={loading}
                    >
                      Cancel Delete
                    </button>
                  </div>
                </>
              ) : null}

              {canDelete && !isDeleteConfirmOpen ? (
                <button
                  type="button"
                  className="admin-button admin-button--danger"
                  onClick={onOpenDeleteConfirm}
                  disabled={loading}
                >
                  Delete Collection
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
