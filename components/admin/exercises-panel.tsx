import type { Collection } from "@/types/collection";
import type { Exercise } from "@/types/exercise";

type ExercisesPanelProps = {
  selectedCollection: Collection | null;
  exercises: Exercise[];
  selectedExerciseId: string | null;
  loading: boolean;
  onSelectExercise: (exerciseId: string) => void;
  onCreateExercise: () => void;
  onDeleteExercise: (exerciseId: string) => void;
};

export function ExercisesPanel({
  selectedCollection,
  exercises,
  selectedExerciseId,
  loading,
  onSelectExercise,
  onCreateExercise,
  onDeleteExercise,
}: ExercisesPanelProps) {
  return (
    <section className="admin-panel" aria-label="Exercises">
      <div className="admin-panel__header">
        <div>
          <h2>Exercises</h2>
          <p>
            {selectedCollection
              ? `Manage exercises inside ${selectedCollection.name}.`
              : "Select a collection to manage its exercises."}
          </p>
        </div>
        <button
          type="button"
          className="admin-button admin-button--primary"
          onClick={onCreateExercise}
          disabled={!selectedCollection}
        >
          New Exercise
        </button>
      </div>

      {loading ? <p className="admin-empty-state">Loading exercises…</p> : null}

      {!loading && !selectedCollection ? (
        <p className="admin-empty-state">Select a collection to view exercises.</p>
      ) : null}

      {!loading && selectedCollection && exercises.length < 1 ? (
        <div className="admin-empty-state admin-empty-state--card">
          <p>No exercises in this collection yet.</p>
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={onCreateExercise}
          >
            New Exercise
          </button>
        </div>
      ) : null}

      {selectedCollection && exercises.length > 0 ? (
        <div className="admin-list" role="list">
          {exercises.map((exercise) => {
            const isSelected = exercise.id === selectedExerciseId;

            return (
              <div
                key={exercise.id}
                role="listitem"
                className={`admin-list-item admin-list-item--row${isSelected ? " is-selected" : ""}`}
              >
                <button
                  type="button"
                  className="admin-list-item__content"
                  onClick={() => onSelectExercise(exercise.id)}
                >
                  <span className="admin-list-item__title-row">
                    <span className="admin-list-item__title">
                      {exercise.order}. {exercise.name || "Untitled exercise"}
                    </span>
                    {isSelected ? (
                      <span className="admin-list-item__badge">Selected</span>
                    ) : null}
                  </span>
                  <span className="admin-list-item__meta">
                    {exercise.sets} sets
                    {exercise.reps ? ` • ${exercise.reps} reps` : ""}
                  </span>
                </button>
                <button
                  type="button"
                  className="admin-icon-button admin-icon-button--danger"
                  onClick={() => onDeleteExercise(exercise.id)}
                  aria-label={`Delete ${exercise.name || "exercise"}`}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
