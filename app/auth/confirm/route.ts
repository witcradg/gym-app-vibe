import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  console.log("[AUTH DEBUG] /auth/confirm route entered");
  console.log("[AUTH DEBUG] request url:", request.url);
  console.log(
    "[AUTH DEBUG] search params:",
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  console.log("[AUTH DEBUG] token_hash:", tokenHash);
  console.log("[AUTH DEBUG] type:", type);

  if (!tokenHash || type !== "email") {
    const redirectTarget = new URL("/?authError=magic_link", request.url);
    console.error("[AUTH DEBUG] missing token_hash or type; redirecting with error");
    console.log("[AUTH DEBUG] redirecting to:", redirectTarget.toString());
    return NextResponse.redirect(redirectTarget);
  }

  const supabase = await createClient();
  console.log("[AUTH DEBUG] calling verifyOtp with token_hash/type");
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  console.log("[AUTH DEBUG] verifyOtp data:", data);
  console.log("[AUTH DEBUG] verifyOtp error:", error);

  if (error) {
    const redirectTarget = new URL("/?authError=magic_link", request.url);
    // If this route logs but verify fails, the route logic or token/type handling is wrong.
    console.log("[AUTH DEBUG] redirecting to:", redirectTarget.toString());
    return NextResponse.redirect(redirectTarget);
  }

  const redirectTarget = new URL("/", request.url);
  console.log("[AUTH DEBUG] redirecting to:", redirectTarget.toString());
  return NextResponse.redirect(redirectTarget);
}
