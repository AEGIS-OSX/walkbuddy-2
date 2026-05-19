"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent } from "react";

type AvailabilityStatus = "served" | "pending";
type SignupResult = AvailabilityStatus | "duplicate";

type MarketingSignupResponse = {
  status: "ok";
  availability_status: SignupResult;
  pricing_range: "$18–$25";
  city?: "Austin";
  earliest_beta_date?: string;
  expansion_quarter?: string;
};

type SignupPayload = {
  email: string;
  zip: string;
  name?: string;
  consent: boolean;
  utm?: Record<string, string>;
  source?: string;
};

type OpenSignupModalDetail = {
  zip?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const zipPattern = /^\d{5}$/;
const validationError = "Please enter a valid email and a 5-digit ZIP code.";
const duplicateMessage = "This ZIP and email are already on our list. We just sent a confirmation.";
const checkingLabel = "Checking ZIP...";
const successChip = "Service available";
const successMessage = "Great. WalkBuddy serves your ZIP. You will receive a confirmation email with next steps.";
const pendingChip = "Join city waitlist";
const pendingMessage = `We’re not live yet. Join early access and we’ll notify you when we expand.`;
const networkErrorMessage = "We could not complete your signup. Please try again.";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(", ");

function normalizeZip(value: string): string {
  return value.replace(/\D/g, "").slice(0, 5);
}

function isValidEmail(value: string): boolean {
  return emailPattern.test(value.trim());
}

function isValidZip(value: string): boolean {
  return zipPattern.test(value.trim());
}

function readUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  params.forEach((value: string, key: string) => {
    if (key.toLowerCase().startsWith("utm_")) {
      utm[key] = value;
    }
  });

  return utm;
}

function getLocalAvailability(zip: string): AvailabilityStatus {
  return zip.startsWith("787") ? "served" : "pending";
}

function isOpenSignupModalDetail(value: unknown): value is OpenSignupModalDetail {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return record.zip === undefined || typeof record.zip === "string";
}

function isMarketingSignupResponse(value: unknown): value is MarketingSignupResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const validAvailability = record.availability_status === "served"
    || record.availability_status === "pending"
    || record.availability_status === "duplicate";

  return record.status === "ok"
    && validAvailability
    && record.pricing_range === "$18–$25";
}

async function parseMarketingResponse(response: Response): Promise<MarketingSignupResponse | null> {
  try {
    const body: unknown = await response.json();

    return isMarketingSignupResponse(body) ? body : null;
  } catch {
    return null;
  }
}

