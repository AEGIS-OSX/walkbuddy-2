"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { ProjectImage } from "@/app/components/ProjectImage";

type AvailabilityStatus = "served" | "pending" | null;

const zipPattern = /^\d{5}$/;

export default function Hero(): JSX.Element {
  const [zip, setZip] = useState<string>("");
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(null);
  const [error, setError] = useState<string>("");

  const handleZipChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setZip(event.target.value);
    setAvailabilityStatus(null);
    setError("");
  };

  const openSignupModal = (detail?: { zip: string }): void => {
    window.dispatchEvent(new CustomEvent("open-signup-modal", { detail }));
  };

  const handleWaitlistClick = (): void => {
    openSignupModal();
  };

  const handleZipSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const trimmedZip = zip.trim();

    if (!zipPattern.test(trimmedZip)) {
      setError("Please enter a valid 5-digit ZIP code.");
      setAvailabilityStatus(null);
      return;
    }

    setError("");
    setAvailabilityStatus(null);
    setIsChecking(true);

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 450);
    });

    const nextStatus: Exclude<AvailabilityStatus, null> = trimmedZip.startsWith("787") ? "served" : "pending";
    setAvailabilityStatus(nextStatus);
    setIsChecking(false);
    openSignupModal({ zip: trimmedZip });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full bg-[var(--color-bg)] px-[var(--space-md)] py-[var(--space-4xl)] text-[var(--color-text)] md:px-[var(--space-xl)] md:py-[var(--space-5xl)]"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto grid max-w-screen-lg items-center gap-[var(--space-lg)] md:grid-cols-[58fr_42fr] md:gap-[var(--space-xl)]">
        <div className="flex flex-col items-start">
          <motion.h1
            id="hero-heading"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.05, ease: "easeOut" }}
            className="max-w-[14ch] font-[family-name:var(--font-display)] text-[length:var(--type-lg)] font-bold leading-[36px] tracking-[-0.03em] text-[var(--color-text)] md:text-[length:var(--type-xxl)] md:leading-[48px]"
          >
            Trusted local dog walks, on your schedule.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="mt-[var(--space-md)] max-w-[34rem] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-muted)] md:text-[length:16px] md:leading-[24px]"
          >
            Book a vetted local walker, see photos and live GPS.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
            className="mt-[var(--space-lg)] rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] py-[var(--space-xs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-text)] shadow-[var(--elev-1)]"
          >
            Launching in Austin, TX: estimated price per 30-min walk: $18–$25.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
            className="mt-[var(--space-lg)] w-full max-w-[34rem] font-[family-name:var(--font-body)]"
            onSubmit={handleZipSubmit}
            noValidate
          >
            <label
              htmlFor="hero-zip"
              className="block text-[length:14px] font-medium leading-[20px] text-[var(--color-muted)]"
            >
              ZIP code
            </label>
            <div className="mt-[var(--space-xs)] flex flex-col gap-[var(--space-sm)] sm:flex-row sm:items-center">
              <input
                id="hero-zip"
                name="zip"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                pattern="[0-9]{5}"
                maxLength={5}
                value={zip}
                onChange={handleZipChange}
                placeholder="78701"
                aria-describedby="hero-zip-helper hero-zip-status"
                aria-invalid={error ? "true" : "false"}
                className="min-h-[44px] flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] shadow-[var(--elev-1)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus-visible:ring-4 focus-visible:ring-[color:var(--color-accent)]"
              ></input>
              <button
                type="submit"
                disabled={isChecking}
                className="min-h-[48px] rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-body)] text-[length:14px] font-semibold leading-[20px] tracking-[0.02em] text-[var(--color-cta-text)] shadow-[var(--elev-1)] transition duration-200 ease-out hover:scale-[1.01] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-accent)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 md:min-h-[56px]"
              >
                {isChecking ? "Checking ZIP..." : "Check availability"}
              </button>
            </div>
            <div className="mt-[var(--space-xs)] flex flex-col gap-[var(--space-xs)] sm:flex-row sm:items-center sm:justify-between">
              <p
                id="hero-zip-helper"
                className="text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]"
              >
                Enter your ZIP to see if we serve your area.
              </p>
              <div
                id="hero-zip-status"
                aria-live="polite"
                className="min-h-[30px] text-[length:var(--type-xs)] leading-[18px]"
              >
                {isChecking ? (
                  <span className="inline-flex rounded-[var(--radius-round)] bg-[var(--color-surface)] px-[var(--space-sm)] py-[var(--space-xxs)] font-medium text-[var(--color-text)]">
                    Checking ZIP...
                  </span>
                ) : null}
                {!isChecking && availabilityStatus === "served" ? (
                  <span className="inline-flex rounded-[var(--radius-round)] bg-[var(--color-accent)] px-[var(--space-sm)] py-[var(--space-xxs)] font-medium text-[var(--color-accent-text)]">
                    Service available
                  </span>
                ) : null}
                {!isChecking && availabilityStatus === "pending" ? (
                  <span className="inline-flex rounded-[var(--radius-round)] bg-[var(--color-surface)] px-[var(--space-sm)] py-[var(--space-xxs)] font-medium text-[var(--color-text)]">
                    Join city waitlist
                  </span>
                ) : null}
                {error ? (
                  <span className="block font-medium text-[var(--color-text)]">
                    {error}
                  </span>
                ) : null}
              </div>
            </div>
          </motion.form>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
            onClick={handleWaitlistClick}
            className="mt-[var(--space-lg)] min-h-[48px] w-full rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-body)] text-[length:14px] font-semibold leading-[20px] tracking-[0.02em] text-[var(--color-cta-text)] shadow-[var(--elev-1)] transition duration-200 ease-out hover:scale-[1.01] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-accent)] active:scale-[0.98] sm:w-auto md:min-h-[56px]"
          >
            Join the Waitlist
          </motion.button>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
            className="mt-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]"
          >
            Background-checked walkers — GPS recaps — Photo proof
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="w-full"
        >
          <ProjectImage id="hero" className="w-full h-auto rounded-[var(--radius-md)] shadow-[var(--elev-2)]"></ProjectImage>
        </motion.div>
      </div>
    </motion.section>
  );
}
