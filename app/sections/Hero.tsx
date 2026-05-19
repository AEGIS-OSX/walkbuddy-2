"use client";

import { motion, type Variants } from "framer-motion";
import { type FormEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { ProjectImage } from "@/app/components/ProjectImage";

type AvailabilityStatus = "served" | "pending";

type InlineResult = Readonly<{
  status: AvailabilityStatus;
  chip: string;
  message: string;
}>;

type ModalResult = Readonly<{
  status: AvailabilityStatus;
  chip: string;
  message: string;
}>;

type MarketingResponse = Readonly<{
  availability_status?: AvailabilityStatus;
  status?: AvailabilityStatus | "duplicate";
  duplicate?: boolean;
}>;

const AUSTIN_CORE_ZIPS = new Set<string>(["78701", "78702", "78703", "78704", "78705"]);
const SUBMITTED_SIGNUPS = new Set<string>();

const ZIP_PATTERN = /^[0-9]{5}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HERO_HEADLINE = "Trusted local dog walks, on your schedule.";
const HERO_SUBHEADLINE = "Book a vetted local walker, see photos and live GPS.";
const HERO_PRICING = "Launching in Austin, TX: estimated price per 30-min walk: $18–$25.";
const TRUST_ROW = "Background-checked walkers — GPS recaps — Photo proof";
const PRIMARY_CTA = "Join the Waitlist";
const SECONDARY_CTA = "How it works";
const ZIP_LABEL = "ZIP code";
const ZIP_PLACEHOLDER = "ZIP code";
const CHECK_AVAILABILITY = "Check availability";
const INLINE_HELPER = "Enter your ZIP to see if we serve your area.";
const INLINE_VALIDATION = "Please enter a valid 5-digit ZIP code.";
const CHECKING_LABEL = "Checking ZIP...";
const SUCCESS_CHIP = "Service available";
const SUCCESS_INLINE_MESSAGE = "Great. WalkBuddy serves your ZIP. Select a time to book a walk.";
const PENDING_CHIP = "Join city waitlist";
const PENDING_INLINE_MESSAGE = `We’re not live in this ZIP yet. Join early access and we will notify you when we expand.`;
const MODAL_TITLE = "Check availability";
const EMAIL_PLACEHOLDER = "you@example.com";
const MODAL_VALIDATION = "Please enter a valid email and a 5-digit ZIP code.";
const DUPLICATE_NOTICE = "This ZIP and email are already on our list. We just sent a confirmation.";
const MODAL_SUCCESS_MESSAGE = "Great. WalkBuddy serves your ZIP. You will receive a confirmation email with next steps.";
const MODAL_PENDING_MESSAGE = `We’re not live yet. Join early access and we’ll notify you when we expand.`;
const SUCCESS_FOLLOW_UP = "View booking details";
const CONSENT_COPY = "I agree to receive WalkBuddy availability and waitlist emails.";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay,
      ease: "easeOut",
    },
  }),
};

const modalPanelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" },
  },
};

function getAvailability(zip: string): AvailabilityStatus {
  return AUSTIN_CORE_ZIPS.has(zip) ? "served" : "pending";
}

function getInlineResult(zip: string): InlineResult {
  const status = getAvailability(zip);

  if (status === "served") {
    return {
      status,
      chip: SUCCESS_CHIP,
      message: SUCCESS_INLINE_MESSAGE,
    };
  }

  return {
    status,
    chip: PENDING_CHIP,
    message: PENDING_INLINE_MESSAGE,
  };
}

function getModalResult(zip: string): ModalResult {
  const status = getAvailability(zip);

  if (status === "served") {
    return {
      status,
      chip: SUCCESS_CHIP,
      message: MODAL_SUCCESS_MESSAGE,
    };
  }

  return {
    status,
    chip: PENDING_CHIP,
    message: MODAL_PENDING_MESSAGE,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getResponseStatus(value: unknown): MarketingResponse {
  if (!isRecord(value)) {
    return {};
  }

  const response: MarketingResponse = {};

  if (value.availability_status === "served" || value.availability_status === "pending") {
    return { availability_status: value.availability_status };
  }

  if (value.status === "served" || value.status === "pending" || value.status === "duplicate") {
    return { status: value.status };
  }

  if (value.duplicate === true) {
    return { duplicate: true };
  }

  return response;
}

function waitForAvailability(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 450);
  });
}

