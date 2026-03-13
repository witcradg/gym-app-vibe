import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CreateAdminClientResult =
  | { client: SupabaseClient; error: null }
  | { client: null; error: string };

export function createAdminClient(): CreateAdminClientResult {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return {
      client: null,
      error: "Supabase admin credentials are not set.",
    };
  }

  return {
    client: createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
    error: null,
  };
}
