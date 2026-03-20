function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getSupabasePublishableKey(): string {
  const modern = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (modern) return modern;

  const legacy = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (legacy) return legacy;

  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)",
  );
}

export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: getSupabasePublishableKey(),
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
};
