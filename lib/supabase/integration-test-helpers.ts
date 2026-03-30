import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "../supabase";

export function loadLocalEnvFile() {
  const envPath = join(process.cwd(), ".env.local");
  const fileContents = readFileSync(envPath, "utf8");

  for (const rawLine of fileContents.split("\n")) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex < 1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const rawValue = line.slice(equalsIndex + 1).trim();
    const unquotedValue =
      rawValue.startsWith('"') && rawValue.endsWith('"')
        ? rawValue.slice(1, -1)
        : rawValue;

    if (!process.env[key]) {
      process.env[key] = unquotedValue;
    }
  }
}

export function createIntegrationTestClient(): SupabaseClient {
  loadLocalEnvFile();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const accessToken = process.env.SUPABASE_INTEGRATION_TEST_ACCESS_TOKEN?.trim();

  if (url && publishableKey && accessToken) {
    return createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  const result = createAdminClient();
  if (result.error || !result.client) {
    throw new Error(result.error ?? "Supabase admin client could not be created.");
  }

  return result.client;
}

async function authenticateWithRefreshToken(
  client: SupabaseClient,
  refreshToken: string,
): Promise<void> {
  const { data, error } = await client.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    throw new Error(`Supabase refresh session failed: ${error.message}`);
  }

  if (!data.session?.access_token) {
    throw new Error("Supabase refresh session returned no access token.");
  }
}

export async function createAuthenticatedIntegrationTestClient(): Promise<SupabaseClient> {
  const client = createIntegrationTestClient();
  const refreshToken = process.env.SUPABASE_INTEGRATION_TEST_REFRESH_TOKEN?.trim();

  if (refreshToken) {
    await authenticateWithRefreshToken(client, refreshToken);
  }

  return client;
}

async function findUserIdInTable(
  client: SupabaseClient,
  table: "gym_app_state" | "collections" | "exercises",
): Promise<string | null> {
  const { data, error } = await client
    .from(table)
    .select("user_id")
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return typeof data?.user_id === "string" ? data.user_id : null;
}

export async function resolveIntegrationTestUserId(
  client: SupabaseClient,
): Promise<string> {
  const explicitUserId = process.env.SUPABASE_INTEGRATION_TEST_USER_ID?.trim();
  if (explicitUserId) {
    return explicitUserId;
  }

  const authResult = await client.auth.getUser();
  const tokenUserId = authResult.data.user?.id ?? null;
  if (tokenUserId) {
    return tokenUserId;
  }

  const userListResult = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
  const firstUserId = userListResult.data?.users[0]?.id ?? null;
  if (firstUserId) {
    return firstUserId;
  }

  const tables: Array<"gym_app_state" | "collections" | "exercises"> = [
    "gym_app_state",
    "collections",
    "exercises",
  ];

  for (const table of tables) {
    const userId = await findUserIdInTable(client, table);
    if (userId) {
      return userId;
    }
  }

  throw new Error(
    "Could not resolve a Supabase integration test user id. Set SUPABASE_INTEGRATION_TEST_USER_ID in .env.local.",
  );
}
