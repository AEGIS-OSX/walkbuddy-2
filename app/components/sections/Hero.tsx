"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { ProjectImage } from "@/app/components/ProjectImage";
import SignupModal from "@/app/components/SignupModal";

type AvailabilityStatus = "idle" | "checking" | "success" | "pending" | "error";

type MarketingSignupResponse = {
  availability_status?: "served" | "pending";
};

type ZipStatus = {
  status: AvailabilityStatus;
  chip?: string;
  message: string;
};

const heroEyebrow = "Background-checked walkers — GPS recaps — Photo proof";
const heroHeadline = "Trusted local dog walks, on your schedule.";
const heroSubhead = "Book a vetted local walker, see photos and live GPS.";
const heroPricing = "Launching in Austin, TX: estimated price per 30-min walk: $18–$25.";
const helperMessage = "Enter your ZIP to see if we serve your area.";
const validationMessage = "Please enter a valid 5-digit ZIP code.";
const checkingMessage = "Checking ZIP...";
const successChip = "Service available";
const successMessage = "Great. WalkBuddy serves your ZIP. Select a time to book a walk.";
const pendingChip = "Join city waitlist";
const pendingMessage = "We’re not live in this ZIP yet. Join early access and we will notify you when we expand.";
const zipPattern = /^\d{5}$/;

function getOptimisticStatus(zip: string): ZipStatus {
  return zip.startsWith("787")
    ? { status: "success", chip: successChip, message: successMessage }
    : { status: "pending", chip: pendingChip, message: pendingMessage };
}

function getStatusFromResponse(response: MarketingSignupResponse, zip: string): ZipStatus {
  if (response.availability_status === "served") {
    return { status: "success", chip: successChip, message: successMessage };
  }

  if (response.availability_status === "pending") {
    return { status: "pending", chip: pendingChip, message: pendingMessage };
  }

  return getOptimisticStatus(zip);
}

