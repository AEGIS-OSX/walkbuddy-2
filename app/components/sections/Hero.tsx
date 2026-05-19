"use client";

import { useState } from "react";
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

const zipPattern = /^\d{5}$/;
const helperMessage = "Enter your ZIP to see if we serve your area.";
const validationMessage = "Please enter a valid 5-digit ZIP code.";
const checkingMessage = "Checking ZIP...";
const successChip = "Service available";
const successMessage = "Great. WalkBuddy serves your ZIP. Select a time to book a walk.";
const pendingChip = "Join city waitlist";
const pendingMessage = `We’re not live in this ZIP yet. Join early access and we will notify you when we expand.`;

function getOptimisticStatus(zip: string): ZipStatus {
  if (zip.startsWith("787")) {
    return {
      status: "success",
      chip: successChip,
      message: successMessage
    };
  }

  return {
    status: "pending",
    chip: pendingChip,
    message: pendingMessage
  };
}

function getStatusFromResponse(response: MarketingSignupResponse, zip: string): ZipStatus {
  if (response.availability_status === "served") {
    return {
      status: "success",
      chip: successChip,
      message: successMessage
    };
  }

  if (response.availability_status === "pending") {
    return {
      status: "pending",
      chip: pendingChip,
      message: pendingMessage
    };
  }

  return getOptimisticStatus(zip);
}

export default function Hero(): JSX.Element {
  const [zip, setZip] = useState<string>("");
  const [zipStatus, setZipStatus] = useState<ZipStatus>({
    status: "idle",
    message: helperMessage
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  async function handleZipSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const normalizedZip = zip.trim();

    if (!zipPattern.test(normalizedZip)) {
      setZipStatus({
        status: "error",
        message: validationMessage
      });
      return;
    }

    setZipStatus({
      status: "checking",
      message: checkingMessage
    });

    const optimisticStatus = getOptimisticStatus(normalizedZip);

    try {
      const response = await fetch("/api/marketing-signups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          zip: normalizedZip,
          source: "hero_zip_check"
        })
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

  function openSignupModal(): void {
    setIsModalOpen(true);
  }

  const hasChip = zipStatus.status === "success" || zipStatus.status === "pending";

  return (
    <motion.section
      id="hero"
      className="bg-[var(--color-bg)] px-[var(--space-md)] py-[var(--space-5xl)] text-[var(--color-text)] sm:px-[var(--space-xl)] lg:px-[var(--space-4xl)]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto grid max-w-screen-xl gap-[var(--space-3xl)] lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-center">
        <div className="flex flex-col items-start gap-[var(--space-lg)]">
          <motion.p
            className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[1.4] tracking-[0.04em] text-[var(--color-muted)]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05, duration: 0.5, ease: "easeOut" }}
          >
            Background-checked walkers — GPS recaps — Photo proof
          </motion.p>

          <motion.h1
            className="max-w-[14ch] font-[family-name:var(--font-display)] text-[length:var(--type-lg)] font-bold leading-[1.28] text-[var(--color-text)] md:text-[length:var(--type-xxl)] md:leading-[1.15]"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.55, ease: "easeOut" }}
          >
            Trusted local dog walks, on your schedule.
          </motion.h1>

          <motion.p
            className="max-w-[34rem] font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-normal leading-[1.47] text-[var(--color-text)] md:text-[1rem] md:leading-[1.5]"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.55, ease: "easeOut" }}
          >
            Book a vetted local walker, see photos and live GPS.
          </motion.p>

          <motion.p
            className="rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-md)] py-[var(--space-xs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-normal leading-[1.38] text-[var(--color-muted)] shadow-[var(--elev-1)]"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          >
            Launching in Austin, TX: estimated price per 30-min walk: $18–$25.
          </motion.p>

          <motion.div
            className="flex w-full flex-col gap-[var(--space-lg)]"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.55, ease: "easeOut" }}
          >
            <div className="flex w-full flex-col gap-[var(--space-sm)] sm:flex-row sm:items-center">
              <motion.button
                type="button"
                className="min-h-[3rem] w-full rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-semibold leading-none text-[var(--color-cta-text)] shadow-[var(--elev-1)] outline-none transition-shadow duration-200 ease-out focus-visible:shadow-[0_0_0_4px_rgba(168,230,207,0.18)] md:min-h-[3.5rem] sm:w-auto sm:min-w-[8.75rem]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                onClick={openSignupModal}
                aria-haspopup="dialog"
              >
                Join the Waitlist
              </motion.button>

              <motion.a
                href="#how-it-works"
                className="inline-flex min-h-[3rem] items-center justify-center rounded-[var(--radius-md)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-medium leading-none text-[var(--color-text)] outline-none transition-colors duration-200 ease-out hover:text-[var(--color-accent-text)] focus-visible:shadow-[0_0_0_4px_rgba(168,230,207,0.18)] md:min-h-[3.5rem] sm:justify-start"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                How it works
              </motion.a>
            </div>

            <form
              className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] shadow-[var(--elev-1)]"
              onSubmit={handleZipSubmit}
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
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setZip(event.target.value)}
                  className="min-h-[2.75rem] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-normal leading-[1.47] text-[var(--color-text)] outline-none transition-shadow duration-200 ease-out placeholder:text-[var(--color-muted)] focus-visible:shadow-[0_0_0_4px_rgba(168,230,207,0.18)] sm:flex-[1_1_62%]"
                  aria-describedby="hero-zip-status"
                  aria-invalid={zipStatus.status === "error"}
                  disabled={zipStatus.status === "checking"}
                />
                <motion.button
                  type="submit"
                  className="min-h-[2.75rem] rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-semibold leading-none text-[var(--color-cta-text)] outline-none transition-opacity duration-200 ease-out focus-visible:shadow-[0_0_0_4px_rgba(168,230,207,0.18)] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-[0_0_auto]"
                  whileHover={zipStatus.status === "checking" ? undefined : { scale: 1.02 }}
                  whileTap={zipStatus.status === "checking" ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  disabled={zipStatus.status === "checking"}
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
                    className="inline-flex w-fit rounded-[var(--radius-round)] bg-[var(--color-accent)] px-[var(--space-sm)] py-[var(--space-xxs)] font-medium text-[var(--color-accent-text)]"
                    role="status"
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

        <motion.div
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-xs)] shadow-[var(--elev-1)]"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45, duration: 0.6, ease: "easeOut" }}
        >
          <ProjectImage id="hero" className="h-auto w-full rounded-[var(--radius-md)]" />
        </motion.div>
      </div>

      {isModalOpen ? <SignupModal initialZip={zip.trim()} /> : null}
    </motion.section>
  );
}
