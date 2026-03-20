import { createClient } from "@/lib/supabase/client";

export type OAuthProvider = "google";

export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback`;

  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });
}