export default function Hero(): JSX.Element {
  const [zip, setZip] = useState("");
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [zipStatus, setZipStatus] = useState<ZipStatus>({
    status: "idle",
    message: helperMessage
  });

  const hasChip = zipStatus.status === "success" || zipStatus.status === "pending";

  async function handleZipSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const normalizedZip = zip.trim();

    if (!zipPattern.test(normalizedZip)) {
      setZipStatus({ status: "error", message: validationMessage });
      return;
    }

    setZipStatus({ status: "checking", message: checkingMessage });

    const optimisticStatus = getOptimisticStatus(normalizedZip);

    try {
      const response = await fetch("/api/marketing-signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: normalizedZip, source: "hero_zip_check" })
      });

      if (!response.ok) {
        setZipStatus(optimisticStatus);
        return;
      }

      const payload = (await response.json()) as MarketingSignupResponse;
      setZipStatus(getStatusFromResponse(payload, normalizedZip));
    } catch {
      setZipStatus(optimisticStatus);
    }
  }

  return (
    <motion.section
      id="hero"
      className="bg-[var(--color-bg)] px-[var(--space-md)] py-[var(--space-5xl)] text-[var(--color-text)] sm:px-[var(--space-xl)] lg:px-[var(--space-4xl)]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
    >
      <div className="mx-auto grid max-w-screen-xl gap-[var(--space-3xl)] lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-center">
        <div className="flex flex-col items-start gap-[var(--space-lg)]">
          <motion.p
            className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-regular)] leading-[1.4] text-[var(--color-muted)]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05, duration: 0.5, ease: "easeOut" }}
          >
            {heroEyebrow}
          </motion.p>

          <motion.h1
            className="max-w-xl font-[family-name:var(--font-display)] font-[var(--font-weight-bold)] text-[length:var(--type-lg)] leading-[1.28] text-[var(--color-text)] lg:text-[length:var(--type-xxl)] lg:leading-[1.15]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          >
            {heroHeadline}
          </motion.h1>

          <motion.p
            className="max-w-2xl font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-[var(--font-weight-regular)] leading-[1.47] text-[var(--color-text)]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
          >
            {heroSubhead}
          </motion.p>

          <motion.p
            className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-regular)] leading-[1.38] text-[var(--color-muted)]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          >
            {heroPricing}
          </motion.p>

          <motion.div
            className="flex w-full flex-col gap-[var(--space-lg)]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex w-full flex-col gap-[var(--space-sm)] sm:flex-row sm:items-center">
              <motion.button
                type="button"
                className="min-h-[3rem] w-full rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-[var(--font-weight-semibold)] leading-none text-[var(--color-cta-text)] shadow-[var(--elev-1)] outline-none transition-shadow duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] sm:w-auto sm:min-w-[8.75rem] md:min-h-[3.5rem]"
                onClick={() => setIsSignupModalOpen(true)}
                aria-haspopup="dialog"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ backgroundColor: "var(--color-cta-bg)", color: "var(--color-cta-text)" }}
              >
                Join the Waitlist
              </motion.button>

              <a
                href="#how-it-works"
                className="inline-flex min-h-[3rem] items-center justify-center rounded-[var(--radius-md)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-[var(--font-weight-medium)] leading-none text-[var(--color-text)] outline-none transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] sm:justify-start md:min-h-[3.5rem]"
              >
                How it works
              </a>
            </div>

            <form
              className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] shadow-[var(--elev-1)]"
              onSubmit={handleZipSubmit}
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <div className="flex flex-col gap-[var(--space-sm)] sm:flex-row">
                <label htmlFor="hero-zip" className="sr-only">
                  ZIP code
                </label>
                <input
                  id="hero-zip"
                  name="zip"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="78701"
                  value={zip}
                  onChange={(event) => setZip(event.target.value)}
                  className="min-h-[2.75rem] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-[var(--font-weight-regular)] leading-[1.47] text-[var(--color-text)] outline-none transition-shadow duration-200 ease-out placeholder:text-[var(--color-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] sm:flex-[1_1_62%]"
                  aria-describedby="hero-zip-status"
                  aria-invalid={zipStatus.status === "error"}
                  disabled={zipStatus.status === "checking"}
                  style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
                <motion.button
                  type="submit"
                  className="min-h-[2.75rem] rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-none text-[var(--color-cta-text)] outline-none transition-opacity duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-[0_0_auto]"
                  disabled={zipStatus.status === "checking"}
                  whileHover={{ scale: zipStatus.status === "checking" ? 1 : 1.02 }}
                  whileTap={{ scale: zipStatus.status === "checking" ? 1 : 0.98 }}
                  style={{ backgroundColor: "var(--color-cta-bg)", color: "var(--color-cta-text)" }}
                >
                  {zipStatus.status === "checking" ? checkingMessage : "Check availability"}
                </motion.button>
              </div>

              <div
                id="hero-zip-status"
                className="mt-[var(--space-sm)] flex flex-col gap-[var(--space-xs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[1.38] text-[var(--color-muted)]"
                aria-live="polite"
              >
                {hasChip ? (
                  <span
                    className="inline-flex w-fit rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-accent)] px-[var(--space-sm)] py-[var(--space-xxs)] font-[var(--font-weight-medium)] text-[var(--color-accent-text)]"
                    role="status"
                    style={{ backgroundColor: "var(--color-accent)", borderColor: "var(--color-border)", color: "var(--color-accent-text)" }}
                  >
                    {zipStatus.chip}
                  </span>
                ) : null}
                <span className={zipStatus.status === "error" ? "text-[var(--color-text)]" : "text-[var(--color-muted)]"}>
                  {zipStatus.message}
                </span>
              </div>
            </form>
          </motion.div>
        </div>

        <div
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-xs)] shadow-[var(--elev-1)]"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <ProjectImage id="hero" className="h-auto w-full rounded-[var(--radius-md)]" />
        </div>
      </div>

      {isSignupModalOpen ? <SignupModal /> : null}
    </motion.section>
  );
}
