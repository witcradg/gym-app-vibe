import { createClient } from "@/lib/supabase/client";

export async function signInWithMagicLink(email: string) {
  const supabase = createClient();
  const emailRedirectTo = `${window.location.origin}/auth/confirm`;

  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
    },
  });
}
