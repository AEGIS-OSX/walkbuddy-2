import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const title = "WalkBuddy — Trusted local dog walks, on your schedule.";
const description = "Vetted local walkers with photo and GPS recaps. Join early access for Austin and nearby cities.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "WalkBuddy",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "WalkBuddy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "var(--color-cta-bg)",
    },
  ],
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
          className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]"
        >
          <div className="mx-auto flex min-h-14 w-full max-w-[1120px] items-center justify-between gap-[var(--space-md)] px-[var(--space-md)] py-[var(--space-xs)] sm:px-[var(--space-lg)] lg:min-h-16 lg:px-[var(--space-xl)]">
            <a
              href="/"
              className="rounded-[var(--radius-round)] px-[var(--space-xs)] py-[var(--space-xxs)] font-[family-name:var(--font-display)] text-[length:var(--type-sm)] font-[var(--font-weight-bold)] leading-6 tracking-[-0.01em] text-[var(--color-text)] transition-colors duration-200 ease-out hover:bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              WalkBuddy
            </a>
            <div className="flex items-center justify-end gap-[var(--space-xs)] sm:gap-[var(--space-sm)]">
              <a
                href="#how-it-works"
                className="rounded-[var(--radius-round)] px-[var(--space-sm)] py-[var(--space-xs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-5 text-[var(--color-text)] transition-colors duration-200 ease-out hover:bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] sm:text-[length:var(--type-body)]"
              >
                How it works
              </a>
              <a
                href="#signup"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-5 text-[var(--color-cta-text)] shadow-[var(--elev-1)] transition-transform duration-200 ease-out hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] active:scale-[0.98] sm:min-h-12 sm:px-[var(--space-lg)] sm:text-[length:var(--type-body)]"
              >
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