export default function Hero(): JSX.Element {
  const [inlineZip, setInlineZip] = useState<string>("");
  const [inlineTouched, setInlineTouched] = useState<boolean>(false);
  const [inlineChecking, setInlineChecking] = useState<boolean>(false);
  const [inlineResult, setInlineResult] = useState<InlineResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalEmail, setModalEmail] = useState<string>("");
  const [modalZip, setModalZip] = useState<string>("");
  const [modalName, setModalName] = useState<string>("");
  const [modalConsent, setModalConsent] = useState<boolean>(false);
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>("");
  const [modalDuplicate, setModalDuplicate] = useState<boolean>(false);
  const [modalResult, setModalResult] = useState<ModalResult | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const inlineStatusId = useId();
  const modalStatusId = useId();

  const inlineZipIsInvalid = inlineTouched && inlineZip.length > 0 && !ZIP_PATTERN.test(inlineZip);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => emailInputRef.current?.focus(), 0);

    const handleEscape = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isModalOpen]);

  function openModal(prefillZip?: string): void {
    const usableZip = prefillZip && ZIP_PATTERN.test(prefillZip) ? prefillZip : inlineZip;

    if (ZIP_PATTERN.test(usableZip)) {
      setModalZip(usableZip);
    }

    setModalError("");
    setModalDuplicate(false);
    setModalResult(null);
    setIsModalOpen(true);
  }

  function closeModal(): void {
    setIsModalOpen(false);
  }

  async function handleInlineSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setInlineTouched(true);
    setInlineResult(null);

    if (!ZIP_PATTERN.test(inlineZip)) {
      return;
    }

    setInlineChecking(true);
    await waitForAvailability();
    setInlineResult(getInlineResult(inlineZip));
    setInlineChecking(false);
  }

  async function submitModal(): Promise<void> {
    setModalError("");
    setModalDuplicate(false);
    setModalResult(null);

    if (!EMAIL_PATTERN.test(modalEmail) || !ZIP_PATTERN.test(modalZip) || !modalConsent) {
      setModalError(MODAL_VALIDATION);
      return;
    }

    setModalSubmitting(true);

    const signupKey = `${modalEmail.toLowerCase()}-${modalZip}`;
    const payload = {
      email: modalEmail,
      zip: modalZip,
      name: modalName.trim().length > 0 ? modalName : undefined,
      consent: true,
      source: "landing",
    };

    try {
      if (SUBMITTED_SIGNUPS.has(signupKey)) {
        await waitForAvailability();
        setModalDuplicate(true);
        return;
      }

      const response = await fetch("/api/marketing-signups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
        setModalDuplicate(true);
        return;
      }

      let responseStatus: MarketingResponse = {};

      try {
        responseStatus = getResponseStatus(await response.json());
      } catch {
        responseStatus = {};
      }

      if (responseStatus.duplicate === true || responseStatus.status === "duplicate") {
        setModalDuplicate(true);
        return;
      }

      if (responseStatus.availability_status === "served" || responseStatus.status === "served") {
        SUBMITTED_SIGNUPS.add(signupKey);
        setModalResult({ status: "served", chip: SUCCESS_CHIP, message: MODAL_SUCCESS_MESSAGE });
        return;
      }

      if (responseStatus.availability_status === "pending" || responseStatus.status === "pending") {
        SUBMITTED_SIGNUPS.add(signupKey);
        setModalResult({ status: "pending", chip: PENDING_CHIP, message: MODAL_PENDING_MESSAGE });
        return;
      }
    } catch {
      await waitForAvailability();
    }

    SUBMITTED_SIGNUPS.add(signupKey);
    setModalResult(getModalResult(modalZip));
    setModalSubmitting(false);
  }

  async function handleModalSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await submitModal();
    setModalSubmitting(false);
  }

  function handleModalKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = event.currentTarget.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex=\"-1\"])",
    );

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <>
      <motion.section
        id="hero"
        aria-label="WalkBuddy hero signup and ZIP availability"
        className="bg-[var(--color-bg)] py-[var(--space-5xl)] text-[var(--color-text)] lg:py-32"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
      >
        <div className="mx-auto grid w-full max-w-screen-xl grid-cols-1 gap-[var(--space-lg)] px-[var(--space-md)] md:px-[var(--space-lg)] lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-center lg:gap-[var(--space-xl)]">
          <div className="flex max-w-xl flex-col gap-[var(--space-md)]">
            <motion.p
              className="sr-only font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]"
              variants={itemVariants}
              custom={0}
            >
              WalkBuddy Austin early access
            </motion.p>
            <motion.h1
              className="font-[family-name:var(--font-display)] text-[length:var(--type-lg)] font-[var(--font-weight-bold)] leading-9 tracking-[-0.03em] text-[var(--color-text)] lg:text-[length:var(--type-xxl)] lg:leading-[3rem]"
              variants={itemVariants}
              custom={0.05}
            >
              {HERO_HEADLINE}
            </motion.h1>
            <motion.p
              className="max-w-lg font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-[var(--font-weight-medium)] leading-[22px] text-[var(--color-text)] lg:text-base lg:leading-6"
              variants={itemVariants}
              custom={0.15}
            >
              {HERO_SUBHEADLINE}
            </motion.p>
            <motion.p
              className="font-[family-name:var(--font-body)] text-sm font-[var(--font-weight-medium)] leading-5 text-[var(--color-muted)]"
              variants={itemVariants}
              custom={0.25}
            >
              {HERO_PRICING}
            </motion.p>
            <motion.p
              className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]"
              variants={itemVariants}
              custom={0.3}
            >
              {TRUST_ROW}
            </motion.p>
            <motion.div
              className="flex flex-col gap-[var(--space-sm)] pt-[var(--space-xs)] sm:flex-row sm:items-center"
              variants={itemVariants}
              custom={0.35}
            >
              <motion.button
                type="button"
                className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-display)] text-sm font-[var(--font-weight-semibold)] leading-5 text-[var(--color-cta-text)] shadow-[var(--elev-1)] transition-shadow duration-200 ease-out hover:shadow-[var(--elev-2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] sm:w-auto lg:h-14"
                onClick={() => openModal()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {PRIMARY_CTA}
              </motion.button>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] px-[var(--space-sm)] font-[family-name:var(--font-display)] text-sm font-[var(--font-weight-medium)] leading-5 text-[var(--color-text)] underline decoration-[var(--color-accent)] decoration-2 underline-offset-4 transition-colors duration-200 ease-out hover:text-[var(--color-success)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] lg:h-14"
              >
                {SECONDARY_CTA}
              </a>
            </motion.div>
            <motion.form
              className="flex flex-col gap-[var(--space-sm)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-md)] shadow-[var(--elev-1)] sm:max-w-xl"
              onSubmit={handleInlineSubmit}
              variants={itemVariants}
              custom={0.45}
              noValidate
            >
              <div className="flex flex-col gap-[var(--space-sm)] sm:flex-row">
                <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-xs)]">
                  <label className="sr-only" htmlFor="hero-zip">
                    {ZIP_LABEL}
                  </label>
                  <input
                    id="hero-zip"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={inlineZip}
                    onChange={(event) => {
                      setInlineZip(event.target.value.trim());
                      setInlineResult(null);
                    }}
                    onBlur={() => setInlineTouched(true)}
                    placeholder={ZIP_PLACEHOLDER}
                    aria-invalid={inlineZipIsInvalid}
                    aria-describedby={inlineStatusId}
                    className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]"
                  />
                </div>
                <motion.button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-display)] text-sm font-[var(--font-weight-semibold)] leading-5 text-[var(--color-cta-text)] shadow-[var(--elev-1)] transition-shadow duration-200 ease-out hover:shadow-[var(--elev-2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-36"
                  disabled={inlineChecking}
                  aria-busy={inlineChecking}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {inlineChecking ? CHECKING_LABEL : CHECK_AVAILABILITY}
                </motion.button>
              </div>
              <div id={inlineStatusId} className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]" aria-live="polite">
                {inlineZipIsInvalid ? INLINE_VALIDATION : INLINE_HELPER}
              </div>
              {inlineResult ? (
                <div className="flex flex-col gap-[var(--space-xs)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-sm)]">
                  <div className="flex flex-wrap items-center gap-[var(--space-xs)]">
                    <span className="inline-flex min-h-7 items-center rounded-[var(--radius-round)] bg-[var(--color-accent)] px-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-accent-text)]">
                      {inlineResult.chip}
                    </span>
                    <button
                      type="button"
                      className="rounded-[var(--radius-round)] px-[var(--space-xs)] font-[family-name:var(--font-display)] text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-[18px] text-[var(--color-text)] underline decoration-[var(--color-accent)] decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
                      onClick={() => openModal(inlineZip)}
                    >
                      {PRIMARY_CTA}
                    </button>
                  </div>
                  <p className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                    {inlineResult.message}
                  </p>
                </div>
              ) : null}
            </motion.form>
          </div>
          <motion.figure
            className="w-full justify-self-center lg:max-w-md lg:justify-self-end"
            variants={itemVariants}
            custom={0.25}
          >
            <ProjectImage id="hero" className="h-auto w-full rounded-[var(--radius-md)] shadow-[var(--elev-1)]" />
          </motion.figure>
        </div>
      </motion.section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[var(--space-md)]" role="presentation">
          <button
            type="button"
            aria-label="Close availability modal"
            className="absolute inset-0 cursor-default bg-[color-mix(in_srgb,var(--color-text)_32%,transparent)]"
            onClick={closeModal}
          />
          <motion.div
            className="relative max-h-[min(90vh,44rem)] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-lg)] text-[var(--color-text)] shadow-[var(--elev-2)] md:p-[var(--space-xl)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial="hidden"
            animate="show"
            variants={modalPanelVariants}
            onKeyDown={handleModalKeyDown}
          >
            <div className="flex items-start justify-between gap-[var(--space-md)]">
              <div className="flex flex-col gap-[var(--space-xs)]">
                <h2 id={titleId} className="font-[family-name:var(--font-display)] text-[length:var(--type-md)] font-[var(--font-weight-semibold)] leading-[30px] text-[var(--color-text)]">
                  {MODAL_TITLE}
                </h2>
                <p id={descriptionId} className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">
                  Enter your email and ZIP to join early access.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-xs)] font-[family-name:var(--font-display)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
            <form className="mt-[var(--space-lg)] flex flex-col gap-[var(--space-md)]" onSubmit={handleModalSubmit} noValidate>
              <div className="flex flex-col gap-[var(--space-xs)]">
                <label className="sr-only" htmlFor="modal-email">
                  Email
                </label>
                <input
                  ref={emailInputRef}
                  id="modal-email"
                  type="email"
                  autoComplete="email"
                  value={modalEmail}
                  onChange={(event) => setModalEmail(event.target.value.trim())}
                  placeholder={EMAIL_PLACEHOLDER}
                  aria-invalid={modalError.length > 0 && !EMAIL_PATTERN.test(modalEmail)}
                  className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]"
                />
              </div>
              <div className="grid grid-cols-1 gap-[var(--space-md)] sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
                <div className="flex flex-col gap-[var(--space-xs)]">
                  <label className="sr-only" htmlFor="modal-name">
                    Name
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    autoComplete="given-name"
                    value={modalName}
                    onChange={(event) => setModalName(event.target.value)}
                    placeholder="First name"
                    className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]"
                  />
                </div>
                <div className="flex flex-col gap-[var(--space-xs)]">
                  <label className="sr-only" htmlFor="modal-zip">
                    {ZIP_LABEL}
                  </label>
                  <input
                    id="modal-zip"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={modalZip}
                    onChange={(event) => setModalZip(event.target.value.trim())}
                    placeholder={ZIP_PLACEHOLDER}
                    aria-invalid={modalError.length > 0 && !ZIP_PATTERN.test(modalZip)}
                    className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]"
                  />
                </div>
              </div>
              <label className="flex items-start gap-[var(--space-sm)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={modalConsent}
                  onChange={(event) => setModalConsent(event.target.checked)}
                  aria-invalid={modalError.length > 0 && !modalConsent}
                  className="mt-[var(--space-xxs)] h-4 w-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] accent-[var(--color-cta-bg)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]"
                />
                <span>{CONSENT_COPY}</span>
              </label>
              {modalError.length > 0 ? (
                <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)]" role="alert">
                  {modalError}
                </p>
              ) : null}
              {modalDuplicate ? (
                <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)]" role="status">
                  {DUPLICATE_NOTICE}
                </p>
              ) : null}
              {modalResult ? (
                <div id={modalStatusId} className="flex flex-col gap-[var(--space-xs)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)]" role="status" aria-live="polite">
                  <span className="inline-flex w-fit min-h-7 items-center rounded-[var(--radius-round)] bg-[var(--color-accent)] px-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-accent-text)]">
                    {modalResult.chip}
                  </span>
                  <p className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                    {modalResult.message}
                  </p>
                </div>
              ) : null}
              <div className="flex flex-col gap-[var(--space-sm)] sm:flex-row">
                <motion.button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-display)] text-sm font-[var(--font-weight-semibold)] leading-5 text-[var(--color-cta-text)] shadow-[var(--elev-1)] transition-shadow duration-200 ease-out hover:shadow-[var(--elev-2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70 lg:h-14"
                  disabled={modalSubmitting}
                  aria-busy={modalSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {modalSubmitting ? CHECKING_LABEL : PRIMARY_CTA}
                </motion.button>
                <motion.button
                  type="button"
                  className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-lg)] font-[family-name:var(--font-display)] text-sm font-[var(--font-weight-semibold)] leading-5 text-[var(--color-text)] shadow-[var(--elev-1)] transition-shadow duration-200 ease-out hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70 lg:h-14"
                  disabled={modalSubmitting}
                  aria-busy={modalSubmitting}
                  onClick={() => {
                    void submitModal().finally(() => setModalSubmitting(false));
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {modalSubmitting ? CHECKING_LABEL : CHECK_AVAILABILITY}
                </motion.button>
              </div>
              {modalResult ? (
                <a
                  href="#pricing"
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] px-[var(--space-md)] font-[family-name:var(--font-display)] text-sm font-[var(--font-weight-semibold)] leading-5 text-[var(--color-text)] underline decoration-[var(--color-accent)] decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
                >
                  {SUCCESS_FOLLOW_UP}
                </a>
              ) : null}
            </form>
          </motion.div>
        </div>
      ) : null}
    </>
  );
}
