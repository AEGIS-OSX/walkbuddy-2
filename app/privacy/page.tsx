import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — WalkBuddy",
  description:
    "We collect your email, ZIP code, and optional first name to manage the WalkBuddy waitlist and send confirmations.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <section className="mx-auto flex w-full max-w-3xl flex-col px-[var(--space-lg)] py-[var(--space-4xl)] sm:px-[var(--space-xl)] md:py-[var(--space-5xl)]">
        <article
          aria-labelledby="privacy-title"
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-lg)] shadow-[var(--elev-1)] transition-transform duration-200 ease-out motion-reduce:transition-none md:p-[var(--space-xl)]"
        >
          <div className="mb-[var(--space-xl)] h-[var(--space-xxs)] w-[var(--space-3xl)] rounded-[var(--radius-round)] bg-[var(--color-cta-bg)]" />
          <h1
            id="privacy-title"
            className="font-[family-name:var(--font-display)] text-[length:var(--type-lg)] font-bold leading-[36px] tracking-[-0.02em] text-[var(--color-text)] md:text-[length:var(--type-xxl)] md:leading-[48px]"
          >
            Privacy Policy
          </h1>
          <div className="mt-[var(--space-lg)] space-y-[var(--space-md)]">
            <p className="font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-normal leading-[22px] text-[var(--color-text)] md:leading-[24px]">
              We collect your email, ZIP code, and optional first name to manage
              the WalkBuddy waitlist and send confirmations.
            </p>
            <p className="font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-normal leading-[22px] text-[var(--color-text)] md:leading-[24px]">
              We use your data to check service availability, send confirmation
              emails, and provide updates about launch timing and pricing.
            </p>
            <p className="font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-normal leading-[22px] text-[var(--color-text)] md:leading-[24px]">
              By joining the waitlist you agree to receive marketing emails. You
              can unsubscribe at any time.
            </p>
            <p className="font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-normal leading-[22px] text-[var(--color-text)] md:leading-[24px]">
              Questions? Email privacy@walkbuddy.com.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
