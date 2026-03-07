import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gym App Vibe",
  description: "Minimal Next.js base app",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
