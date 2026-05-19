"use client";

import { motion, type Variants } from "framer-motion";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { ProjectImage } from "@/app/components/ProjectImage";

type AvailabilityStatus = "served" | "pending";

type AvailabilityResult = Readonly<{
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
const PENDING_INLINE_MESSAGE = "We’re not live in this ZIP yet. Join early access and we will notify you when we expand.";
const MODAL_TITLE = "Check availability";
const EMAIL_PLACEHOLDER = "you@example.com";
const MODAL_VALIDATION = "Please enter a valid email and a 5-digit ZIP code.";
const DUPLICATE_NOTICE = "This ZIP and email are already on our list. We just sent a confirmation.";
const MODAL_SUCCESS_MESSAGE = "Great. WalkBuddy serves your ZIP. You will receive a confirmation email with next steps.";
const MODAL_PENDING_MESSAGE = "We’re not live yet. Join early access and we’ll notify you when we expand.";
const SUCCESS_FOLLOW_UP = "View booking details";
const CONSENT_COPY = "I agree to receive WalkBuddy availability and waitlist emails.";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 36 },
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
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.42,
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
    transition: { duration: 0.24, ease: "easeOut" },
  },
};

function getAvailability(zip: string): AvailabilityStatus {
  return AUSTIN_CORE_ZIPS.has(zip) ? "served" : "pending";
}

function getInlineResult(zip: string): AvailabilityResult {
  const status = getAvailability(zip);

  return status === "served"
    ? { status, chip: SUCCESS_CHIP, message: SUCCESS_INLINE_MESSAGE }
    : { status, chip: PENDING_CHIP, message: PENDING_INLINE_MESSAGE };
}

function getModalResult(zip: string): AvailabilityResult {
  const status = getAvailability(zip);

  return status === "served"
    ? { status, chip: SUCCESS_CHIP, message: MODAL_SUCCESS_MESSAGE }
    : { status, chip: PENDING_CHIP, message: MODAL_PENDING_MESSAGE };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getResponseStatus(value: unknown): MarketingResponse {
  if (!isRecord(value)) {
    return {};
  }

  if (value.availability_status === "served" || value.availability_status === "pending") {
    return { availability_status: value.availability_status };
  }

  if (value.status === "served" || value.status === "pending" || value.status === "duplicate") {
    return { status: value.status };
  }

  if (value.duplicate === true) {
    return { duplicate: true };
  }

  return {};
}

function waitForAvailability(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 450);
  });
}

