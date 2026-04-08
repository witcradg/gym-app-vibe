"use client";

import { useActionState } from "react";

import { runExerciseImportTool } from "./actions";

const INITIAL_OUTPUT = "";

export function ExerciseImportPreviewClient() {
  const [csvOutput, formAction, isPending] = useActionState(
    runExerciseImportTool,
    INITIAL_OUTPUT,
  );

  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        padding: "1.5rem",
      }}
    >
      <form action={formAction}>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="submit"
            name="mode"
            value="preview"
            disabled={isPending}
            style={{
              minWidth: "9rem",
              padding: "0.75rem 1rem",
              font: "inherit",
              cursor: isPending ? "progress" : "pointer",
            }}
          >
            Run Preview
          </button>
          <button
            type="submit"
            name="mode"
            value="dry-run"
            disabled={isPending}
            style={{
              minWidth: "9rem",
              padding: "0.75rem 1rem",
              font: "inherit",
              cursor: isPending ? "progress" : "pointer",
            }}
          >
            Run Dry Run
          </button>
          <button
            type="submit"
            name="mode"
            value="updates"
            disabled={isPending}
            style={{
              minWidth: "9rem",
              padding: "0.75rem 1rem",
              font: "inherit",
              cursor: isPending ? "progress" : "pointer",
            }}
          >
            Run Updates
          </button>
        </div>
      </form>

      {csvOutput ? (
        <pre
          style={{
            margin: 0,
            overflowX: "auto",
            border: "1px solid #d0d7de",
            borderRadius: "0.75rem",
            padding: "1rem",
            background: "#f6f8fa",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {csvOutput}
        </pre>
      ) : null}
    </div>
  );
}
