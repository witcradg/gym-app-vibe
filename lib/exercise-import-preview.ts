export type ExerciseImportPreviewLookupResult = {
  id: string;
  collectionId: string;
};

export type ExerciseImportPreviewLookup = (
  name: string,
) => Promise<ExerciseImportPreviewLookupResult | null>;

export type ExerciseImportCollectionUpdate = (
  exerciseId: string,
  collectionId: string,
) => Promise<void>;

type ParsedExerciseImportLine = {
  target: string;
  name: string;
};

type PhaseOneRow = {
  target: string;
  collection: string;
  name: string;
  id: string;
  msg: string;
};

type PhaseTwoRow = {
  target: string;
  currentCollection: string;
  nextCollection: string;
  name: string;
  id: string;
  status: "WOULD_UPDATE" | "UPDATED" | "SKIPPED" | "MISSING" | "ERROR";
  msg: string;
};

export type ExerciseImportProcessMode = "dry-run" | "updates";

const VALID_TARGETS = new Set(["1", "2", "1&2", "?"]);

const TARGET_COLLECTION_IDS: Record<string, string | null> = {
  "1": "day-1",
  "2": "day-2",
  "1&2": null,
  "?": "unassigned",
};

function parseExerciseImportLine(line: string): ParsedExerciseImportLine | null {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return null;
  }

  const [rawTarget = "", rawName = ""] = line.split("|");

  return {
    target: rawTarget.trim(),
    name: rawName.trim(),
  };
}

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }

  return value;
}

function toPhaseOneCsvRow(row: PhaseOneRow): string {
  return [row.target, row.collection, row.name, row.id, row.msg]
    .map(escapeCsvValue)
    .join(",");
}

function toPhaseTwoCsvRow(row: PhaseTwoRow): string {
  return [
    row.target,
    row.currentCollection,
    row.nextCollection,
    row.name,
    row.id,
    row.status,
    row.msg,
  ]
    .map(escapeCsvValue)
    .join(",");
}

function resolveNextCollectionId(target: string): string | null | "invalid" {
  if (!VALID_TARGETS.has(target)) {
    return "invalid";
  }

  return TARGET_COLLECTION_IDS[target];
}

export async function buildExerciseImportPreviewCsv(
  sourceText: string,
  lookupExerciseByExactName: ExerciseImportPreviewLookup,
): Promise<string> {
  const seenNames = new Set<string>();
  const rows: string[] = ["target,collection,name,id,msg"];

  for (const line of sourceText.split(/\r?\n/)) {
    const parsed = parseExerciseImportLine(line);

    if (!parsed) {
      continue;
    }

    const { target, name } = parsed;

    if (seenNames.has(name)) {
      rows.push(
        toPhaseOneCsvRow({
          target,
          collection: "",
          name,
          id: "",
          msg: "DUPLICATE",
        }),
      );
      continue;
    }

    seenNames.add(name);

    try {
      const match = await lookupExerciseByExactName(name);

      if (!match) {
        rows.push(
          toPhaseOneCsvRow({
            target,
            collection: "",
            name,
            id: "",
            msg: "MISSING",
          }),
        );
        continue;
      }

      rows.push(
        toPhaseOneCsvRow({
          target,
          collection: match.collectionId,
          name,
          id: match.id,
          msg: VALID_TARGETS.has(target) ? "" : "ERROR: INVALID_TARGET",
        }),
      );
    } catch {
      rows.push(
        toPhaseOneCsvRow({
          target,
          collection: "",
          name,
          id: "",
          msg: "ERROR: LOOKUP_FAILED",
        }),
      );
    }
  }

  return rows.join("\n");
}

export async function buildExerciseImportProcessCsv(
  sourceText: string,
  mode: ExerciseImportProcessMode,
  lookupExerciseByExactName: ExerciseImportPreviewLookup,
  updateExerciseCollectionId: ExerciseImportCollectionUpdate,
): Promise<string> {
  const rows: string[] = [
    "target,current_collection,next_collection,name,id,status,msg",
  ];

  for (const line of sourceText.split(/\r?\n/)) {
    const parsed = parseExerciseImportLine(line);

    if (!parsed) {
      continue;
    }

    const { target, name } = parsed;

    let match: ExerciseImportPreviewLookupResult | null;

    try {
      match = await lookupExerciseByExactName(name);
    } catch {
      rows.push(
        toPhaseTwoCsvRow({
          target,
          currentCollection: "",
          nextCollection: "",
          name,
          id: "",
          status: "ERROR",
          msg: "LOOKUP_FAILED",
        }),
      );
      break;
    }

    if (!match) {
      rows.push(
        toPhaseTwoCsvRow({
          target,
          currentCollection: "",
          nextCollection: "",
          name,
          id: "",
          status: "MISSING",
          msg: "EXERCISE_NOT_FOUND",
        }),
      );
      continue;
    }

    const nextCollectionId = resolveNextCollectionId(target);

    if (nextCollectionId === "invalid") {
      rows.push(
        toPhaseTwoCsvRow({
          target,
          currentCollection: match.collectionId,
          nextCollection: "",
          name,
          id: match.id,
          status: "ERROR",
          msg: "INVALID_TARGET",
        }),
      );
      break;
    }

    if (nextCollectionId === null) {
      rows.push(
        toPhaseTwoCsvRow({
          target,
          currentCollection: match.collectionId,
          nextCollection: "",
          name,
          id: match.id,
          status: "SKIPPED",
          msg: "TARGET_1_AND_2_SKIPPED",
        }),
      );
      continue;
    }

    if (mode === "dry-run") {
      rows.push(
        toPhaseTwoCsvRow({
          target,
          currentCollection: match.collectionId,
          nextCollection: nextCollectionId,
          name,
          id: match.id,
          status: "WOULD_UPDATE",
          msg: "",
        }),
      );
      continue;
    }

    try {
      await updateExerciseCollectionId(match.id, nextCollectionId);
      rows.push(
        toPhaseTwoCsvRow({
          target,
          currentCollection: match.collectionId,
          nextCollection: nextCollectionId,
          name,
          id: match.id,
          status: "UPDATED",
          msg: "",
        }),
      );
    } catch {
      rows.push(
        toPhaseTwoCsvRow({
          target,
          currentCollection: match.collectionId,
          nextCollection: nextCollectionId,
          name,
          id: match.id,
          status: "ERROR",
          msg: "UPDATE_FAILED",
        }),
      );
      break;
    }
  }

  return rows.join("\n");
}
