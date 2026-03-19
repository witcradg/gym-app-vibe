"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/confirm?next=/auth/success`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the magic link.");
    }

    setLoading(false);
  }

  return (
    <main className="auth-page">
      <header className="auth-page__header">
        <p className="auth-page__eyebrow">Gym App</p>
        <h1>Sign in</h1>
        <p>Use Google or a magic link to access the current workout prototype.</p>
      </header>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="auth-button auth-button--primary"
      >
        {loading ? "Loading..." : "Continue with Google"}
      </button>

      <form onSubmit={handleSubmit} className="auth-card">
        <div className="auth-card__header">
          <h2>Magic link</h2>
          <p>We'll email you a one-time sign-in link.</p>
        </div>

        <div className="auth-field">
          <label htmlFor="email" className="auth-field__label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-field__input"
            placeholder="you@example.com"
          />
        </div>

        <button type="submit" disabled={loading} className="auth-button">
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </form>

      {message ? <p className="auth-page__message">{message}</p> : null}
    </main>
  );
}
