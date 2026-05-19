"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent, MouseEvent as ReactMouseEvent } from "react";

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

const tokenStyles = {
  overlay: {
    fontFamily: "var(--font-body)",
    color: "var(--color-text)",
    padding: "var(--space-lg) var(--space-md)",
  },
  card: {
    padding: "var(--space-xl)",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
  },
  titleWrap: {
    gap: "var(--space-md)",
  },
  copyStack: {
    gap: "var(--space-xs)",
  },
  eyebrow: {
    color: "var(--color-muted)",
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--type-md)",
    fontWeight: "var(--font-weight-semibold)",
    lineHeight: "30px",
    letterSpacing: "-0.02em",
    color: "var(--color-text)",
  },
  closeButton: {
    borderRadius: "var(--radius-round)",
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    fontSize: "var(--type-sm)",
    fontWeight: "var(--font-weight-medium)",
  },
  form: {
    marginTop: "var(--space-lg)",
    gap: "var(--space-md)",
  },
  fieldGrid: {
    gap: "var(--space-md)",
  },
  consent: {
    gap: "var(--space-sm)",
    borderRadius: "var(--radius-md)",
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-bg)",
    padding: "var(--space-md)",
    fontSize: "var(--type-xs)",
    lineHeight: "18px",
    color: "var(--color-text)",
  },
  checkbox: {
    marginTop: "var(--space-xxs)",
    borderRadius: "var(--radius-sm)",
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-bg)",
    accentColor: "var(--color-accent)",
  },
  buttonRow: {
    gap: "var(--space-sm)",
  },
  statusArea: {
    minHeight: "5rem",
    gap: "var(--space-sm)",
  },
  statusBox: {
    borderRadius: "var(--radius-md)",
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-bg)",
    padding: "var(--space-md)",
  },
  statusSmallBox: {
    borderRadius: "var(--radius-md)",
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-bg)",
    padding: "var(--space-sm)",
    fontSize: "var(--type-xs)",
    lineHeight: "18px",
    color: "var(--color-text)",
  },
  skeleton: {
    width: "66%",
    height: "0.5rem",
    borderRadius: "var(--radius-round)",
    backgroundColor: "var(--color-accent)",
    opacity: 0.7,
  },
  mutedText: {
    marginTop: "var(--space-sm)",
    fontSize: "var(--type-xs)",
    lineHeight: "18px",
    color: "var(--color-muted)",
  },
  chipRow: {
    gap: "var(--space-sm)",
  },
  followUp: {
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text)",
    fontSize: "var(--type-xs)",
    fontWeight: "var(--font-weight-semibold)",
    lineHeight: "18px",
    textDecorationColor: "var(--color-border)",
  },
} satisfies Record<string, CSSProperties>;

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

export default function SignupModal({ open, onClose, prefillZip = "" }: SignupModalProps) {
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
  const [checking, setChecking] = useState(false);
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
  const busy = loading || checking;
  const canSubmit = !busy;

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
    setChecking(false);
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
    if (!busy) {
      closeModal();
    }
  }

  function stopDialogClick(event: ReactMouseEvent<HTMLDivElement>): void {
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

    setChecking(true);
    clearFeedback();

    try {
      await delay(300);
      setAvailability(getLocalAvailability(trimmedZip));
    } finally {
      setChecking(false);
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
          className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-black/40"
          style={tokenStyles.overlay}
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
            className="card relative w-full max-w-[540px] overflow-hidden outline-none"
            style={tokenStyles.card}
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.35, ease: "easeOut" }}
            onClick={stopDialogClick}
          >
            <div className="flex items-start justify-between" style={tokenStyles.titleWrap}>
              <div className="flex min-w-0 flex-col" style={tokenStyles.copyStack}>
                <p
                  id={descriptionId}
                  className="eyebrow"
                  style={tokenStyles.eyebrow}
                >
                  WalkBuddy early access
                </p>
                <h2
                  id={titleId}
                  style={tokenStyles.title}
                >
                  Check availability
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close signup modal"
                disabled={busy}
                className="inline-flex min-h-11 min-w-11 items-center justify-center border leading-none transition duration-200 ease-out hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
                style={tokenStyles.closeButton}
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              className="flex flex-col"
              style={tokenStyles.form}
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
                  disabled={busy}
                  className="field w-full"
                  onChange={handleEmailChange}
                />
              </label>

              <div className="grid sm:grid-cols-[1fr_1fr]" style={tokenStyles.fieldGrid}>
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
                    disabled={busy}
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
                    disabled={busy}
                    className="field w-full"
                    onChange={handleNameChange}
                  />
                </label>
              </div>

              <label className="flex items-start border" style={tokenStyles.consent}>
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  disabled={busy}
                  aria-describedby={statusId}
                  className="min-h-4 min-w-4 border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
                  style={tokenStyles.checkbox}
                  onChange={handleConsentChange}
                />
                <span className="block" style={{ color: "var(--color-text)" }}>
                  I agree to receive WalkBuddy availability and early access emails.
                </span>
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center" style={tokenStyles.buttonRow}>
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
                  disabled={busy}
                  className="btn-secondary inline-flex w-full items-center justify-center sm:w-auto"
                  whileHover={busy ? undefined : { scale: 1.02 }}
                  whileTap={busy ? undefined : { scale: 0.98 }}
                  onClick={handleAvailabilityCheck}
                >
                  {checking ? checkingLabel : "Check availability"}
                </motion.button>
              </div>

              <div
                id={statusId}
                className="flex flex-col"
                style={tokenStyles.statusArea}
                aria-live="polite"
                aria-atomic="true"
              >
                {busy ? (
                  <div className="border" style={tokenStyles.statusBox}>
                    <div style={tokenStyles.skeleton}></div>
                    <p style={tokenStyles.mutedText}>
                      Checking ZIP...
                    </p>
                  </div>
                ) : null}

                {error ? (
                  <p className="border" style={tokenStyles.statusSmallBox}>
                    {error}
                  </p>
                ) : null}

                {duplicate ? (
                  <p className="border" style={tokenStyles.statusSmallBox}>
                    This ZIP and email are already on our list. We just sent a confirmation.
                  </p>
                ) : null}

                {availability ? (
                  <motion.div
                    className="border"
                    style={tokenStyles.statusBox}
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.01 : 0.22, ease: "easeOut" }}
                  >
                    <div className="flex flex-wrap items-center" style={tokenStyles.chipRow}>
                      <span className={availability === "served" ? "chip-success" : "chip-pending"}>
                        {availability === "served" ? successChip : pendingChip}
                      </span>

                      {availability === "served" ? (
                        <a
                          href="/thank-you?availability_status=served"
                          className="underline underline-offset-4 transition duration-200 ease-out hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                          style={tokenStyles.followUp}
                        >
                          View booking details
                        </a>
                      ) : null}
                    </div>
                    <p style={tokenStyles.mutedText}>
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
