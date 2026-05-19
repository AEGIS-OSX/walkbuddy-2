import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "WalkBuddy — Trusted local dog walks",
  description: "WalkBuddy connects you with vetted local walkers in Austin, with photo and GPS proof. Pricing from $18–$25 per 30-minute walk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[var(--color-text)] antialiased">
        <nav aria-label="Primary" className="sticky top-0 z-40 bg-[var(--color-bg)]/95 backdrop-blur wb-border-b">
          <div className="wb-container h-14 flex items-center justify-between">
            <a href="/" aria-label="WalkBuddy" className="font-[var(--font-display)] font-semibold text-[var(--type-sm)] text-[var(--color-text)]">
              WalkBuddy
            </a>
            <div className="flex items-center gap-[var(--space-md)]">
              <a href="#how-it-works" className="text-[var(--color-text)] text-[var(--type-xs)]">
                How it works
              </a>
              <a href="#features" className="text-[var(--color-text)] text-[var(--type-xs)]">
                Features
              </a>
              <a href="#signup" className="text-[var(--color-text)] text-[var(--type-xs)]">
                Join the Waitlist
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
