type OAuthButtonProps = {
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  primary?: boolean;
};

export function OAuthButton({
  label,
  onClick,
  disabled = false,
  primary = false,
}: OAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`auth-button${primary ? " auth-button--primary" : ""}`}
    >
      {label}
    </button>
  );
}
