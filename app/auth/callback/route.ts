import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    const redirectTarget = new URL("/?authError=oauth_callback", requestUrl);
    return NextResponse.redirect(redirectTarget);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const redirectTarget = new URL("/?authError=oauth_callback", requestUrl);
    return NextResponse.redirect(redirectTarget);
  }

  return NextResponse.redirect(new URL("/", requestUrl));
}
