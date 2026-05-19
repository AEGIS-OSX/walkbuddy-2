"use client";

import { motion, type Variants } from "framer-motion";
import { ProjectImage } from "@/app/components/ProjectImage";
import React, { useEffect, useRef, useState } from "react";

type ZipStatus = "idle" | "invalid" | "checking" | "served" | "pending";

type SignupModalDetail = {
  zip?: string;
};

const ZIP_LABEL = "ZIP code";
const ZIP_PLACEHOLDER = "78701";
const CHECK_AVAILABILITY = "Check availability";
const ZIP_HELPER = "Enter your ZIP to see if we serve your area.";
const ZIP_VALIDATION_ERROR = "Please enter a valid 5-digit ZIP code.";
const ZIP_CHECKING_STATE = "Checking ZIP...";
const SUCCESS_CHIP = "Service available";
const PENDING_CHIP = "Join city waitlist";
const SUCCESS_MESSAGE = "Great. WalkBuddy serves your ZIP. Select a time to book a walk.";
const PENDING_MESSAGE = "We’re not live in this ZIP yet. Join early access and we will notify you when we expand.";
const PRIMARY_CTA = "Join the Waitlist";
const zipPattern = /^\d{5}$/;

const revealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.05,
      duration: 0.45,
      ease: "easeOut",
    },
  }),
};

const heroImageProps = {
  id: "hero" as const,
  className: "w-full h-auto rounded-[var(--radius-md)] shadow-[var(--elev-1)]",
  fetchpriority: "high",
};

function openSignupModal(detail?: SignupModalDetail): void {
  window.dispatchEvent(new CustomEvent("open-signup-modal", { detail }));
}

function isServedZip(zip: string): boolean {
  return zip.startsWith("787");
}

