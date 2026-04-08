"use server";

import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  buildExerciseImportPreviewCsv,
  buildExerciseImportProcessCsv,
} from "@/lib/exercise-import-preview";
import {
  fetchExerciseImportPreviewMatchByName,
  updateExerciseCollectionIdById,
} from "@/lib/supabase/workout-content";

type ExerciseImportActionMode = "preview" | "dry-run" | "updates";

async function readExerciseImportSourceFile(): Promise<string> {
  const sourcePath = path.join(process.cwd(), "data", "numbered-exercise-list.txt");
  return readFile(sourcePath, "utf8");
}

function parseActionMode(formData: FormData): ExerciseImportActionMode {
  const mode = formData.get("mode");

  if (mode === "dry-run" || mode === "updates") {
    return mode;
  }

  return "preview";
}

export async function runExerciseImportTool(
  _previousState: string,
  formData: FormData,
): Promise<string> {
  const mode = parseActionMode(formData);
  const sourceText = await readExerciseImportSourceFile();

  if (mode === "preview") {
    return buildExerciseImportPreviewCsv(
      sourceText,
      fetchExerciseImportPreviewMatchByName,
    );
  }

  return buildExerciseImportProcessCsv(
    sourceText,
    mode,
    fetchExerciseImportPreviewMatchByName,
    async (exerciseId, collectionId) => {
      const result = await updateExerciseCollectionIdById(exerciseId, collectionId);

      if (!result.ok) {
        throw new Error(result.error);
      }
    },
  );
}
