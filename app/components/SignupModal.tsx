"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";

type AvailabilityStatus = "served" | "pending";

type SignupModalProps = {
  open: boolean;
  onClose: () => void;
  prefillZip?: string;
};

type MarketingResponse = {
  availability_status?: AvailabilityStatus;
  error?: string;
};

type SignupPayload = {
  email: string;
  zip: string;
  name?: string;
  utm: Record<string, string>;
  source: "landing";
};

declare global {
  interface Window {
    ENV?: {
      NEXT_PUBLIC_MARKETING_API?: string;
    };
  }
}

const emailPattern = /.+@.+\..+/;
const zipPattern = /^\d{5}$/;
const validationError = "Please enter a valid email and a 5-digit ZIP code.";
const duplicateEntry = "This ZIP and email are already on our list. We just sent a confirmation.";
const checkingLabel = "Checking ZIP...";
const successChip = "Service available";
const successMessage = "Great. WalkBuddy serves your ZIP. You will receive a confirmation email with next steps.";
const pendingChip = "Join city waitlist";
const pendingMessage = "We’re not live yet. Join early access and we’ll notify you when we expand.";
const networkError = "We could not complete your signup. Please try again.";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\")]",
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

function getLocalAvailability(zip: string): AvailabilityStatus {
  return zip.trim().startsWith("787") ? "served" : "pending";
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function readUtmParams(): Record<string, string> {
  const searchParams = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  searchParams.forEach((value: string, key: string) => {
    if (key.toLowerCase().startsWith("utm_")) {
      utm[key] = value;
    }
  });

  return utm;
}

function getMarketingApiBase(): string | undefined {
  const windowApi = typeof window !== "undefined" ? window.ENV?.NEXT_PUBLIC_MARKETING_API : undefined;
  const processApi = process.env.NEXT_PUBLIC_MARKETING_API;
  const apiBase = windowApi ?? processApi;

  return apiBase && apiBase.trim().length > 0 ? apiBase.replace(/\/$/, "") : undefined;
}

function isMarketingResponse(value: unknown): value is MarketingResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const errorValid = record.error === undefined || typeof record.error === "string";
  const availabilityValid = record.availability_status === undefined
    || record.availability_status === "served"
    || record.availability_status === "pending";

  return errorValid && availabilityValid;
}

function emitSignupSuccess(zip: string, availability: AvailabilityStatus): void {
  window.dispatchEvent(
    new CustomEvent("signup:success", {
      detail: {
        zip,
        availability,
      },
    }),
  );
}

