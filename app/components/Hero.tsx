"use client";

import { FormEvent, useId, useState } from "react";
import { motion } from "framer-motion";
import { ProjectImage } from "@/app/components/ProjectImage";

type AvailabilityState = "idle" | "loading" | "served" | "pending";

type AvailabilityResponse = {
  availability_status?: "served" | "pending";
};

const zipPattern = /^\d{5}$/;

const revealViewport = {
  once: true,
  margin: "-100px",
};

const revealTransition = {
  duration: 0.6,
  ease: "easeOut",
};

function isAvailabilityResponse(value: unknown): value is AvailabilityResponse {
  if (typeof value !== "object" || value === null || !("availability_status" in value)) {
    return false;
  }

  const status = (value as { availability_status?: unknown }).availability_status;
  return status === "served" || status === "pending";
}

export default function Hero() {
  const zipInputId = useId();
  const [zip, setZip] = useState("");
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>("idle");
  const [validationMessage, setValidationMessage] = useState("");

  function openSignupModal() {
    window.dispatchEvent(new CustomEvent("open-signup-modal"));
  }

  async function handleZipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedZip = zip.trim();

    if (!zipPattern.test(trimmedZip)) {
      setAvailabilityState("idle");
      setValidationMessage("Please enter a valid 5-digit ZIP code.");
      return;
    }

    setValidationMessage("");
    setAvailabilityState("loading");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MARKETING_API_BASE}/availability?zip=${encodeURIComponent(trimmedZip)}`);
      const payload: unknown = await response.json();

      if (response.ok && isAvailabilityResponse(payload)) {
        setAvailabilityState(payload.availability_status ?? "pending");
        return;
      }

      setAvailabilityState("pending");
    } catch {
      setAvailabilityState("pending");
    }
  }

  const isLoading = availabilityState === "loading";
  const hasServedStatus = availabilityState === "served";
  const hasPendingStatus = availabilityState === "pending";

  return (
    <section className="bg-[var(--color-bg)] px-[var(--space-lg)] py-[var(--space-4xl)] text-[var(--color-text)] md:py-[var(--space-5xl)]" aria-labelledby="hero-title">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-[var(--space-xl)] lg:grid-cols-12">
        <div className="flex flex-col lg:col-span-7">
          <motion.p
            className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0 }}
            viewport={revealViewport}
          >
            Background-checked walkers — GPS recaps — Photo proof.
          </motion.p>

          <motion.h1
            id="hero-title"
            className="mt-[var(--space-sm)] max-w-2xl font-[family-name:var(--font-display)] text-[length:var(--type-lg)] font-[var(--font-weight-bold)] leading-[36px] tracking-[-0.03em] text-[var(--color-text)] md:text-[length:var(--type-xxl)] md:leading-[48px]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.06 }}
            viewport={revealViewport}
          >
            Trusted local dog walks, on your schedule.
          </motion.h1>

          <motion.p
            className="mt-[var(--space-md)] max-w-xl font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-muted)] md:text-[16px] md:leading-[24px]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.12 }}
            viewport={revealViewport}
          >
            Local walkers, photo and GPS proof, clear pricing.
          </motion.p>

          <motion.p
            className="mt-[var(--space-md)] w-fit rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-md)] py-[var(--space-xs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)] shadow-[var(--elev-1)]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.18 }}
            viewport={revealViewport}
          >
            Launching in Austin, TX: estimated price per 30-min walk: $18–$25.
          </motion.p>

          <motion.div
            className="mt-[var(--space-lg)] flex flex-col gap-[var(--space-sm)] sm:flex-row sm:items-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.24 }}
            viewport={revealViewport}
          >
            <motion.button
              type="button"
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-display)] text-[length:var(--type-body)] font-[var(--font-weight-semibold)] leading-[22px] text-[var(--color-cta-text)] shadow-[var(--elev-1)] transition-shadow duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] lg:min-h-14"
              onClick={openSignupModal}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Join the Waitlist
            </motion.button>
            <motion.a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] px-[var(--space-md)] font-[family-name:var(--font-display)] text-[length:var(--type-body)] font-[var(--font-weight-medium)] leading-[22px] text-[var(--color-text)] underline decoration-[var(--color-accent)] decoration-2 underline-offset-4 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] sm:justify-start"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              How it works
            </motion.a>
          </motion.div>

          <motion.form
            className="mt-[var(--space-lg)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-md)] shadow-[var(--elev-1)]"
            onSubmit={handleZipSubmit}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.3 }}
            viewport={revealViewport}
            noValidate
          >
            <label htmlFor={zipInputId} className="font-[family-name:var(--font-display)] text-[length:14px] font-[var(--font-weight-medium)] leading-[20px] text-[var(--color-text)]">
              ZIP code
            </label>
            <div className="mt-[var(--space-xs)] flex flex-col gap-[var(--space-sm)] sm:flex-row">
              <input
                id={zipInputId}
                name="zip"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="78701"
                value={zip}
                onChange={(event) => setZip(event.target.value)}
                aria-invalid={validationMessage ? "true" : "false"}
                aria-describedby={`${zipInputId}-helper ${zipInputId}-status`}
                className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
              <motion.button
                type="submit"
                aria-busy={isLoading}
                disabled={isLoading}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-display)] text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-[18px] text-[var(--color-cta-text)] transition-opacity duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-70"
                whileHover={isLoading ? undefined : { scale: 1.02 }}
                whileTap={isLoading ? undefined : { scale: 0.98 }}
              >
                {isLoading ? "Checking ZIP..." : "Check availability"}
              </motion.button>
            </div>

            <p id={`${zipInputId}-helper`} className="mt-[var(--space-xs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">
              Enter your ZIP to see if we serve your area.
            </p>

            <div id={`${zipInputId}-status`} className="mt-[var(--space-sm)] min-h-[44px]" aria-live="polite">
              {validationMessage ? (
                <p className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)]">
                  {validationMessage}
                </p>
              ) : null}

              {hasServedStatus ? (
                <div className="flex flex-col gap-[var(--space-xs)]">
                  <span className="w-fit rounded-[var(--radius-round)] bg-[var(--color-accent)] px-[var(--space-sm)] py-[var(--space-xxs)] font-[family-name:var(--font-display)] text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-[18px] text-[var(--color-text)]">
                    Service available
                  </span>
                  <p className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                    Great. WalkBuddy serves your ZIP. Select a time to book a walk.
                  </p>
                </div>
              ) : null}

              {hasPendingStatus ? (
                <div className="flex flex-col gap-[var(--space-xs)]">
                  <span className="w-fit rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-sm)] py-[var(--space-xxs)] font-[family-name:var(--font-display)] text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-[18px] text-[var(--color-text)]">
                    Join city waitlist
                  </span>
                  <p className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                    We’re not live in this ZIP yet. Join early access and we’ll notify you when we expand.
                  </p>
                </div>
              ) : null}
            </div>
          </motion.form>
        </div>

        <motion.div
          className="mt-[var(--space-lg)] lg:col-span-5 lg:mt-0"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: 0.36 }}
          viewport={revealViewport}
        >
          <ProjectImage id="hero" className="w-full h-auto rounded-[var(--radius-md)] shadow-[var(--elev-2)]" />
        </motion.div>
      </div>
    </section>
  );
}
