import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const next = searchParams.get("next") ?? "/";
  const type = searchParams.get("type") ?? "email";

  if (tokenHash) {
    const supabase = await createClient();
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email",
    });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
