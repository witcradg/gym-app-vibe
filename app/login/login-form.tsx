"use client";

import type { SubmitEventHandler } from "react";
import { useState } from "react";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { OAuthButton } from "@/components/auth/oauth-button";
import { signInWithMagicLink } from "@/lib/auth/sign-in-with-magic-link";
import { signInWithOAuth } from "@/lib/auth/sign-in-with-oauth";

type LoginFormProps = {
  initialMessage?: string;
};

export default function LoginForm({ initialMessage = "" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    setMessage("");

    const { error } = await signInWithMagicLink(email);

    if (error) {
      setMessage(error.message);
    } else {
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
