"use client";

import type { SubmitEventHandler } from "react";
import { useEffect, useState } from "react";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { OAuthButton } from "@/components/auth/oauth-button";
import { createClient } from "@/lib/supabase/client";
import { signInWithMagicLink } from "@/lib/auth/sign-in-with-magic-link";
import { signInWithOAuth } from "@/lib/auth/sign-in-with-oauth";

type LoginFormProps = {
  initialMessage?: string;
};

export default function LoginForm({ initialMessage = "" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function probeSession() {
      console.log("[AUTH DEBUG] Root auth probe current URL:", window.location.href);
      console.log("[AUTH DEBUG] Root auth probe search params:", window.location.search);

      const sessionResult = await supabase.auth.getSession();

      // If `/auth/confirm` never logs after the email click, the email link is wrong.
      // If `verifyOtp` succeeds but `/` still shows this login UI and this session probe is empty,
      // session persistence or cookie propagation is failing.
      console.log("[AUTH DEBUG] Root auth probe session:", sessionResult);
    }

    void probeSession();
  }, []);

  async function handleGoogleLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await signInWithOAuth("google");

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    console.log("[AUTH DEBUG] magic-link submit handler entered");
    console.log("[AUTH DEBUG] email state before submit:", email);
    setLoading(true);
    setMessage("");

    const { data, error } = await signInWithMagicLink(email);

    console.log("[AUTH DEBUG] submit result data:", data);
    console.log("[AUTH DEBUG] submit result error:", error);

    if (error) {
      console.error("[AUTH DEBUG] UI setting error message");
      setMessage(error.message);
    } else {
      console.log("[AUTH DEBUG] UI setting success message");
      setMessage("Check your email for the magic link.");
    }

    setLoading(false);
  };

  return (
    <main className="auth-page">
      <header className="auth-page__header">
        <p className="auth-page__eyebrow">Gym App</p>
        <h1>Sign in</h1>
        <p>Use Google or a magic link to access the current workout prototype.</p>
      </header>

      <OAuthButton
        label={loading ? "Loading..." : "Continue with Google"}
        onClick={handleGoogleLogin}
        disabled={loading}
        primary
      />

      <MagicLinkForm
        email={email}
        onEmailChange={setEmail}
        onSubmit={handleSubmit}
        disabled={loading}
        submitLabel={loading ? "Sending..." : "Send magic link"}
      />

      {message ? <p className="auth-page__message">{message}</p> : null}
    </main>
  );
}
