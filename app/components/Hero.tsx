"use client";

import { ProjectImage } from "@/app/components/ProjectImage";
import { motion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

type AvailabilityStatus = "served" | "pending" | "duplicate";
type InlineStatus = "idle" | "invalid" | "checking" | "served" | "pending";
type ModalStatus = "idle" | "checking" | "served" | "pending" | "duplicate" | "error";

type MarketingSignupPayload = {
  email: string;
  zip: string;
  name?: string;
  consent: true;
  utm?: Record<string, string>;
  source: "landing";
};

type MarketingSignupResponse = {
  availability_status?: AvailabilityStatus;
  status?: AvailabilityStatus;
  earliest_beta?: string;
  pricing_range?: string;
};

const ZIP_PATTERN = /^\d{5}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FOCUSABLE_SELECTOR = "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";
const INLINE_VALIDATION_MESSAGE = "Please enter a valid 5-digit ZIP code.";
const CHECKING_MESSAGE = "Checking ZIP...";
const SERVICE_AVAILABLE_CHIP = "Service available";
const CITY_WAITLIST_CHIP = "Join city waitlist";
const INLINE_SERVED_MESSAGE = "Great. WalkBuddy serves your ZIP. Select a time to book a walk.";
const INLINE_PENDING_MESSAGE = "We’re not live in this ZIP yet. Join early access and we will notify you when we expand.";
const MODAL_VALIDATION_ERROR = "Please enter a valid email and a 5-digit ZIP code.";
const DUPLICATE_MESSAGE = "This ZIP and email are already on our list. We just sent a confirmation.";
const MODAL_SERVED_MESSAGE = "Great. WalkBuddy serves your ZIP. You will receive a confirmation email with next steps.";
const MODAL_PENDING_MESSAGE = "We’re not live yet. Join early access and we’ll notify you when we expand.";

const heroEntrance = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const heroTransition = { duration: 0.6, ease: "easeOut" as const };

function getOptimisticAvailability(zip: string): Exclude<AvailabilityStatus, "duplicate"> {
  return zip.startsWith("787") || zip === "73301" ? "served" : "pending";
}

function getUtmParams(): Record<string, string> | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  params.forEach((value: string, key: string) => {
    if (key.startsWith("utm_") && value.trim().length > 0) {
      utm[key] = value;
    }
  });

  return Object.keys(utm).length > 0 ? utm : undefined;
}

