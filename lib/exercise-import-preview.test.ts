import { describe, expect, it, vi } from "vitest";

import {
  buildExerciseImportPreviewCsv,
  buildExerciseImportProcessCsv,
} from "./exercise-import-preview";

describe("buildExerciseImportPreviewCsv", () => {
  it("skips blank lines, trims fields, preserves order, and marks later duplicates", async () => {
    const lookup = vi.fn(async (name: string) => {
      if (name === "Standing Calf Raise") {
        return { id: "rec_123", collectionId: "legs" };
      }

      if (name === "Slide & Drag") {
        return null;
      }

      return { id: "fallback", collectionId: "misc" };
    });

    const csv = await buildExerciseImportPreviewCsv(
      [
        "",
        "  2| Standing Calf Raise                      |  ",
        "1&2| Slide & Drag                             |",
        "1&2| Slide & Drag                             |",
        "   ",
      ].join("\n"),
      lookup,
    );

    expect(csv).toBe(
      [
        "target,collection,name,id,msg",
        "2,legs,Standing Calf Raise,rec_123,",
        "1&2,,Slide & Drag,,MISSING",
        "1&2,,Slide & Drag,,DUPLICATE",
      ].join("\n"),
    );
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(lookup).toHaveBeenNthCalledWith(1, "Standing Calf Raise");
    expect(lookup).toHaveBeenNthCalledWith(2, "Slide & Drag");
  });

  it("keeps matched ids for invalid targets and escapes csv values", async () => {
    const csv = await buildExerciseImportPreviewCsv(
      '3| Press, "Strict" |\n',
      vi.fn(async () => ({
        id: 'rec_"42"',
        collectionId: "upper,body",
      })),
    );

    expect(csv).toBe(
      [
        "target,collection,name,id,msg",
        '3,"upper,body","Press, ""Strict""","rec_""42""",ERROR: INVALID_TARGET',
      ].join("\n"),
    );
  });

  it("marks lookup failures without crashing the run", async () => {
    const csv = await buildExerciseImportPreviewCsv(
      "2| Some Exercise |\n",
      vi.fn(async () => {
        throw new Error("boom");
      }),
    );

    expect(csv).toBe(
      [
        "target,collection,name,id,msg",
        "2,,Some Exercise,,ERROR: LOOKUP_FAILED",
      ].join("\n"),
    );
  });

  it("builds dry-run rows without writing and preserves input order", async () => {
    const lookup = vi.fn(async (name: string) => {
      if (name === "Day 1 Exercise") {
        return { id: "rec_day_1", collectionId: "legacy-a" };
      }

      if (name === "Shared Exercise") {
        return { id: "rec_shared", collectionId: "legacy-b" };
      }

      if (name === "Question Exercise") {
        return { id: "rec_question", collectionId: "legacy-c" };
      }

      return null;
    });
    const update = vi.fn(async () => undefined);

    const csv = await buildExerciseImportProcessCsv(
      [
        "1| Day 1 Exercise |",
        "1&2| Shared Exercise |",
        "?| Question Exercise |",
        "2| Missing Exercise |",
      ].join("\n"),
      "dry-run",
      lookup,
      update,
    );

    expect(csv).toBe(
      [
        "target,current_collection,next_collection,name,id,status,msg",
        "1,legacy-a,day-1,Day 1 Exercise,rec_day_1,WOULD_UPDATE,",
        "1&2,legacy-b,,Shared Exercise,rec_shared,SKIPPED,TARGET_1_AND_2_SKIPPED",
        "?,legacy-c,unassigned,Question Exercise,rec_question,WOULD_UPDATE,",
        "2,,,Missing Exercise,,MISSING,EXERCISE_NOT_FOUND",
      ].join("\n"),
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("runs updates for mapped targets and skips 1&2 rows", async () => {
    const lookup = vi.fn(async (name: string) => {
      if (name === "Day 2 Exercise") {
        return { id: "rec_day_2", collectionId: "legacy-a" };
      }

      if (name === "Question Exercise") {
        return { id: "rec_question", collectionId: "legacy-b" };
      }

      if (name === "Shared Exercise") {
        return { id: "rec_shared", collectionId: "legacy-c" };
      }

      return null;
    });
    const update = vi.fn(async () => undefined);

    const csv = await buildExerciseImportProcessCsv(
      [
        "2| Day 2 Exercise |",
        "?| Question Exercise |",
        "1&2| Shared Exercise |",
      ].join("\n"),
      "updates",
      lookup,
      update,
    );

    expect(csv).toBe(
      [
        "target,current_collection,next_collection,name,id,status,msg",
        "2,legacy-a,day-2,Day 2 Exercise,rec_day_2,UPDATED,",
        "?,legacy-b,unassigned,Question Exercise,rec_question,UPDATED,",
        "1&2,legacy-c,,Shared Exercise,rec_shared,SKIPPED,TARGET_1_AND_2_SKIPPED",
      ].join("\n"),
    );
    expect(update).toHaveBeenNthCalledWith(1, "rec_day_2", "day-2");
    expect(update).toHaveBeenNthCalledWith(2, "rec_question", "unassigned");
    expect(update).toHaveBeenCalledTimes(2);
  });

  it("stops after the first invalid target error", async () => {
    const lookup = vi.fn(async (name: string) => ({
      id: `id-${name}`,
      collectionId: "legacy",
    }));
    const update = vi.fn(async () => undefined);

    const csv = await buildExerciseImportProcessCsv(
      [
        "1| First Exercise |",
        "3| Invalid Exercise |",
        "2| Later Exercise |",
      ].join("\n"),
      "updates",
      lookup,
      update,
    );

    expect(csv).toBe(
      [
        "target,current_collection,next_collection,name,id,status,msg",
        "1,legacy,day-1,First Exercise,id-First Exercise,UPDATED,",
        "3,legacy,,Invalid Exercise,id-Invalid Exercise,ERROR,INVALID_TARGET",
      ].join("\n"),
    );
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith("id-First Exercise", "day-1");
  });

  it("stops after the first lookup failure or update failure", async () => {
    const lookupFailureCsv = await buildExerciseImportProcessCsv(
      [
        "1| Good Exercise |",
        "2| Broken Lookup |",
        "2| Later Exercise |",
      ].join("\n"),
      "dry-run",
      vi.fn(async (name: string) => {
        if (name === "Broken Lookup") {
          throw new Error("lookup failed");
        }

        return { id: `id-${name}`, collectionId: "legacy" };
      }),
      vi.fn(async () => undefined),
    );

    expect(lookupFailureCsv).toBe(
      [
        "target,current_collection,next_collection,name,id,status,msg",
        "1,legacy,day-1,Good Exercise,id-Good Exercise,WOULD_UPDATE,",
        "2,,,Broken Lookup,,ERROR,LOOKUP_FAILED",
      ].join("\n"),
    );

    const update = vi.fn(async (exerciseId: string) => {
      if (exerciseId === "id-Broken Update") {
        throw new Error("update failed");
      }
    });

    const updateFailureCsv = await buildExerciseImportProcessCsv(
      [
        "1| Good Exercise |",
        "2| Broken Update |",
        "2| Later Exercise |",
      ].join("\n"),
      "updates",
      vi.fn(async (name: string) => ({ id: `id-${name}`, collectionId: "legacy" })),
      update,
    );

    expect(updateFailureCsv).toBe(
      [
        "target,current_collection,next_collection,name,id,status,msg",
        "1,legacy,day-1,Good Exercise,id-Good Exercise,UPDATED,",
        "2,legacy,day-2,Broken Update,id-Broken Update,ERROR,UPDATE_FAILED",
      ].join("\n"),
    );
    expect(update).toHaveBeenCalledTimes(2);
  });
});
