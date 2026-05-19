import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "WalkBuddy — Trusted local dog walks",
  description:
    "WalkBuddy connects you with vetted local walkers in Austin, with photo and GPS proof. Pricing from $18–$25 per 30-minute walk.",
  metadataBase: new URL("https://walkbuddy.app"),
  openGraph: {
    title: "WalkBuddy — Trusted local dog walks",
    description:
      "Book vetted local dog walkers in Austin, with photo and GPS proof after every walk.",
    url: "https://walkbuddy.app",
    siteName: "WalkBuddy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WalkBuddy — Trusted local dog walks",
    description:
      "Book vetted local dog walkers in Austin, with photo and GPS proof after every walk.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[var(--color-text)] antialiased">
        <nav
          aria-label="Primary navigation"
          className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-md transition-colors duration-200 ease-out motion-reduce:transition-none"
        >
          <div className="wb-container flex min-h-12 items-center justify-between gap-[var(--space-md)] py-[var(--space-xs)]">
            <a
              href="/"
              aria-label="WalkBuddy home"
              className="font-[family-name:var(--font-display)] text-[var(--type-sm)] font-semibold tracking-[-0.01em] text-[var(--color-text)] transition-opacity duration-200 ease-out hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)] motion-reduce:transition-none"
            >
              WalkBuddy
            </a>

            <div className="flex items-center gap-[var(--space-xs)] sm:gap-[var(--space-sm)]">
              <a
                href="#owners"
                className="rounded-full px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--type-xs)] font-medium text-[var(--color-muted)] transition-colors duration-200 ease-out hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] motion-reduce:transition-none"
              >
                For owners
              </a>
              <a
                href="#walkers"
                className="rounded-full px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--type-xs)] font-medium text-[var(--color-muted)] transition-colors duration-200 ease-out hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] motion-reduce:transition-none"
              >
                For walkers
              </a>
            </div>
          </div>
        </nav>

        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
