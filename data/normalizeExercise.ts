import type { Exercise } from "./exercises";

export function normalizeExercise(ex: Exercise): Exercise {
	return {
		...ex,
		reps: ex.reps ?? "",
		weight: ex.weight ?? "",
		notes: ex.notes ?? "",
	};
}
