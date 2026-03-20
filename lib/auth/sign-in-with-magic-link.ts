import { createClient } from "@/lib/supabase/client";

export async function signInWithMagicLink(email: string) {
  const supabase = createClient();
  const emailRedirectTo = `${window.location.origin}/auth/confirm`;
  const payload = {
    email,
    options: {
      emailRedirectTo,
    },
  };

  // If this logs `/auth/confirm` but the email link still points to `/?token_hash=...`,
  // the failure is outside this submit path and is likely in Supabase template rendering
  // or redirect allow-list behavior.
  console.log("[AUTH DEBUG] signInWithMagicLink called");
  console.log("[AUTH DEBUG] email:", email);
  console.log("[AUTH DEBUG] emailRedirectTo:", emailRedirectTo);
  console.log("[AUTH DEBUG] signInWithOtp payload:", payload);

  const result = await supabase.auth.signInWithOtp(payload);

  console.log("[AUTH DEBUG] signInWithOtp data:", result.data);
  console.log("[AUTH DEBUG] signInWithOtp error:", result.error);

  return result;
}
