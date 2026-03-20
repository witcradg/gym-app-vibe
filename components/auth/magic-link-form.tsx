import type { SubmitEventHandler } from "react";

type MagicLinkFormProps = {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  disabled?: boolean;
  submitLabel: string;
};

export function MagicLinkForm({
  email,
  onEmailChange,
  onSubmit,
  disabled = false,
  submitLabel,
}: MagicLinkFormProps) {
  return (
    <form onSubmit={onSubmit} className="auth-card">
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
          onChange={(e) => onEmailChange(e.target.value)}
          required
          className="auth-field__input"
          placeholder="you@example.com"
        />
      </div>

      <button type="submit" disabled={disabled} className="auth-button">
        {submitLabel}
      </button>
    </form>
  );
}