export default function SignupModal({ open, onClose, prefillZip = "" }: SignupModalProps): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();

  const [email, setEmail] = useState("");
  const [zip, setZip] = useState(normalizeZip(prefillZip));
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState(false);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const hadOpenStateRef = useRef(false);

  const trimmedEmail = email.trim();
  const trimmedZip = zip.trim();
  const emailValid = isValidEmail(trimmedEmail);
  const zipValid = isValidZip(trimmedZip);
  const canSubmit = !loading;

  const clearFeedback = useCallback((): void => {
    setError("");
    setDuplicate(false);
  }, []);

  const closeModal = useCallback((): void => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      if (hadOpenStateRef.current) {
        previousFocusRef.current?.focus();
        hadOpenStateRef.current = false;
      }
      return;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    hadOpenStateRef.current = true;
    setZip(normalizeZip(prefillZip));
    setAvailability(null);
    setLoading(false);
    clearFeedback();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
    };
  }, [clearFeedback, open, prefillZip]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleDocumentKeyDown(event: KeyboardEvent): void {
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

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [closeModal, open]);

  function handleOverlayClick(): void {
    if (!loading) {
      closeModal();
    }
  }

  function stopDialogClick(event: ReactMouseEvent<HTMLDivElement>): void {
    event.stopPropagation();
  }

  function handleDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
    event.stopPropagation();
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>): void {
    setEmail(event.target.value);
    setAvailability(null);
    clearFeedback();
  }

  function handleZipChange(event: ChangeEvent<HTMLInputElement>): void {
    setZip(normalizeZip(event.target.value));
    setAvailability(null);
    clearFeedback();
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>): void {
    setName(event.target.value);
    clearFeedback();
  }

  function handleConsentChange(event: ChangeEvent<HTMLInputElement>): void {
    setConsent(event.target.checked);
    clearFeedback();
  }

  async function handleAvailabilityCheck(): Promise<void> {
    if (!zipValid) {
      setAvailability(null);
      setDuplicate(false);
      setError(validationError);
      return;
    }

    setLoading(true);
    clearFeedback();

    try {
      await delay(300);
      setAvailability(getLocalAvailability(trimmedZip));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!emailValid || !zipValid || !consent) {
      setAvailability(null);
      setDuplicate(false);
      setError(validationError);
      return;
    }

    const localAvailability = getLocalAvailability(trimmedZip);
    const apiBase = getMarketingApiBase();
    const payload: SignupPayload = {
      email: trimmedEmail,
      zip: trimmedZip,
      ...(name.trim().length > 0 ? { name: name.trim() } : {}),
      utm: readUtmParams(),
      source: "landing",
    };

    setLoading(true);
    clearFeedback();

    try {
      let finalAvailability = localAvailability;

      if (apiBase) {
        const response = await fetch(`${apiBase}/marketing-signups`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        let responseBody: MarketingResponse | null = null;

        try {
          const parsedBody: unknown = await response.json();
          responseBody = isMarketingResponse(parsedBody) ? parsedBody : null;
        } catch {
          responseBody = null;
        }

        if (response.status === 409 || responseBody?.error === duplicateEntry) {
          setAvailability(null);
          setDuplicate(true);
          setError("");
          return;
        }

        if (!response.ok) {
          setAvailability(null);
          setDuplicate(false);
          setError(networkError);
          return;
        }

        finalAvailability = responseBody?.availability_status ?? localAvailability;
      } else {
        await delay(600);
      }

      setAvailability(finalAvailability);
      emitSignupSuccess(trimmedZip, finalAvailability);
    } catch {
      setAvailability(null);
      setDuplicate(false);
      setError(networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-black/40 px-[var(--space-md)] py-[var(--space-lg)] font-[family-name:var(--font-body)] text-[var(--color-text)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.2, ease: "easeOut" }}
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            className="card relative w-full max-w-[540px] overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-bg)] p-[var(--space-xl)] outline-none"
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.35, ease: "easeOut" }}
            onClick={stopDialogClick}
            onKeyDown={handleDialogKeyDown}
          >
            <div className="flex items-start justify-between gap-[var(--space-md)]">
              <div className="min-w-0 space-y-[var(--space-xs)]">
                <p
                  id={descriptionId}
                  className="eyebrow text-[var(--color-muted)]"
                >
                  WalkBuddy early access
                </p>
                <h2
                  id={titleId}
                  className="font-[family-name:var(--font-display)] text-[length:var(--type-md)] font-[var(--font-weight-semibold)] leading-[30px] tracking-[-0.02em] text-[var(--color-text)] sm:text-[length:var(--type-lg)] sm:leading-[36px]"
                >
                  Check availability
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close signup modal"
                disabled={loading}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[length:var(--type-sm)] font-[var(--font-weight-medium)] leading-none text-[var(--color-text)] transition duration-200 ease-out hover:bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              className="mt-[var(--space-lg)] space-y-[var(--space-md)]"
              noValidate
              onSubmit={handleSubmit}
            >
              <label className="block">
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
                  disabled={loading}
                  className="field w-full"
                  onChange={handleEmailChange}
                />
              </label>

              <div className="grid gap-[var(--space-md)] sm:grid-cols-[1fr_1fr]">
                <label className="block">
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
                    disabled={loading}
                    className="field w-full"
                    onChange={handleZipChange}
                  />
                </label>

                <label className="block">
                  <span className="sr-only">First name</span>
                  <input
                    type="text"
                    aria-label="First name"
                    autoComplete="given-name"
                    placeholder="First name"
                    value={name}
                    disabled={loading}
                    className="field w-full"
                    onChange={handleNameChange}
                  />
                </label>
              </div>

              <label className="flex items-start gap-[var(--space-sm)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-md)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  disabled={loading}
                  aria-describedby={statusId}
                  className="mt-[var(--space-xxs)] min-h-4 min-w-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] accent-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  onChange={handleConsentChange}
                />
                <span className="block text-[var(--color-text)]">
                  I agree to receive WalkBuddy availability and early access emails.
                </span>
              </label>

              <div className="flex flex-col gap-[var(--space-sm)] sm:flex-row sm:items-center">
                <motion.button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn-primary inline-flex w-full items-center justify-center sm:w-auto"
                  whileHover={canSubmit ? { scale: 1.02 } : undefined}
                  whileTap={canSubmit ? { scale: 0.98 } : undefined}
                >
                  {loading ? checkingLabel : "Join the Waitlist"}
                </motion.button>

                <motion.button
                  type="button"
                  disabled={loading}
                  className="btn-secondary inline-flex w-full items-center justify-center sm:w-auto"
                  whileHover={loading ? undefined : { scale: 1.02 }}
                  whileTap={loading ? undefined : { scale: 0.98 }}
                  onClick={handleAvailabilityCheck}
                >
                  {loading ? checkingLabel : "Check availability"}
                </motion.button>
              </div>

              <div
                id={statusId}
                className="min-h-20 space-y-[var(--space-sm)]"
                aria-live="polite"
                aria-atomic="true"
              >
                {loading ? (
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-md)]">
                    <div className="h-2 w-2/3 rounded-[var(--radius-round)] bg-[var(--color-accent)] opacity-70"></div>
                    <p className="mt-[var(--space-sm)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">
                      Checking ZIP...
                    </p>
                  </div>
                ) : null}

                {error ? (
                  <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-sm)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                    {error}
                  </p>
                ) : null}

                {duplicate ? (
                  <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-sm)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                    This ZIP and email are already on our list. We just sent a confirmation.
                  </p>
                ) : null}

                {availability ? (
                  <motion.div
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-md)]"
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.01 : 0.22, ease: "easeOut" }}
                  >
                    <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
                      <span className={availability === "served" ? "chip-success" : "chip-pending"}>
                        {availability === "served" ? successChip : pendingChip}
                      </span>

                      {availability === "served" ? (
                        <a
                          href="/thank-you?availability_status=served"
                          className="rounded-[var(--radius-sm)] text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-[18px] text-[var(--color-text)] underline decoration-[var(--color-border)] underline-offset-4 transition duration-200 ease-out hover:decoration-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
                        >
                          View booking details
                        </a>
                      ) : null}
                    </div>
                    <p className="mt-[var(--space-sm)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">
                      {availability === "served" ? successMessage : pendingMessage}
                    </p>
                  </motion.div>
                ) : null}
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
