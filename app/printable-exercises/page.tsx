import Link from "next/link";

import { fetchGymWorkoutContent } from "@/app/actions/fetch-workout-content";
import LoginForm from "@/app/login/login-form";
import CollectionSelect from "@/components/printable/collection-select";
import PrintButton from "@/components/printable/print-button";
import { createClient } from "@/lib/supabase/server";
import { buildPrintableExerciseSections } from "@/lib/printable-exercises";

type PrintableExercisesPageProps = {
  searchParams?: Promise<{
    collection?: string;
  }>;
};

const formatPlanSummary = (sets: number, reps?: string, weight?: string) => {
  const repsValue = reps?.trim() || "-";
  const weightValue = weight?.trim() || "-";

  return `${sets} x ${repsValue} @ ${weightValue}`;
};

export default async function PrintableExercisesPage({
  searchParams,
}: PrintableExercisesPageProps) {
  const supabase = await createClient();
  const params = searchParams ? await searchParams : undefined;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LoginForm />;
  }

  const { collections, exercises } = await fetchGymWorkoutContent();
  const requestedCollectionId = params?.collection?.trim() || null;
  const selectedCollectionId =
    requestedCollectionId &&
    requestedCollectionId !== "all" &&
    collections.some((collection) => collection.id === requestedCollectionId)
      ? requestedCollectionId
      : null;
  const sections = buildPrintableExerciseSections(
    collections,
    exercises,
    selectedCollectionId,
  );
  const selectedCollectionName =
    selectedCollectionId
      ? collections.find((collection) => collection.id === selectedCollectionId)?.name ?? null
      : null;

  return (
    <main className="printable-page">
      <header className="printable-page__header">
        <div>
          <p className="printable-page__eyebrow">Printable</p>
          <h1>Exercise Lists</h1>
          <p>
            Print one collection or everything across all collections. Sorting can be added later.
          </p>
        </div>
        <div className="printable-page__actions">
          <Link href="/" className="printable-page__link">
            Back to workout
          </Link>
        </div>
      </header>

      <section className="printable-page__filters" aria-label="Printable exercise filters">
        <CollectionSelect
          collections={collections.map((collection) => ({
            id: collection.id,
            name: collection.name,
          }))}
          selectedCollectionId={selectedCollectionId}
        />
        <PrintButton />
      </section>

      <section className="printable-page__summary" aria-label="Printable list summary">
        <p>
          {selectedCollectionName
            ? `${selectedCollectionName}: ${sections[0]?.exercises.length ?? 0} exercises`
            : `${sections.reduce((total, section) => total + section.exercises.length, 0)} exercises across ${sections.length} collections`}
        </p>
      </section>

      <div className="printable-page__content">
        {sections.length > 0 ? (
          sections.map((section) => (
            <section
              key={section.collection.id}
              className="printable-section"
              aria-label={`${section.collection.name} exercises`}
            >
              <header className="printable-section__header">
                <h2>{section.collection.name}</h2>
                <p>{section.exercises.length} exercises</p>
              </header>

              <ol className="printable-section__list">
                {section.exercises.map((exercise) => (
                  <li key={exercise.id} className="printable-exercise">
                    <div className="printable-exercise__row">
                      <h3>{exercise.name}</h3>
                      <p>{formatPlanSummary(exercise.sets, exercise.reps, exercise.weight)}</p>
                    </div>
                    {exercise.notes?.trim() ? (
                      <p className="printable-exercise__notes">{exercise.notes.trim()}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ))
        ) : (
          <section className="printable-page__empty">
            <h2>No exercises found</h2>
            <p>There are no exercises available for this printable list yet.</p>
          </section>
        )}
      </div>
    </main>
  );
}
