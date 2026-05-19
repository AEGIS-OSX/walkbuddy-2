import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "WalkBuddy — Trusted local dog walks",
  description: "Vetted walkers, photo and GPS proof, clear pricing. Join early access for Austin and nearby cities."
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

const navigationLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#walkers", label: "Walkers" },
  { href: "#reviews", label: "Reviews" }
];

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] antialiased md:text-[length:var(--type-body)] md:leading-[24px]">
        <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <nav aria-label="Primary navigation" className="mx-auto flex h-14 w-full max-w-screen-lg items-center justify-between px-4 md:h-16 md:px-6">
            <a href="/" className="font-[family-name:var(--font-display)] text-[length:var(--type-body)] font-semibold tracking-[-0.01em] text-[var(--color-text)] transition-colors duration-200 ease-out hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] md:text-[length:var(--type-sm)]">
              WalkBuddy
            </a>
            <div className="flex items-center gap-3 md:gap-6">
              {navigationLinks.map((link) => (
                <a key={link.href} href={link.href} className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-muted)] transition-colors duration-200 ease-out hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] md:text-[length:var(--type-body)] md:leading-[20px]">
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        </header>
        <main className="bg-[var(--color-bg)] text-[var(--color-text)]">
          {children}
        </main>
      </body>
    </html>
  );
}