async function postMarketingSignup(payload: MarketingSignupPayload): Promise<AvailabilityStatus> {
  const response = await fetch("/api/marketing-signups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data: MarketingSignupResponse = {};
  try {
    data = (await response.json()) as MarketingSignupResponse;
  } catch {
    data = {};
  }

  const responseStatus = data.availability_status ?? data.status;

  if (response.status === 409 || responseStatus === "duplicate") {
    return "duplicate";
  }

  if (!response.ok) {
    throw new Error("marketing-signup-failed");
  }

  if (responseStatus === "served" || responseStatus === "pending") {
    return responseStatus;
  }

  return getOptimisticAvailability(payload.zip);
}

export default function Hero() {
  const [zipValue, setZipValue] = useState<string>("");
  const [inlineStatus, setInlineStatus] = useState<InlineStatus>("idle");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalEmail, setModalEmail] = useState<string>("");
  const [modalZip, setModalZip] = useState<string>("");
  const [modalName, setModalName] = useState<string>("");
  const [modalConsent, setModalConsent] = useState<boolean>(false);
  const [modalStatus, setModalStatus] = useState<ModalStatus>("idle");
  const [modalError, setModalError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const inlineCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const isInlineInvalid = inlineStatus === "invalid";
  const isModalValidationError = modalError === MODAL_VALIDATION_ERROR;
  const isModalSuccess = modalStatus === "served" || modalStatus === "pending";

  useEffect(() => {
    return () => {
      if (inlineCheckTimeoutRef.current) {
        clearTimeout(inlineCheckTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      return undefined;
    }

    const modalNode = modalRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab" || !modalNode) {
        return;
      }

      const focusableElements = Array.from(modalNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusableElements.length === 0) {
        event.preventDefault();
        modalNode.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen, isSubmitting]);

  function closeModal(): void {
    if (isSubmitting) {
      return;
    }

    setIsModalOpen(false);
    setModalError("");
    setModalStatus("idle");
  }

  function openModal(): void {
    if (ZIP_PATTERN.test(zipValue)) {
      setModalZip(zipValue);
    }

    setIsModalOpen(true);
    setModalError("");
    setModalStatus("idle");
  }

  function handleInlineZipChange(value: string): void {
    setZipValue(value);
    if (inlineStatus !== "idle") {
      setInlineStatus("idle");
    }
  }

  function handleInlineZipSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (inlineCheckTimeoutRef.current) {
      clearTimeout(inlineCheckTimeoutRef.current);
    }

    if (!ZIP_PATTERN.test(zipValue)) {
      setInlineStatus("invalid");
      return;
    }

    setInlineStatus("checking");
    inlineCheckTimeoutRef.current = setTimeout(() => {
      setInlineStatus(getOptimisticAvailability(zipValue));
      setModalZip(zipValue);
    }, 500);
  }

  async function handleModalSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const email = modalEmail.trim();
    const zip = modalZip.trim();
    const name = modalName.trim();

    if (!EMAIL_PATTERN.test(email) || !ZIP_PATTERN.test(zip) || !modalConsent) {
      setModalStatus("error");
      setModalError(MODAL_VALIDATION_ERROR);
      return;
    }

    const payload: MarketingSignupPayload = {
      email,
      zip,
      consent: true,
      source: "landing",
    };

    if (name.length > 0) {
      payload.name = name;
    }

    const utm = getUtmParams();
    if (utm) {
      payload.utm = utm;
    }

    setIsSubmitting(true);
    setModalStatus("checking");
    setModalError("");

    try {
      const availabilityStatus = await postMarketingSignup(payload);

      if (availabilityStatus === "duplicate") {
        setModalStatus("duplicate");
        setModalError(DUPLICATE_MESSAGE);
        return;
      }

      setModalStatus(availabilityStatus);
      window.dispatchEvent(new CustomEvent("form_success", { detail: { zip, availability_status: availabilityStatus } }));
    } catch {
      setModalStatus("error");
      setModalError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOverlayKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      closeModal();
    }
  }

  function getInlineChipText(): string {
    if (inlineStatus === "served") {
      return SERVICE_AVAILABLE_CHIP;
    }

    if (inlineStatus === "pending") {
      return CITY_WAITLIST_CHIP;
    }

    return "";
  }

  function getInlineMessage(): string {
    if (inlineStatus === "invalid") {
      return INLINE_VALIDATION_MESSAGE;
    }

    if (inlineStatus === "checking") {
      return CHECKING_MESSAGE;
    }

    if (inlineStatus === "served") {
      return INLINE_SERVED_MESSAGE;
    }

    if (inlineStatus === "pending") {
      return INLINE_PENDING_MESSAGE;
    }

    return "Enter your ZIP to see if we serve your area.";
  }

  function getModalChipText(): string {
    if (modalStatus === "served") {
      return SERVICE_AVAILABLE_CHIP;
    }

    if (modalStatus === "pending") {
      return CITY_WAITLIST_CHIP;
    }

    return "";
  }

  function getModalMessage(): string {
    if (modalStatus === "served") {
      return MODAL_SERVED_MESSAGE;
    }

    if (modalStatus === "pending") {
      return MODAL_PENDING_MESSAGE;
    }

    return "";
  }

  return (
    <motion.section
      className="bg-[var(--color-bg)] px-[var(--space-lg)] py-[var(--space-4xl)] text-[var(--color-text)] md:py-[var(--space-5xl)]"
      initial="hidden"
      animate="visible"
      variants={heroEntrance}
      transition={heroTransition}
      aria-labelledby="hero-title"
    >
      <div className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-[var(--space-xl)] lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-center">
        <motion.div
          className="flex flex-col gap-[var(--space-lg)]"
          initial="hidden"
          animate="visible"
          variants={heroEntrance}
          transition={{ ...heroTransition, delay: 0.05 }}
        >
          <motion.p
            className="font-[family-name:var(--font-body)] text-[13px] font-medium leading-[18px] tracking-[0.2px] text-[var(--color-muted)]"
            variants={heroEntrance}
            transition={{ ...heroTransition, delay: 0.05 }}
          >
            Background-checked walkers — GPS recaps — Photo proof.
          </motion.p>

          <motion.h1
            id="hero-title"
            className="max-w-[12ch] font-[family-name:var(--font-display)] text-[28px] font-bold leading-[36px] text-[var(--color-text)] lg:text-[var(--type-xxl)] lg:leading-[48px]"
            variants={heroEntrance}
            transition={{ ...heroTransition, delay: 0.15 }}
          >
            Trusted local dog walks, on your schedule.
          </motion.h1>

          <motion.p
            className="max-w-[36rem] font-[family-name:var(--font-body)] text-[var(--type-body)] leading-[22px] text-[var(--color-text)] md:text-[16px] md:leading-[24px]"
            variants={heroEntrance}
            transition={{ ...heroTransition, delay: 0.25 }}
          >
            Book a vetted local walker, see photos and GPS proof.
          </motion.p>

          <motion.p
            className="w-fit rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-sm)] py-[var(--space-xs)] font-[family-name:var(--font-body)] text-[13px] font-medium leading-[18px] text-[var(--color-text)] shadow-[var(--elev-1)]"
            variants={heroEntrance}
            transition={{ ...heroTransition, delay: 0.3 }}
          >
            Launching in Austin, TX: estimated price per 30-min walk: $18–$25.
          </motion.p>

          <motion.form
            className="flex w-full max-w-[40rem] flex-col gap-[var(--space-sm)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-md)]"
            onSubmit={handleInlineZipSubmit}
            variants={heroEntrance}
            transition={{ ...heroTransition, delay: 0.35 }}
          >
            <label className="font-[family-name:var(--font-body)] text-[14px] font-medium leading-[20px] text-[var(--color-muted)]" htmlFor="hero-zip">
              ZIP code
            </label>
            <div className="grid grid-cols-1 gap-[var(--space-xs)] sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                id="hero-zip"
                className="h-[44px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-sm)] font-[family-name:var(--font-body)] text-[var(--type-body)] leading-[22px] text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] focus:shadow-[0_6px_18px_var(--color-shadow)] focus-visible:outline focus-visible:outline-[4px] focus-visible:outline-offset-[2px] focus-visible:outline-[var(--color-accent)]"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="78701"
                value={zipValue}
                onChange={(event) => handleInlineZipChange(event.target.value)}
                aria-invalid={isInlineInvalid}
                aria-describedby="hero-zip-status"
              ></input>
              <motion.button
                className="inline-flex h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-body)] text-[14px] font-semibold leading-[20px] text-[var(--color-cta-text)] outline-none transition focus-ring disabled:opacity-60"
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={inlineStatus === "checking"}
              >
                {inlineStatus === "checking" ? CHECKING_MESSAGE : "Check availability"}
              </motion.button>
            </div>
            <div className="flex min-h-[28px] flex-wrap items-center gap-[var(--space-xs)]" aria-live="polite" id="hero-zip-status">
              {getInlineChipText().length > 0 ? (
                <span className={inlineStatus === "served" ? "chip chip--success" : "chip"}>{getInlineChipText()}</span>
              ) : null}
              <p className={isInlineInvalid ? "font-[family-name:var(--font-body)] text-[13px] leading-[18px] text-[var(--color-text)]" : "font-[family-name:var(--font-body)] text-[13px] leading-[18px] text-[var(--color-muted)]"}>
                {getInlineMessage()}
              </p>
            </div>
          </motion.form>

          <motion.div
            className="flex flex-col gap-[var(--space-sm)] sm:flex-row"
            variants={heroEntrance}
            transition={{ ...heroTransition, delay: 0.4 }}
          >
            <motion.button
              id="signup"
              className="inline-flex h-[48px] w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-body)] text-[14px] font-semibold leading-[20px] text-[var(--color-cta-text)] outline-none transition focus-ring lg:h-[56px] sm:w-auto"
              type="button"
              onClick={openModal}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Join the Waitlist
            </motion.button>
            <motion.a
              className="inline-flex h-[48px] w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-lg)] font-[family-name:var(--font-body)] text-[14px] font-medium leading-[20px] text-[var(--color-text)] outline-none transition hover:bg-[var(--color-surface)] focus-ring lg:h-[56px] sm:w-auto"
              href="#how-it-works"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              How it works
            </motion.a>
          </motion.div>
        </motion.div>

        <motion.div
          className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-xs)] shadow-[var(--elev-2)] [&_img]:aspect-[4/3] [&_img]:h-auto [&_img]:w-full [&_img]:rounded-[var(--radius-md)] [&_img]:object-cover"
          initial="hidden"
          animate="visible"
          variants={heroEntrance}
          transition={{ ...heroTransition, delay: 0.45 }}
        >
          <ProjectImage id="hero" />
        </motion.div>
      </div>

      {isModalOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-text)_34%,transparent)] px-[var(--space-lg)] py-[var(--space-xl)]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
          onKeyDown={handleOverlayKeyDown}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <motion.div
            className="max-h-[calc(100vh-var(--space-xl))] w-full max-w-[540px] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-lg)] text-[var(--color-text)] shadow-[var(--elev-2)] outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-modal-title"
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, ease: [0.22, 0.9, 0.21, 1] }}
          >
            <div className="mb-[var(--space-lg)] flex items-start justify-between gap-[var(--space-md)]">
              <div className="flex flex-col gap-[var(--space-xs)]">
                <p className="font-[family-name:var(--font-body)] text-[13px] font-medium leading-[18px] text-[var(--color-muted)]">
                  WalkBuddy early access
                </p>
                <h2 id="signup-modal-title" className="font-[family-name:var(--font-display)] text-[var(--type-md)] font-semibold leading-[30px] text-[var(--color-text)] md:text-[28px] md:leading-[36px]">
                  Check availability
                </h2>
              </div>
              <motion.button
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[22px] leading-[22px] text-[var(--color-text)] outline-none transition hover:bg-[var(--color-surface)] focus-ring disabled:opacity-60"
                type="button"
                aria-label="Close signup modal"
                onClick={closeModal}
                ref={closeButtonRef}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
              >
                ×
              </motion.button>
            </div>

            <form className="flex flex-col gap-[var(--space-md)]" onSubmit={handleModalSubmit}>
              <label className="flex flex-col gap-[var(--space-xs)] font-[family-name:var(--font-body)] text-[14px] font-medium leading-[20px] text-[var(--color-muted)]" htmlFor="signup-name">
                First name
                <input
                  id="signup-name"
                  className="h-[44px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-sm)] font-[family-name:var(--font-body)] text-[var(--type-body)] font-normal leading-[22px] text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] focus:shadow-[0_6px_18px_var(--color-shadow)] focus-visible:outline focus-visible:outline-[4px] focus-visible:outline-offset-[2px] focus-visible:outline-[var(--color-accent)]"
                  type="text"
                  autoComplete="given-name"
                  value={modalName}
                  onChange={(event) => setModalName(event.target.value)}
                ></input>
              </label>

              <label className="flex flex-col gap-[var(--space-xs)] font-[family-name:var(--font-body)] text-[14px] font-medium leading-[20px] text-[var(--color-muted)]" htmlFor="signup-email">
                Email
                <input
                  id="signup-email"
                  className="h-[44px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-sm)] font-[family-name:var(--font-body)] text-[var(--type-body)] font-normal leading-[22px] text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] focus:shadow-[0_6px_18px_var(--color-shadow)] focus-visible:outline focus-visible:outline-[4px] focus-visible:outline-offset-[2px] focus-visible:outline-[var(--color-accent)]"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={modalEmail}
                  onChange={(event) => setModalEmail(event.target.value)}
                  aria-invalid={isModalValidationError && !EMAIL_PATTERN.test(modalEmail.trim())}
                  aria-describedby="signup-modal-status"
                  required
                ></input>
              </label>

              <label className="flex flex-col gap-[var(--space-xs)] font-[family-name:var(--font-body)] text-[14px] font-medium leading-[20px] text-[var(--color-muted)]" htmlFor="signup-zip">
                ZIP code
                <input
                  id="signup-zip"
                  className="h-[44px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-sm)] font-[family-name:var(--font-body)] text-[var(--type-body)] font-normal leading-[22px] text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] focus:shadow-[0_6px_18px_var(--color-shadow)] focus-visible:outline focus-visible:outline-[4px] focus-visible:outline-offset-[2px] focus-visible:outline-[var(--color-accent)]"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="ZIP code"
                  value={modalZip}
                  onChange={(event) => setModalZip(event.target.value)}
                  aria-invalid={isModalValidationError && !ZIP_PATTERN.test(modalZip.trim())}
                  aria-describedby="signup-modal-status"
                  required
                ></input>
              </label>

              <label className="grid grid-cols-[auto_1fr] items-start gap-[var(--space-sm)] font-[family-name:var(--font-body)] text-[13px] font-normal leading-[18px] text-[var(--color-text)]" htmlFor="signup-consent">
                <input
                  id="signup-consent"
                  className="mt-[var(--space-xxs)] h-[var(--space-lg)] w-[var(--space-lg)] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] accent-[var(--color-cta-bg)] outline-none focus-ring"
                  type="checkbox"
                  checked={modalConsent}
                  onChange={(event) => setModalConsent(event.target.checked)}
                  aria-invalid={isModalValidationError && !modalConsent}
                  required
                ></input>
                <span className="text-[var(--color-text)]">
                  I agree to receive WalkBuddy availability updates and confirmation emails.
                </span>
              </label>

              <div className="min-h-[52px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)]" aria-live="polite" id="signup-modal-status">
                {modalStatus === "checking" ? (
                  <div className="flex items-center gap-[var(--space-xs)]">
                    <span className="h-[18px] w-[18px] animate-spin rounded-[var(--radius-round)] border-2 border-[var(--color-border)] border-t-[var(--color-text)]" aria-hidden="true"></span>
                    <p className="font-[family-name:var(--font-body)] text-[13px] leading-[18px] text-[var(--color-muted)]">{CHECKING_MESSAGE}</p>
                  </div>
                ) : null}

                {isModalSuccess ? (
                  <div className="flex flex-col gap-[var(--space-xs)]">
                    <span className={modalStatus === "served" ? "chip chip--success w-fit" : "chip w-fit"}>{getModalChipText()}</span>
                    <p className="font-[family-name:var(--font-body)] text-[13px] leading-[18px] text-[var(--color-text)]">{getModalMessage()}</p>
                    <motion.a
                      className="mt-[var(--space-xs)] inline-flex h-[44px] w-fit items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[14px] font-medium leading-[20px] text-[var(--color-text)] outline-none transition hover:bg-[var(--color-bg)] focus-ring"
                      href="#availability"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      View booking details
                    </motion.a>
                  </div>
                ) : null}

                {modalError.length > 0 ? (
                  <p className="font-[family-name:var(--font-body)] text-[13px] leading-[18px] text-[var(--color-text)]">{modalError}</p>
                ) : null}

                {modalStatus === "idle" && modalError.length === 0 ? (
                  <p className="font-[family-name:var(--font-body)] text-[13px] leading-[18px] text-[var(--color-muted)]">Enter your email and ZIP to check WalkBuddy coverage.</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-[var(--space-sm)] sm:grid-cols-2">
                <motion.button
                  className="inline-flex h-[48px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-body)] text-[14px] font-semibold leading-[20px] text-[var(--color-cta-text)] outline-none transition focus-ring disabled:opacity-60 lg:h-[56px]"
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? CHECKING_MESSAGE : "Join the Waitlist"}
                </motion.button>
                <motion.button
                  className="inline-flex h-[48px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-lg)] font-[family-name:var(--font-body)] text-[14px] font-medium leading-[20px] text-[var(--color-text)] outline-none transition hover:bg-[var(--color-surface)] focus-ring disabled:opacity-60 lg:h-[56px]"
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? CHECKING_MESSAGE : "Check availability"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </motion.section>
  );
}