export default function HeroSection(): JSX.Element {
  const [zip, setZip] = useState("");
  const [zipStatus, setZipStatus] = useState<ZipStatus>("idle");
  const checkingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (checkingTimerRef.current !== null) {
        window.clearTimeout(checkingTimerRef.current);
      }
    };
  }, []);

  const normalizedZip = zip.trim();
  const hasValidZip = zipPattern.test(normalizedZip);
  const isChecking = zipStatus === "checking";
  const isServed = zipStatus === "served";
  const isPending = zipStatus === "pending";
  const isInvalid = zipStatus === "invalid";

  const handleZipChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setZip(event.currentTarget.value.replace(/\D/g, "").slice(0, 5));

    if (zipStatus !== "idle") {
      setZipStatus("idle");
    }
  };

  const handleZipSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (checkingTimerRef.current !== null) {
      window.clearTimeout(checkingTimerRef.current);
    }

    if (!hasValidZip) {
      setZipStatus("invalid");
      return;
    }

    setZipStatus("checking");

    checkingTimerRef.current = window.setTimeout(() => {
      setZipStatus(isServedZip(normalizedZip) ? "served" : "pending");
    }, 650);
  };

  const handlePrimaryCta = (): void => {
    openSignupModal(hasValidZip ? { zip: normalizedZip } : undefined);
  };

  const handleNavAvailability = (): void => {
    openSignupModal();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-[var(--color-bg)] text-[var(--color-text)]"
      aria-label="WalkBuddy hero"
    >
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <nav className="container flex h-14 items-center justify-between gap-[var(--space-md)] md:h-16" aria-label="Primary navigation">
          <a
            href="/"
            className="font-[family-name:var(--font-display)] text-[length:var(--type-sm)] font-bold leading-[24px] text-[var(--color-text)] focus-visible:outline-none"
          >
            WalkBuddy
          </a>

          <div className="flex items-center gap-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-text)] sm:text-[length:14px] sm:leading-[20px]">
            <a href="#how-it-works" className="hidden transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:outline-none sm:inline-flex">
              How it works
            </a>
            <a href="#features" className="hidden transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:outline-none sm:inline-flex">
              Pricing
            </a>
            <motion.button
              type="button"
              onClick={handleNavAvailability}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-text)] focus-visible:outline-none sm:text-[length:14px] sm:leading-[20px]"
            >
              Check availability
            </motion.button>
          </div>
        </nav>
      </header>

      <div className="container grid gap-[var(--space-xl)] py-[var(--space-4xl)] md:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] md:items-center md:py-[var(--space-5xl)]">
        <div className="flex flex-col items-start">
          <motion.p
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-muted)]"
          >
            Background-checked walkers — GPS recaps — Photo proof
          </motion.p>

          <motion.h1
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="mt-[var(--space-md)] max-w-3xl font-[family-name:var(--font-display)] text-[length:var(--type-lg)] font-bold leading-[36px] tracking-[-0.02em] text-[var(--color-text)] md:text-[length:var(--type-xxl)] md:leading-[48px]"
          >
            Trusted local dog walks, on your schedule.
          </motion.h1>

          <motion.p
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            className="mt-[var(--space-md)] max-w-2xl font-[family-name:var(--font-display)] text-[length:var(--type-sm)] font-medium leading-[24px] text-[var(--color-text)]"
          >
            Book a vetted local walker, see photos and live GPS.
          </motion.p>

          <motion.p
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={3}
            className="mt-[var(--space-md)] max-w-2xl rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] py-[var(--space-xs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-text)] shadow-[var(--elev-1)]"
          >
            Launching in Austin, TX: estimated price per 30-min walk: $18–$25.
          </motion.p>

          <motion.form
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={4}
            onSubmit={handleZipSubmit}
            className="mt-[var(--space-xl)] w-full max-w-xl rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-md)]"
            noValidate
          >
            <div className="flex flex-col gap-[var(--space-sm)] sm:flex-row sm:items-end">
              <div className="flex-1 space-y-[var(--space-xs)]">
                <label
                  htmlFor="hero-zip"
                  className="block font-[family-name:var(--font-body)] text-[length:14px] font-medium leading-[20px] text-[var(--color-text)]"
                >
                  ZIP code
                </label>
                <input
                  id="hero-zip"
                  name="zip"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  placeholder={ZIP_PLACEHOLDER}
                  value={zip}
                  onChange={handleZipChange}
                  aria-describedby="hero-zip-status"
                  disabled={isChecking}
                  className="focus-ring h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                ></input>
              </div>

              <motion.button
                type="submit"
                disabled={isChecking}
                whileHover={isChecking ? undefined : { scale: 1.02 }}
                whileTap={isChecking ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="inline-flex h-11 min-w-36 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-display)] text-[length:14px] font-semibold leading-[20px] text-[var(--color-cta-text)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChecking ? ZIP_CHECKING_STATE : CHECK_AVAILABILITY}
              </motion.button>
            </div>

            <div id="hero-zip-status" aria-live="polite" className="mt-[var(--space-sm)] min-h-[46px] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px]">
              {zipStatus === "idle" ? <p className="text-[var(--color-muted)]">Enter your ZIP to see if we serve your area.</p> : null}
              {isInvalid ? <p className="text-[var(--color-text)]">Please enter a valid 5-digit ZIP code.</p> : null}
              {isChecking ? <p className="text-[var(--color-text)]">Checking ZIP...</p> : null}
              {isServed ? (
                <div className="flex flex-col items-start gap-[var(--space-xs)]">
                  <span className="inline-flex min-h-7 items-center rounded-[var(--radius-round)] bg-[var(--color-accent)] px-[var(--space-sm)] py-[var(--space-xxs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-accent-text)]">
                    Service available
                  </span>
                  <p className="text-[var(--color-text)]">Great. WalkBuddy serves your ZIP. Select a time to book a walk.</p>
                </div>
              ) : null}
              {isPending ? (
                <div className="flex flex-col items-start gap-[var(--space-xs)]">
                  <span className="inline-flex min-h-7 items-center rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-sm)] py-[var(--space-xxs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-text)]">
                    Join city waitlist
                  </span>
                  <p className="text-[var(--color-text)]">We’re not live in this ZIP yet. Join early access and we will notify you when we expand.</p>
                </div>
              ) : null}
            </div>
          </motion.form>

          <motion.div
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={5}
            className="mt-[var(--space-lg)] flex w-full flex-col gap-[var(--space-sm)] sm:w-auto sm:flex-row sm:items-center"
          >
            <motion.button
              type="button"
              onClick={handlePrimaryCta}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={
                isServed
                  ? "inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-xl)] font-[family-name:var(--font-display)] text-[length:var(--type-body)] font-semibold leading-[22px] text-[var(--color-cta-text)] shadow-[var(--elev-2)] focus-visible:outline-none md:h-14"
                  : "inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-xl)] font-[family-name:var(--font-display)] text-[length:var(--type-body)] font-semibold leading-[22px] text-[var(--color-cta-text)] shadow-[var(--elev-1)] focus-visible:outline-none md:h-14"
              }
            >
              Join the Waitlist
            </motion.button>

            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-medium leading-[22px] text-[var(--color-text)] transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:outline-none md:h-14"
            >
              How it works
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.18, duration: 0.5, ease: "easeOut" }}
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-xs)] shadow-[var(--elev-2)]"
        >
          <ProjectImage {...heroImageProps}></ProjectImage>
        </motion.div>
      </div>
    </motion.section>
  );
}