export default function SignupModal() {
  const prefersReducedMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const dialogRef = useRef<HTMLElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<SignupResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const trimmedEmail = email.trim();
  const trimmedZip = zip.trim();
  const emailValid = isValidEmail(trimmedEmail);
  const zipValid = isValidZip(trimmedZip);
  const busy = isSubmitting || isChecking;
  const served = result === "served";
  const pending = result === "pending";
  const duplicate = result === "duplicate";

  const clearFeedback = useCallback((): void => {
    setError("");
    setResult(null);
  }, []);

  const closeModal = useCallback((): void => {
    if (!busy) {
      setIsOpen(false);
    }
  }, [busy]);

  useEffect(() => {
    function handleOpenSignupModal(event: Event): void {
      const detail = event instanceof CustomEvent && isOpenSignupModalDetail(event.detail) ? event.detail : undefined;

      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setIsOpen(true);
      setResult(null);
      setError("");

      if (detail?.zip) {
        setZip(normalizeZip(detail.zip));
      }
    }

    window.addEventListener("open-signup-modal", handleOpenSignupModal);

    return () => {
      window.removeEventListener("open-signup-modal", handleOpenSignupModal);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      previousFocusRef.current?.focus();
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(dialogRef.current.querySelectorAll(focusableSelector)).filter(
        (element): element is HTMLElement => element instanceof HTMLElement
          && !element.hasAttribute("disabled")
          && element.getAttribute("aria-hidden") !== "true",
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!dialogRef.current.contains(activeElement)) {
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
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal, isOpen]);

  function handleOverlayMouseDown(): void {
    closeModal();
  }

  function handleDialogMouseDown(event: ReactMouseEvent<HTMLElement>): void {
    event.stopPropagation();
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>): void {
    setEmail(event.target.value);
    clearFeedback();
  }

  function handleZipChange(event: ChangeEvent<HTMLInputElement>): void {
    setZip(normalizeZip(event.target.value));
    clearFeedback();
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>): void {
    setName(event.target.value);
    clearFeedback();
  }

  function handleConsentChange(event: ChangeEvent<HTMLInputElement>): void {
    setConsent(event.target.checked);
    setError("");
  }

  async function handleAvailabilityCheck(): Promise<void> {
    if (!zipValid) {
      setResult(null);
      setError(validationError);
      return;
    }

    setError("");
    setResult(null);
    setIsChecking(true);

    window.setTimeout(() => {
      setResult(getLocalAvailability(trimmedZip));
      setIsChecking(false);
    }, prefersReducedMotion ? 0 : 240);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!emailValid || !zipValid || !consent) {
      setResult(null);
      setError(validationError);
      return;
    }

    const utm = readUtmParams();
    const source = document.referrer.trim();
    const payload: SignupPayload = {
      email: trimmedEmail,
      zip: trimmedZip,
      ...(name.trim().length > 0 ? { name: name.trim() } : {}),
      consent,
      ...(Object.keys(utm).length > 0 ? { utm } : {}),
      ...(source.length > 0 ? { source } : {}),
    };

    setError("");
    setResult(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MARKETING_API_BASE}/marketing-signups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const parsedResponse = await parseMarketingResponse(response);

      if (response.status === 409 || parsedResponse?.availability_status === "duplicate") {
        setResult("duplicate");
        return;
      }

      if (response.status === 400) {
        setError(validationError);
        return;
      }

      if (!response.ok) {
        setError(networkErrorMessage);
        return;
      }

      const availabilityStatus = parsedResponse?.availability_status === "served" || parsedResponse?.availability_status === "pending"
        ? parsedResponse.availability_status
        : getLocalAvailability(trimmedZip);

      setResult(availabilityStatus);
      window.dispatchEvent(
        new CustomEvent("wb:form_success", {
          detail: {
            availability_status: availabilityStatus,
            zip: trimmedZip,
            utm,
          },
        }),
      );
    } catch {
      setError(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex min-h-dvh items-end justify-center bg-[var(--color-text)]/40 px-[var(--space-md)] py-[var(--space-lg)] font-[family-name:var(--font-body)] text-[var(--color-text)] backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.2, ease: "easeOut" }}
          onMouseDown={handleOverlayMouseDown}
        >
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            className="w-full max-w-xl origin-center overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-lg)] text-[var(--color-text)] shadow-[var(--elev-2)] outline-none sm:p-[var(--space-xl)]"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.6, ease: "easeOut" }}
            onMouseDown={handleDialogMouseDown}
          >
            <header className="flex items-start justify-between gap-[var(--space-md)]">
              <div className="min-w-0 space-y-[var(--space-xs)]">
                <p
                  id={descriptionId}
                  className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]"
                >
                  WalkBuddy early access
                </p>
                <h2
                  id={titleId}
                  className="font-[family-name:var(--font-display)] text-[length:var(--type-md)] font-[var(--font-weight-semibold)] leading-[30px] tracking-[-0.02em] text-[var(--color-text)]"
                >
                  Check availability
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close signup modal"
                disabled={busy}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-bg)] font-[family-name:var(--font-display)] text-[length:var(--type-sm)] font-[var(--font-weight-medium)] leading-none text-[var(--color-text)] transition duration-200 ease-out hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={closeModal}
              >
                ×
              </button>
            </header>

            <form
              className="mt-[var(--space-lg)] flex flex-col gap-[var(--space-md)]"
              noValidate
              aria-describedby={statusId}
              onSubmit={handleSubmit}
            >
              <label className="block space-y-[var(--space-xs)]">
                <span className="sr-only">Email</span>
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  aria-label="Email"
                  aria-invalid={error === validationError && !emailValid}
                  aria-describedby={statusId}
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  disabled={busy}
                  className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] py-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] caret-[var(--color-text)] outline-none transition duration-200 ease-out placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/40 disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:opacity-70"
                  onChange={handleEmailChange}
                />
              </label>

              <div className="grid gap-[var(--space-md)] sm:grid-cols-2">
                <label className="block space-y-[var(--space-xs)]">
                  <span className="sr-only">ZIP code</span>
                  <input
                    type="text"
                    required
                    aria-label="ZIP code"
                    aria-invalid={error === validationError && !zipValid}
                    aria-describedby={statusId}
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="postal-code"
                    placeholder="ZIP code"
                    value={zip}
                    disabled={busy}
                    className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] py-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] caret-[var(--color-text)] outline-none transition duration-200 ease-out placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/40 disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:opacity-70"
                    onChange={handleZipChange}
                  />
                </label>

                <label className="block space-y-[var(--space-xs)]">
                  <span className="sr-only">First name</span>
                  <input
                    type="text"
                    aria-label="First name"
                    autoComplete="given-name"
                    placeholder="First name (optional)"
                    value={name}
                    disabled={busy}
                    className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] py-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] caret-[var(--color-text)] outline-none transition duration-200 ease-out placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/40 disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:opacity-70"
                    onChange={handleNameChange}
                  />
                </label>
              </div>

              <label className="flex items-start gap-[var(--space-sm)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  disabled={busy}
                  aria-describedby={statusId}
                  className="mt-[var(--space-xxs)] min-h-4 min-w-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] accent-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                  onChange={handleConsentChange}
                />
                <span className="text-[var(--color-text)]">
                  I agree to receive WalkBuddy availability and early access emails.
                </span>
              </label>

              <div className="flex flex-col gap-[var(--space-sm)] sm:flex-row sm:items-center">
                <motion.button
                  type="submit"
                  aria-busy={isSubmitting}
                  disabled={busy}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] font-[family-name:var(--font-display)] text-[length:var(--type-body)] font-[var(--font-weight-semibold)] leading-[22px] text-[var(--color-cta-text)] shadow-[var(--elev-1)] transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:text-[var(--color-muted)] sm:w-auto lg:min-h-14"
                  whileHover={!busy && !prefersReducedMotion ? { scale: 1.02 } : undefined}
                  whileTap={!busy && !prefersReducedMotion ? { scale: 0.98 } : undefined}
                >
                  {isSubmitting ? checkingLabel : "Join the Waitlist"}
                </motion.button>

                <motion.button
                  type="button"
                  aria-busy={isChecking}
                  disabled={busy}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-lg)] font-[family-name:var(--font-display)] text-[length:var(--type-body)] font-[var(--font-weight-medium)] leading-[22px] text-[var(--color-text)] transition duration-200 ease-out hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  whileHover={!busy && !prefersReducedMotion ? { scale: 1.02 } : undefined}
                  whileTap={!busy && !prefersReducedMotion ? { scale: 0.98 } : undefined}
                  onClick={handleAvailabilityCheck}
                >
                  {isChecking ? checkingLabel : "Check availability"}
                </motion.button>
              </div>

              <div
                id={statusId}
                className="min-h-20 space-y-[var(--space-sm)]"
                aria-live="polite"
                aria-atomic="true"
              >
                {busy ? (
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-md)]">
                    <div className="h-2 w-2/3 animate-pulse rounded-[var(--radius-round)] bg-[var(--color-accent)]"></div>
                    <p className="mt-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">
                      Checking ZIP...
                    </p>
                  </div>
                ) : null}

                {error ? (
                  <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                    {error}
                  </p>
                ) : null}

                {duplicate ? (
                  <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                    {duplicateMessage}
                  </p>
                ) : null}

                {served || pending ? (
                  <motion.div
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-md)] shadow-[var(--elev-1)]"
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.01 : 0.24, ease: "easeOut" }}
                  >
                    <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
                      <span className={served ? "inline-flex min-h-7 items-center rounded-[var(--radius-round)] bg-[var(--color-accent)] px-[var(--space-sm)] font-[family-name:var(--font-display)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-accent-text)]" : "inline-flex min-h-7 items-center rounded-[var(--radius-round)] bg-[var(--color-surface)] px-[var(--space-sm)] font-[family-name:var(--font-display)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)]"}>
                        {served ? successChip : pendingChip}
                      </span>

                      {served ? (
                        <a
                          href="/thank-you?availability=served"
                          className="rounded-[var(--radius-sm)] font-[family-name:var(--font-display)] text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-[18px] text-[var(--color-text)] underline decoration-[var(--color-border)] underline-offset-4 transition duration-200 ease-out hover:decoration-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
                        >
                          View booking details
                        </a>
                      ) : null}
                    </div>
                    <p className="mt-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">
                      {served ? successMessage : pendingMessage}
                    </p>
                  </motion.div>
                ) : null}
              </div>
            </form>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
