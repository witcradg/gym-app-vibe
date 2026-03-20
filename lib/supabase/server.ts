import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type CookieOptions = Parameters<CookieStore["set"]>[2];
type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where setting cookies may not be allowed.
        }
      },
    },
  });
}
