import { createBrowserClient } from "@supabase/ssr";

function requireEnv(value: string | undefined, message: string): string {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

const supabaseUrl = requireEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "Missing env var: NEXT_PUBLIC_SUPABASE_URL",
);

const supabasePublishableKey = requireEnv(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "Missing env var: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)",
);

export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
