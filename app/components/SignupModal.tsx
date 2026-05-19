"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type AvailabilityStatus = "served" | "pending";

type SignupModalProps = {
  open: boolean;
  onClose: () => void;
  prefillZip?: string;
};

type SignupResponse = {
  error?: string;
  availability_status?: AvailabilityStatus;
};

const servedZips: Record<string, true> = {
  "78701": true,
  "78704": true,
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(", ");

const validationError = "Please enter a valid email and a 5-digit ZIP code.";
const duplicateEntryMessage = "This ZIP and email are already on our list. We just sent a confirmation.";
const networkErrorMessage = "Something went wrong. Please try again in a moment.";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: "easeOut",
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: {
      duration: 0.18,
      ease: "easeOut",
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidZip(value: string): boolean {
  return /^\d{5}$/.test(value.trim());
}

function getAvailability(zip: string): AvailabilityStatus {
  return servedZips[zip.trim()] ? "served" : "pending";
}

function getUtmParams(): Record<string, string> | undefined {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  params.forEach((value: string, key: string) => {
    if (key.toLowerCase().startsWith("utm_")) {
      utm[key] = value;
    }
  });

  return Object.keys(utm).length > 0 ? utm : undefined;
}

function isSignupResponse(value: unknown): value is SignupResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const validError = record.error === undefined || typeof record.error === "string";
  const validAvailability = record.availability_status === undefined
    || record.availability_status === "served"
    || record.availability_status === "pending";

  return validError && validAvailability;
}

export default function SignupModal({ open, onClose, prefillZip = "" }: SignupModalProps): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState(prefillZip);
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [availability, setAvailability] = useState(null as AvailabilityStatus | null);
  const [validationMessage, setValidationMessage] = useState("");
  const [duplicateMessage, setDuplicateMessage] = useState("");
  const [networkMessage, setNetworkMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const panelRef = useRef(null as HTMLDivElement | null);
  const closeButtonRef = useRef(null as HTMLButtonElement | null);
  const previousFocusRef = useRef(null as HTMLElement | null);
  const wasOpenRef = useRef(false);

  const trimmedEmail = email.trim();
  const trimmedZip = zip.trim();
  const emailValid = isValidEmail(trimmedEmail);
  const zipValid = isValidZip(trimmedZip);
  const formValid = emailValid && zipValid;
  const submitDisabled = !consent || !formValid || isSubmitting;

  useEffect(() => {
    if (open) {
      setZip(prefillZip.replace(/\D/g, "").slice(0, 5));
      setAvailability(null);
      setValidationMessage("");
      setDuplicateMessage("");
      setNetworkMessage("");
    }
  }, [open, prefillZip]);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        previousFocusRef.current?.focus();
        wasOpenRef.current = false;
      }
      return;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    wasOpenRef.current = true;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusableElements = Array.from(panelRef.current.querySelectorAll(focusableSelector)).filter(
        (element): element is HTMLElement => element instanceof HTMLElement
          && !element.hasAttribute("disabled")
          && element.getAttribute("aria-hidden") !== "true",
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!panelRef.current.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  function clearMessages(): void {
    setValidationMessage("");
    setDuplicateMessage("");
    setNetworkMessage("");
  }

  function handleZipChange(event: React.ChangeEvent<HTMLInputElement>): void {
    setZip(event.target.value.replace(/\D/g, "").slice(0, 5));
    setAvailability(null);
    clearMessages();
  }

  function handleAvailabilityCheck(): void {
    if (!formValid) {
      setAvailability(null);
      setDuplicateMessage("");
      setNetworkMessage("");
      setValidationMessage("Please enter a valid email and a 5-digit ZIP code.");
      return;
    }

    setAvailability(getAvailability(trimmedZip));
    clearMessages();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!formValid) {
      setAvailability(null);
      setDuplicateMessage("");
      setNetworkMessage("");
      setValidationMessage("Please enter a valid email and a 5-digit ZIP code.");
      return;
    }

    if (!consent || isSubmitting) {
      return;
    }

    const nextAvailability = getAvailability(trimmedZip);
    const utm = getUtmParams();

    setAvailability(nextAvailability);
    clearMessages();
    setIsSubmitting(true);

    const payload = {
      email: trimmedEmail,
      zip: trimmedZip,
      ...(name.trim() ? { name: name.trim() } : {}),
      consent: true,
      ...(utm ? { utm } : {}),
      source: "landing",
    };

    try {
      const response = await fetch("/api/marketing-signups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let responseBody: SignupResponse | null = null;

      try {
        const parsedBody: unknown = await response.json();
        responseBody = isSignupResponse(parsedBody) ? parsedBody : null;
      } catch {
        responseBody = null;
      }

      if (response.status === 409 || responseBody?.error === duplicateEntryMessage) {
        setAvailability(null);
        setValidationMessage("");
        setNetworkMessage("");
        setDuplicateMessage("This ZIP and email are already on our list. We just sent a confirmation.");
        return;
      }

      if (!response.ok) {
        setNetworkMessage("Something went wrong. Please try again in a moment.");
        return;
      }

      if (responseBody?.availability_status) {
        setAvailability(responseBody.availability_status);
      }
    } catch {
      setNetworkMessage("Something went wrong. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-[var(--color-bg)] px-[var(--space-md)] py-[var(--space-lg)] font-[family-name:var(--font-body)] text-[var(--color-text)]"
          initial="hidden"
          animate="visible"
          exit="exit"
          aria-live="polite"
        >
          <motion.div
            className="absolute inset-0 bg-[var(--color-bg)] opacity-90"
            variants={overlayVariants}
            transition={{ duration: 0.2, ease: "easeOut" }}
            aria-hidden="true"
            onClick={onClose}
          ></motion.div>

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-modal-title"
            tabIndex={-1}
            className="relative w-full max-w-[520px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-lg)] shadow-[var(--elev-2)] outline-none sm:p-[var(--space-xl)]"
            variants={panelVariants}
          >
            <motion.div className="flex items-start justify-between gap-[var(--space-md)]" variants={childVariants}>
              <div className="space-y-[var(--space-xs)]">
                <p className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-muted)]">
                  WalkBuddy early access
                </p>
                <h2
                  id="signup-modal-title"
                  className="font-[family-name:var(--font-display)] text-[length:var(--type-md)] font-[var(--font-weight-semibold)] leading-[30px] tracking-[-0.02em] text-[var(--color-text)] sm:text-[length:var(--type-lg)] sm:leading-[36px]"
                >
                  Check availability
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close signup modal"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[length:var(--type-sm)] font-[var(--font-weight-medium)] leading-none text-[var(--color-muted)] transition duration-200 ease-out hover:text-[var(--color-text)] focus-visible:shadow-[0_0_0_4px_rgba(168,230,207,0.18)] focus-visible:outline-none"
                onClick={onClose}
              >
                ×
              </button>
            </motion.div>

            <motion.form className="mt-[var(--space-lg)] space-y-[var(--space-md)]" onSubmit={handleSubmit} noValidate variants={childVariants}>
              <div className="grid gap-[var(--space-md)] sm:grid-cols-2">
                <label className="space-y-[var(--space-xs)] sm:col-span-2">
                  <span className="block text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)]">
                    Email
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={validationMessage ? !emailValid : undefined}
                    className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] outline-none transition duration-200 ease-out placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:shadow-[0_0_0_4px_rgba(168,230,207,0.18)] focus-visible:outline-none"
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setAvailability(null);
                      clearMessages();
                    }}
                  ></input>
                </label>

                <label className="space-y-[var(--space-xs)]">
                  <span className="block text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)]">
                    ZIP
                  </span>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={5}
                    value={zip}
                    placeholder="ZIP code"
                    autoComplete="postal-code"
                    aria-invalid={validationMessage ? !zipValid : undefined}
                    className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] outline-none transition duration-200 ease-out placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:shadow-[0_0_0_4px_rgba(168,230,207,0.18)] focus-visible:outline-none"
                    onChange={handleZipChange}
                  ></input>
                </label>

                <label className="space-y-[var(--space-xs)]">
                  <span className="block text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)]">
                    First name
                  </span>
                  <input
                    type="text"
                    value={name}
                    placeholder="First name (optional)"
                    autoComplete="given-name"
                    className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] outline-none transition duration-200 ease-out placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:shadow-[0_0_0_4px_rgba(168,230,207,0.18)] focus-visible:outline-none"
                    onChange={(event) => {
                      setName(event.target.value);
                      clearMessages();
                    }}
                  ></input>
                </label>
              </div>

              <label className="flex items-start gap-[var(--space-sm)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-md)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  className="mt-[var(--space-xxs)] min-h-4 min-w-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] accent-[var(--color-accent)] focus-visible:shadow-[0_0_0_4px_rgba(168,230,207,0.18)] focus-visible:outline-none"
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    clearMessages();
                  }}
                ></input>
                <span>I agree to receive updates and marketing emails.</span>
              </label>

              <div className="flex flex-col gap-[var(--space-sm)] sm:flex-row sm:items-center">
                <motion.button
                  type="submit"
                  disabled={submitDisabled}
                  className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] text-[length:var(--type-body)] font-[var(--font-weight-semibold)] leading-[22px] text-[var(--color-cta-text)] transition duration-200 ease-out focus-visible:shadow-[0_0_0_4px_rgba(168,230,207,0.18)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-14 sm:min-w-[140px]"
                  whileHover={submitDisabled ? undefined : { y: -1 }}
                  whileTap={submitDisabled ? undefined : { scale: 0.98 }}
                >
                  {isSubmitting ? "Checking ZIP..." : "Join the Waitlist"}
                </motion.button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg)] px-[var(--space-md)] text-[length:var(--type-body)] font-[var(--font-weight-medium)] leading-[22px] text-[var(--color-text)] transition duration-200 ease-out hover:bg-[var(--color-surface)] focus-visible:shadow-[0_0_0_4px_rgba(168,230,207,0.18)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-14"
                  onClick={handleAvailabilityCheck}
                >
                  Check availability
                </button>
              </div>

              <motion.div className="min-h-20 space-y-[var(--space-sm)]" aria-live="polite" aria-atomic="true" variants={childVariants}>
                {validationMessage ? (
                  <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                    {validationMessage}
                  </p>
                ) : null}

                {duplicateMessage ? (
                  <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                    {duplicateMessage}
                  </p>
                ) : null}

                {networkMessage ? (
                  <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                    {networkMessage}
                  </p>
                ) : null}

                {availability ? (
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-md)]">
                    <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
                      <span className="inline-flex rounded-[var(--radius-round)] bg-[var(--color-accent)] px-[var(--space-sm)] py-[var(--space-xxs)] text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-[18px] text-[var(--color-accent-text)]">
                        {availability === "served" ? "Service available" : "Join city waitlist"}
                      </span>
                      {availability === "served" ? (
                        <a
                          href="/thank-you?availability_status=served&pricing_range=%2418%E2%80%93%2425"
                          className="text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-[18px] text-[var(--color-text)] underline decoration-[var(--color-border)] underline-offset-4 transition duration-200 ease-out hover:decoration-[var(--color-accent)] focus-visible:shadow-[0_0_0_4px_rgba(168,230,207,0.18)] focus-visible:outline-none"
                        >
                          View booking details
                        </a>
                      ) : null}
                    </div>
                    <p className="mt-[var(--space-sm)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">
                      {availability === "served"
                        ? "Great. WalkBuddy serves your ZIP. You will receive a confirmation email with next steps."
                        : "We’re not live yet. Join early access and we’ll notify you when we expand."}
                    </p>
                  </div>
                ) : null}
              </motion.div>
            </motion.form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
