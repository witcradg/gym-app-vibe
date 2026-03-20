import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  console.log("[AUTH DEBUG] /auth/callback route entered");
  console.log("[AUTH DEBUG] request url:", request.url);
  console.log("[AUTH DEBUG] search params:", Object.fromEntries(requestUrl.searchParams.entries()));
  console.log("[AUTH DEBUG] code:", code);

  if (!code) {
    const redirectTarget = new URL("/?authError=oauth_callback", requestUrl);
    console.error("[AUTH DEBUG] missing code; redirecting with error");
    console.log("[AUTH DEBUG] redirecting to:", redirectTarget.toString());
    return NextResponse.redirect(redirectTarget);
  }

  const supabase = await createClient();
  console.log("[AUTH DEBUG] calling exchangeCodeForSession");
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  console.log("[AUTH DEBUG] exchangeCodeForSession data:", data);
  console.log("[AUTH DEBUG] exchangeCodeForSession error:", error);

  if (error) {
    const redirectTarget = new URL("/?authError=oauth_callback", requestUrl);
    console.log("[AUTH DEBUG] redirecting to:", redirectTarget.toString());
    return NextResponse.redirect(redirectTarget);
  }

  const redirectTarget = new URL("/", requestUrl);
  console.log("[AUTH DEBUG] redirecting to:", redirectTarget.toString());
  return NextResponse.redirect(redirectTarget);
}
