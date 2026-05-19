import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const title = "WalkBuddy — Trusted local dog walks";
const description = "Vetted local walkers with photo and GPS proof. Join early access in Austin.";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[var(--color-text)] antialiased">
        <nav
          role="navigation"
          aria-label="Primary"
          className="sticky top-0 z-50 h-14 border-b border-[var(--color-border)] bg-[var(--color-bg)] lg:h-16"
        >
          <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between px-[var(--space-md)] sm:px-[var(--space-lg)] lg:px-[var(--space-xl)]">
            <span className="font-[family-name:var(--font-display)] text-[length:var(--type-sm)] font-[var(--font-weight-bold)] leading-6 tracking-[-0.01em] text-[var(--color-text)]">
              WalkBuddy
            </span>
            <div className="flex items-center gap-[var(--space-xs)] sm:gap-[var(--space-md)]">
              <a
                href="#how-it-works"
                className="rounded-[var(--radius-round)] px-[var(--space-sm)] py-[var(--space-xs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-5 text-[var(--color-text)] transition-colors duration-200 ease-out hover:bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] sm:text-[length:var(--type-body)]"
              >
                How it works
              </a>
              <a
                href="#features"
                className="rounded-[var(--radius-round)] px-[var(--space-sm)] py-[var(--space-xs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-5 text-[var(--color-text)] transition-colors duration-200 ease-out hover:bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] sm:text-[length:var(--type-body)]"
              >
                Features
              </a>
            </div>
          </div>
        </nav>
        <main id="main" role="main">
          {children}
        </main>
      </body>
    </html>
  );
}
