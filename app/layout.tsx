import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteDescription = "Vetted walkers, photo and GPS recaps, and transparent pricing. Join early access for Austin and nearby cities.";

const navLinks = [
  {
    href: "#features",
    label: "How it works"
  },
  {
    href: "#availability",
    label: "Availability"
  },
  {
    href: "#waitlist",
    label: "Join the Waitlist",
    modalTarget: "waitlist"
  }
];

export const metadata: Metadata = {
  title: "WalkBuddy — Trusted local dog walks",
  description: siteDescription,
  icons: {
    icon: "/favicon.ico"
  },
  openGraph: {
    title: "WalkBuddy — Trusted local dog walks",
    description: siteDescription,
    images: ["/og.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "WalkBuddy — Trusted local dog walks",
    description: siteDescription,
    images: ["/og.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[var(--color-text)] antialiased">
        <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <nav
            aria-label="Primary navigation"
            className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 md:h-16 md:px-6"
          >
            <a
              href="/"
              className="font-[family-name:var(--font-display)] text-[length:var(--type-sm)] font-semibold tracking-[-0.01em] text-[var(--color-text)] outline-none transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:rounded-[var(--radius-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgba(168,230,207,0.5)]"
            >
              WalkBuddy
            </a>
            <div className="flex items-center gap-1 sm:gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  data-modal-target={link.modalTarget}
                  className="rounded-[var(--radius-round)] px-3 py-2 font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-text)] outline-none transition-colors duration-200 ease-out hover:bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(168,230,207,0.5)] md:px-4 md:text-[length:14px] md:leading-5"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-4 md:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
