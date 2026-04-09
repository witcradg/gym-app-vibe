"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      className="printable-page__print-button"
      onClick={() => window.print()}
    >
      Print list
    </button>
  );
}