export default function Hero(): JSX.Element {
  const [inlineZip, setInlineZip] = useState("");
  const [inlineTouched, setInlineTouched] = useState(false);
  const [inlineChecking, setInlineChecking] = useState(false);
  const [inlineResult, setInlineResult] = useState<AvailabilityResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEmail, setModalEmail] = useState("");
  const [modalZip, setModalZip] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalConsent, setModalConsent] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalDuplicate, setModalDuplicate] = useState(false);
  const [modalResult, setModalResult] = useState<AvailabilityResult | null>(null);
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

    if (!modalConsent || !EMAIL_PATTERN.test(modalEmail) || !ZIP_PATTERN.test(modalZip)) {
      setModalError(MODAL_VALIDATION);
      return;
    }

    setModalSubmitting(true);

    const signupKey = `${modalEmail.toLowerCase()}-${modalZip}`;
    const payload = {
      email: modalEmail,
      zip: modalZip,
      name: modalName.trim().length > 0 ? modalName.trim() : undefined,
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
        headers: { "Content-Type": "application/json" },
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
  }

  async function handleModalSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await submitModal();
    setModalSubmitting(false);
  }

  const handleSecondaryModalCheck = (): void => {
    void submitModal().finally(() => setModalSubmitting(false));
  };

  return (
    <>
      <motion.section
        id="hero"
        aria-label="WalkBuddy hero signup and ZIP availability"
        className="overflow-hidden py-24 text-left lg:py-32"
        style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
      >
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 md:px-6 lg:grid-cols-2 lg:gap-12">
          <div className="flex max-w-xl flex-col gap-4">
            <motion.p className="sr-only" variants={itemVariants} custom={0}>
              WalkBuddy Austin early access
            </motion.p>
            <motion.h1
              className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-display)", lineHeight: 1.15, color: "var(--color-text)" }}
              variants={itemVariants}
              custom={0.05}
            >
              {HERO_HEADLINE}
            </motion.h1>
            <motion.p
              className="max-w-lg text-base font-medium"
              style={{ fontFamily: "var(--font-body)", lineHeight: "24px", color: "var(--color-text)" }}
              variants={itemVariants}
              custom={0.15}
            >
              {HERO_SUBHEADLINE}
            </motion.p>
            <motion.p
              className="text-sm font-medium"
              style={{ fontFamily: "var(--font-body)", lineHeight: "20px", color: "var(--color-muted)" }}
              variants={itemVariants}
              custom={0.25}
            >
              {HERO_PRICING}
            </motion.p>
            <motion.p
              className="text-xs"
              style={{ fontFamily: "var(--font-body)", lineHeight: "18px", color: "var(--color-muted)" }}
              variants={itemVariants}
              custom={0.3}
            >
              {TRUST_ROW}
            </motion.p>
            <motion.div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center" variants={itemVariants} custom={0.35}>
              <motion.button
                type="button"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl px-6 text-sm font-semibold shadow-sm transition-shadow duration-200 ease-out hover:shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 sm:w-auto lg:h-14"
                style={{ backgroundColor: "var(--color-cta-bg)", color: "var(--color-cta-text)", fontFamily: "var(--font-display)", outlineColor: "var(--color-accent)" }}
                onClick={() => openModal()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {PRIMARY_CTA}
              </motion.button>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-xl px-4 text-sm font-medium underline decoration-2 underline-offset-4 transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 lg:h-14"
                style={{ color: "var(--color-text)", textDecorationColor: "var(--color-accent)", fontFamily: "var(--font-display)", outlineColor: "var(--color-accent)" }}
              >
                {SECONDARY_CTA}
              </a>
            </motion.div>
            <motion.form
              className="flex flex-col gap-3 rounded-xl border p-4 shadow-sm sm:max-w-xl"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
              onSubmit={handleInlineSubmit}
              variants={itemVariants}
              custom={0.45}
              noValidate
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
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
                    className="h-11 w-full rounded-xl border px-4 text-base focus:outline focus:outline-4 focus:outline-offset-0"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)", outlineColor: "var(--color-accent)" }}
                  />
                </div>
                <motion.button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold shadow-sm transition-shadow duration-200 ease-out hover:shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-36"
                  style={{ backgroundColor: "var(--color-cta-bg)", color: "var(--color-cta-text)", fontFamily: "var(--font-display)", outlineColor: "var(--color-accent)" }}
                  disabled={inlineChecking}
                  aria-busy={inlineChecking}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {inlineChecking ? CHECKING_LABEL : CHECK_AVAILABILITY}
                </motion.button>
              </div>
              <div id={inlineStatusId} className="text-xs" style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", lineHeight: "18px" }} aria-live="polite">
                {inlineZipIsInvalid ? INLINE_VALIDATION : INLINE_HELPER}
              </div>
              {inlineResult ? (
                <div className="flex flex-col gap-2 rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex min-h-7 items-center rounded-full px-3 text-xs font-medium" style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)", fontFamily: "var(--font-body)" }}>
                      {inlineResult.chip}
                    </span>
                    <button
                      type="button"
                      className="rounded-full px-2 text-xs font-semibold underline decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2"
                      style={{ color: "var(--color-text)", textDecorationColor: "var(--color-accent)", fontFamily: "var(--font-display)", outlineColor: "var(--color-accent)" }}
                      onClick={() => openModal(inlineZip)}
                    >
                      {PRIMARY_CTA}
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-text)", fontFamily: "var(--font-body)", lineHeight: "18px" }}>
                    {inlineResult.message}
                  </p>
                </div>
              ) : null}
            </motion.form>
          </div>
          <motion.figure className="w-full justify-self-center lg:max-w-md lg:justify-self-end" variants={itemVariants} custom={0.25}>
            <ProjectImage id="hero" className="block h-auto w-full rounded-xl shadow-sm" />
          </motion.figure>
        </div>
      </motion.section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
          <button type="button" aria-label="Close availability modal" className="absolute inset-0 cursor-default" style={{ backgroundColor: "color-mix(in srgb, var(--color-text) 32%, transparent)" }} onClick={closeModal} />
          <motion.div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-md md:p-8"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial="hidden"
            animate="show"
            variants={modalPanelVariants}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h2 id={titleId} className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)", lineHeight: "30px" }}>
                  {MODAL_TITLE}
                </h2>
                <p id={descriptionId} className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", lineHeight: "18px" }}>
                  Enter your email and ZIP to join early access.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-2 text-xs font-medium focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)", fontFamily: "var(--font-display)", outlineColor: "var(--color-accent)" }}
                onClick={closeModal}
              >
                Close
              </button>
            </div>
            <form className="mt-6 flex flex-col gap-4" onSubmit={handleModalSubmit} noValidate>
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
                className="h-11 w-full rounded-xl border px-4 text-base focus:outline focus:outline-4 focus:outline-offset-0"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)", outlineColor: "var(--color-accent)" }}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
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
                    className="h-11 w-full rounded-xl border px-4 text-base focus:outline focus:outline-4 focus:outline-offset-0"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)", outlineColor: "var(--color-accent)" }}
                  />
                </div>
                <div>
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
                    className="h-11 w-full rounded-xl border px-4 text-base focus:outline focus:outline-4 focus:outline-offset-0"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)", outlineColor: "var(--color-accent)" }}
                  />
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-xl border p-3 text-xs" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)", fontFamily: "var(--font-body)", lineHeight: "18px" }}>
                <input
                  type="checkbox"
                  checked={modalConsent}
                  onChange={(event) => setModalConsent(event.target.checked)}
                  aria-invalid={modalError.length > 0 && !modalConsent}
                  className="mt-1 h-4 w-4 rounded border focus:outline focus:outline-4 focus:outline-offset-2"
                  style={{ accentColor: "var(--color-cta-bg)", outlineColor: "var(--color-accent)" }}
                />
                <span>{CONSENT_COPY}</span>
              </label>
              {modalError.length > 0 ? (
                <p className="rounded-xl border p-3 text-xs font-medium" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)", fontFamily: "var(--font-body)", lineHeight: "18px" }} role="alert">
                  {modalError}
                </p>
              ) : null}
              {modalDuplicate ? (
                <p className="rounded-xl border p-3 text-xs font-medium" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)", fontFamily: "var(--font-body)", lineHeight: "18px" }} role="status">
                  {DUPLICATE_NOTICE}
                </p>
              ) : null}
              {modalResult ? (
                <div id={modalStatusId} className="flex flex-col gap-2 rounded-xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }} role="status" aria-live="polite">
                  <span className="inline-flex w-fit min-h-7 items-center rounded-full px-3 text-xs font-medium" style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)", fontFamily: "var(--font-body)" }}>
                    {modalResult.chip}
                  </span>
                  <p className="text-xs" style={{ color: "var(--color-text)", fontFamily: "var(--font-body)", lineHeight: "18px" }}>
                    {modalResult.message}
                  </p>
                </div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <motion.button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl px-6 text-sm font-semibold shadow-sm transition-shadow duration-200 ease-out hover:shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70 lg:h-14"
                  style={{ backgroundColor: "var(--color-cta-bg)", color: "var(--color-cta-text)", fontFamily: "var(--font-display)", outlineColor: "var(--color-accent)" }}
                  disabled={modalSubmitting}
                  aria-busy={modalSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {modalSubmitting ? CHECKING_LABEL : PRIMARY_CTA}
                </motion.button>
                <motion.button
                  type="button"
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl border px-6 text-sm font-semibold shadow-sm transition-shadow duration-200 ease-out hover:shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70 lg:h-14"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-display)", outlineColor: "var(--color-accent)" }}
                  disabled={modalSubmitting}
                  aria-busy={modalSubmitting}
                  onClick={handleSecondaryModalCheck}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {modalSubmitting ? CHECKING_LABEL : CHECK_AVAILABILITY}
                </motion.button>
              </div>
              {modalResult ? (
                <a
                  href="#pricing"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold underline decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2"
                  style={{ color: "var(--color-text)", textDecorationColor: "var(--color-accent)", fontFamily: "var(--font-display)", outlineColor: "var(--color-accent)" }}
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
