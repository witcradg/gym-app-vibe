"use server";

import type { SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";

import type { PersistedAppState } from "../../data/exerciseState";
import { createClient } from "./server";

const GYM_APP_STATE_ROW_ID = "gym-app-state";

type WorkoutAppStateClient = BaseSupabaseClient;

type WorkoutAppStateRow = {
  id: string;
  user_id: string;
  state: PersistedAppState;
  updated_at?: string;
};

type WorkoutAppStateLogContext = {
  route: string;
  payloadSource: string;
};

type FetchWorkoutAppStateOptions = Partial<WorkoutAppStateLogContext>;

type SaveWorkoutAppStateOptions = Partial<WorkoutAppStateLogContext>;

const DEFAULT_LOG_CONTEXT: WorkoutAppStateLogContext = {
  route: "unknown",
  payloadSource: "unknown",
};

function countCheckedSets(setChecksByExercise: Record<string, boolean[]> | undefined) {
  return Object.values(setChecksByExercise ?? {}).reduce(
    (total, setChecks) => total + setChecks.filter(Boolean).length,
    0,
  );
}

function summarizeState(state: PersistedAppState | null | undefined, updatedAt?: string) {
  return {
    checkedCount: countCheckedSets(state?.setChecksByExercise),
    updatedAt: updatedAt ?? state?.updatedAt ?? null,
  };
}

function logWorkoutAppStateEvent(
  event: string,
  details: Record<string, unknown>,
  level: "info" | "error" = "info",
) {
  const payload = {
    scope: "gym_app_state",
    event,
    ...details,
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}

function resolveLogContext(options?: Partial<WorkoutAppStateLogContext>) {
  return {
    route: options?.route ?? DEFAULT_LOG_CONTEXT.route,
    payloadSource: options?.payloadSource ?? DEFAULT_LOG_CONTEXT.payloadSource,
  };
}

async function getAuthenticatedUserId(
  client: WorkoutAppStateClient,
  context: WorkoutAppStateLogContext,
) {
  const { data, error } = await client.auth.getUser();

  if (error) {
    logWorkoutAppStateEvent(
      "auth_lookup_error",
      {
        route: context.route,
        payloadSource: context.payloadSource,
        rowId: GYM_APP_STATE_ROW_ID,
        error: error.message,
      },
      "error",
    );
    return null;
  }

  const userId = data.user?.id ?? null;

  if (!userId) {
    logWorkoutAppStateEvent("auth_lookup_missing_user", {
      route: context.route,
      payloadSource: context.payloadSource,
      rowId: GYM_APP_STATE_ROW_ID,
      userId: null,
    });
  }

  return userId;
}

export async function fetchWorkoutAppState(
  options?: FetchWorkoutAppStateOptions,
): Promise<PersistedAppState | null> {
  const context = resolveLogContext(options);
  const client = await createClient();
  const userId = await getAuthenticatedUserId(client, context);

  return fetchWorkoutAppStateWithClient(client, userId, options);
}

export async function fetchWorkoutAppStateWithClient(
  client: WorkoutAppStateClient,
  userId: string | null,
  options?: FetchWorkoutAppStateOptions,
): Promise<PersistedAppState | null> {
  const context = resolveLogContext(options);

  logWorkoutAppStateEvent("read_start", {
    route: context.route,
    payloadSource: context.payloadSource,
    rowId: GYM_APP_STATE_ROW_ID,
    userId,
  });

  if (!userId) {
    logWorkoutAppStateEvent("read_result", {
      route: context.route,
      payloadSource: context.payloadSource,
      rowId: GYM_APP_STATE_ROW_ID,
      userId,
      found: false,
      ...summarizeState(null),
    });
    return null;
  }

  const { data, error } = await client
    .from("gym_app_state")
    .select("id, user_id, state, updated_at")
    .eq("id", GYM_APP_STATE_ROW_ID)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logWorkoutAppStateEvent(
      "read_error",
      {
        route: context.route,
        payloadSource: context.payloadSource,
        rowId: GYM_APP_STATE_ROW_ID,
        userId,
        error: error.message,
      },
      "error",
    );
    return null;
  }

  const row = data as WorkoutAppStateRow | null;
  logWorkoutAppStateEvent("read_result", {
    route: context.route,
    payloadSource: context.payloadSource,
    rowId: GYM_APP_STATE_ROW_ID,
    userId,
    found: row !== null,
    ...summarizeState(row?.state, row?.updated_at),
  });

  return row?.state ?? null;
}

export async function saveWorkoutAppState(
  state: PersistedAppState,
  options?: SaveWorkoutAppStateOptions,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const context = resolveLogContext(options);
  const client = await createClient();
  const userId = await getAuthenticatedUserId(client, context);

  return saveWorkoutAppStateWithClient(client, userId, state, options);
}

export async function saveWorkoutAppStateWithClient(
  client: WorkoutAppStateClient,
  userId: string | null,
  state: PersistedAppState,
  options?: SaveWorkoutAppStateOptions,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const context = resolveLogContext(options);

  logWorkoutAppStateEvent("write_start", {
    route: context.route,
    payloadSource: context.payloadSource,
    rowId: GYM_APP_STATE_ROW_ID,
    userId,
    ...summarizeState(state),
  });

  if (!userId) {
    const error = "Authenticated user is required to save workout app state";
    logWorkoutAppStateEvent(
      "write_error",
      {
        route: context.route,
        payloadSource: context.payloadSource,
        rowId: GYM_APP_STATE_ROW_ID,
        userId,
        error,
        ...summarizeState(state),
      },
      "error",
    );

    return {
      ok: false,
      error,
    };
  }

  const updatedAt = new Date().toISOString();
  const { error } = await client.from("gym_app_state").upsert(
    {
      id: GYM_APP_STATE_ROW_ID,
      user_id: userId,
      state,
      updated_at: updatedAt,
    },
    { onConflict: "id" },
  );

  if (error) {
    logWorkoutAppStateEvent(
      "write_error",
      {
        route: context.route,
        payloadSource: context.payloadSource,
        rowId: GYM_APP_STATE_ROW_ID,
        userId,
        error: error.message,
        ...summarizeState(state, updatedAt),
      },
      "error",
    );
    return { ok: false, error: error.message };
  }

  logWorkoutAppStateEvent("write_result", {
    route: context.route,
    payloadSource: context.payloadSource,
    rowId: GYM_APP_STATE_ROW_ID,
    userId,
    ok: true,
    ...summarizeState(state, updatedAt),
  });

  return { ok: true };
}

export async function deleteWorkoutAppState(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const context = resolveLogContext({
    route: "lib/supabase/workout-app-state.deleteWorkoutAppState",
    payloadSource: "delete",
  });
  const client = await createClient();
  const userId = await getAuthenticatedUserId(client, context);

  return deleteWorkoutAppStateWithClient(client, userId);
}

export async function deleteWorkoutAppStateWithClient(
  client: WorkoutAppStateClient,
  userId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!userId) {
    return {
      ok: false,
      error: "Authenticated user is required to delete workout app state",
    };
  }

  const { error } = await client
    .from("gym_app_state")
    .delete()
    .eq("id", GYM_APP_STATE_ROW_ID)
    .eq("user_id", userId);

  if (error) {
    console.error("Supabase app state delete failed", { userId, error });
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
