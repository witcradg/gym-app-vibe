type CollectionDraft = {
  id: string;
  name: string;
  description: string;
};

type CollectionEditorProps = {
  mode: "create" | "edit" | null;
  draft: CollectionDraft | null;
  loading: boolean;
  message: string | null;
  onChange: (field: "name" | "description", value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function CollectionEditor({
  mode,
  draft,
  loading,
  message,
  onChange,
  onSave,
  onCancel,
}: CollectionEditorProps) {
  return (
    <section className="admin-card" aria-label="Collection editor">
      <div className="admin-card__header">
        <div>
          <h3>{mode === "create" ? "New Collection" : "Collection Editor"}</h3>
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
        </div>
      )}
    </section>
  );
}
