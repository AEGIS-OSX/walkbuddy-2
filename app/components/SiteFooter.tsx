import type { ReactElement } from "react";

export default function SiteFooter(): ReactElement {
  return (
    <footer
      aria-label="Site footer"
      className="border-t border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-[var(--space-md)] px-[var(--space-lg)] py-[var(--space-xl)] md:flex-row md:items-center md:justify-between">
        <p className="font-[family-name:var(--font-display)] text-[length:var(--type-sm)] font-[var(--font-weight-semibold)] leading-[24px] tracking-[-0.01em] text-[var(--color-text)]">
          WalkBuddy
        </p>
        <nav
          aria-label="Footer links"
          className="flex flex-wrap items-center gap-x-[var(--space-lg)] gap-y-[var(--space-xs)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]"
        >
          <a
            href="/privacy"
            className="rounded-[var(--radius-sm)] font-[family-name:var(--font-body)] font-[var(--font-weight-medium)] text-[var(--color-text)] transition-opacity duration-200 ease-out hover:opacity-75 focus-visible:opacity-100"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="rounded-[var(--radius-sm)] font-[family-name:var(--font-body)] font-[var(--font-weight-medium)] text-[var(--color-text)] transition-opacity duration-200 ease-out hover:opacity-75 focus-visible:opacity-100"
          >
            Terms
          </a>
          <a
            href="https://instagram.com/walkbuddyapp"
            rel="noopener noreferrer"
            target="_blank"
            className="rounded-[var(--radius-sm)] font-[family-name:var(--font-body)] font-[var(--font-weight-medium)] text-[var(--color-text)] transition-opacity duration-200 ease-out hover:opacity-75 focus-visible:opacity-100"
          >
            Instagram
          </a>
        </nav>
        <p className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">
          © 2026 WalkBuddy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
