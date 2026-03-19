import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CreateAdminClientResult =
  | { client: SupabaseClient; error: null }
  | { client: null; error: string };

export function createAdminClient(): CreateAdminClientResult {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url) {
    return {
      client: null,
      error: "Missing env var: NEXT_PUBLIC_SUPABASE_URL",
    };
  }

  if (!secretKey) {
    return {
      client: null,
      error:
        "Missing env var: SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)",
    };
  }

  return {
    client: createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
    error: null,
  };
}
