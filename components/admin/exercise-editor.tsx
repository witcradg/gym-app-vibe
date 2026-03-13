import type { Collection } from "@/types/collection";

type ExerciseDraft = {
  id: string;
  collectionId: string;
  name: string;
  order: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
};

type ExerciseEditorProps = {
  collections: Collection[];
  draft: ExerciseDraft | null;
  mode: "create" | "edit" | null;
  loading: boolean;
  message: string | null;
  onChange: (
    field: "collectionId" | "name" | "order" | "sets" | "reps" | "weight" | "notes",
    value: string,
  ) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

export function ExerciseEditor({
  collections,
  draft,
  mode,
  loading,
  message,
  onChange,
  onSave,
  onDelete,
  onCancel,
}: ExerciseEditorProps) {
  return (
    <section className="admin-card" aria-label="Exercise editor">
      <div className="admin-card__header">
        <div>
          <h3>Exercise Details</h3>
          <p>
            {mode === "create"
              ? "Create an exercise inside the selected collection."
              : "Update exercise fields, order, and collection assignment."}
          </p>
        </div>
      </div>

      {!draft ? (
        <p className="admin-empty-state">
          Select an exercise or create a new one to edit it.
        </p>
      ) : (
        <div className="admin-form">
          <label className="admin-field">
            <span>Name</span>
            <input
              type="text"
              value={draft.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Bench Press"
            />
          </label>

          <div className="admin-grid admin-grid--two">
            <label className="admin-field">
              <span>Collection</span>
              <select
                value={draft.collectionId}
                onChange={(event) => onChange("collectionId", event.target.value)}
              >
                <option value="">Select a collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Order</span>
              <input
                type="number"
                min="1"
                step="1"
                value={draft.order}
                onChange={(event) => onChange("order", event.target.value)}
              />
            </label>
          </div>

          <div className="admin-grid admin-grid--two">
            <label className="admin-field">
              <span>Sets</span>
              <input
                type="number"
                min="1"
                step="1"
                value={draft.sets}
                onChange={(event) => onChange("sets", event.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Reps</span>
              <input
                type="text"
                value={draft.reps}
                onChange={(event) => onChange("reps", event.target.value)}
                placeholder="8-10"
              />
            </label>
          </div>

          <label className="admin-field">
            <span>Weight</span>
            <input
              type="text"
              value={draft.weight}
              onChange={(event) => onChange("weight", event.target.value)}
              placeholder="25 lbs"
            />
          </label>

          <label className="admin-field">
            <span>Notes</span>
            <textarea
              rows={6}
              value={draft.notes}
              onChange={(event) => onChange("notes", event.target.value)}
              placeholder="Optional notes"
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
              {mode === "create" ? "Create Exercise" : "Save Exercise"}
            </button>
            <button
              type="button"
              className="admin-button"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            {mode === "edit" ? (
              <button
                type="button"
                className="admin-button admin-button--danger"
                onClick={onDelete}
                disabled={loading}
              >
                Delete Exercise
              </button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
