"use client";

import { useState, useEffect, useRef } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

type SignupModalProps = {
  open: boolean;
  onClose: () => void;
  prefill?: {
    email?: string;
    zip?: string;
    name?: string;
  };
};

type AvailabilityStatus = "served" | "pending";

type ModalState = "idle" | "loading" | "served" | "pending" | "duplicate" | "error";

type InvalidField = "email" | "zip" | "consent";

type StringMap = {
  [key: string]: string;
};

type UnknownMap = {
  [key: string]: unknown;
};

type SignupFormEvent = FormEvent & {
  currentTarget: HTMLFormElement;
};

type SignupDialogKeyboardEvent = KeyboardEvent & {
  currentTarget: HTMLDialogElement;
};

type OverlayMouseEvent = ReactMouseEvent & {
  currentTarget: HTMLDivElement;
};

type MarketingResponse = {
  availability_status?: AvailabilityStatus;
  pricing_range?: string;
  eta_text?: string;
  duplicate?: boolean;
  error?: string;
};

const MODAL_TITLE = "Check availability";
const EMAIL_PLACEHOLDER = "you@example.com";
const ZIP_PLACEHOLDER = "ZIP code";
const PRIMARY_SUBMIT_LABEL = "Join the Waitlist";
const SECONDARY_BUTTON_LABEL = "Check availability";
const VALIDATION_ERROR = "Please enter a valid email and a 5-digit ZIP code.";
const DUPLICATE_ENTRY = "This ZIP and email are already on our list. We just sent a confirmation.";
const CHECKING_STATE = "Checking ZIP...";
const SUCCESS_CHIP = "Service available";
const SUCCESS_MESSAGE = "Great. WalkBuddy serves your ZIP. You will receive a confirmation email with next steps.";
const PENDING_CHIP = "Join city waitlist";
const PENDING_MESSAGE = `We’re not live yet. Join early access and we’ll notify you when we expand.`;
const CONSENT_LABEL = "I agree to receive updates and marketing emails.";
const FOLLOW_UP_CTA = "View booking details";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const zipPattern = /^\d{5}$/;

function isRecord(value: unknown): value is UnknownMap {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseMarketingResponse(value: unknown): MarketingResponse {
  if (!isRecord(value)) {
    return {};
  }

  const availabilityValue = readString(value.availability_status);
  const availability = availabilityValue === "served" || availabilityValue === "pending" ? availabilityValue : undefined;

  return {
    availability_status: availability,
    pricing_range: readString(value.pricing_range),
    eta_text: readString(value.eta_text),
    duplicate: value.duplicate === true,
    error: readString(value.error),
  };
}

function collectUtmParams(): StringMap {
  const params = new URLSearchParams(window.location.search);
  const utm: StringMap = {};

  params.forEach((value, key) => {
    if (key.startsWith("utm_")) {
      utm[key] = value;
    }
  });

  return utm;
}

export default function SignupModal(props: SignupModalProps): JSX.Element | null {
  const { open, onClose, prefill } = props;
  const [portalElement, setPortalElement] = useState(null as HTMLElement | null);
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [zip, setZip] = useState(prefill?.zip ?? "");
  const [name, setName] = useState(prefill?.name ?? "");
  const [consent, setConsent] = useState(false);
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [validationMessage, setValidationMessage] = useState("");
  const [submitErrorTarget, setSubmitErrorTarget] = useState<InvalidField | null>(null);
  const [pricingRange, setPricingRange] = useState(null as string | null);
  const [etaText, setEtaText] = useState(null as string | null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const dialogRef = useRef(null as HTMLDialogElement | null);
  const initialFocusRef = useRef(null as HTMLInputElement | null);
  const emailRef = useRef(null as HTMLInputElement | null);
  const zipRef = useRef(null as HTMLInputElement | null);
  const consentRef = useRef(null as HTMLInputElement | null);
  const closeTimerRef = useRef(null as number | null);

  useEffect(() => {
    setPortalElement(document.getElementById("portal-root") ?? document.body);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = (): void => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setEmail(prefill?.email ?? "");
    setZip(prefill?.zip ?? "");
    setName(prefill?.name ?? "");
    setConsent(false);
    setModalState("idle");
    setValidationMessage("");
    setSubmitErrorTarget(null);
    setPricingRange(null);
    setEtaText(null);

    window.setTimeout(() => {
      initialFocusRef.current?.focus();
    }, 0);
  }, [open, prefill?.email, prefill?.name, prefill?.zip]);

  useEffect(() => {
    if (!submitErrorTarget) {
      return;
    }

    if (submitErrorTarget === "email") {
      emailRef.current?.focus();
    }

    if (submitErrorTarget === "zip") {
      zipRef.current?.focus();
    }

    if (submitErrorTarget === "consent") {
      consentRef.current?.focus();
    }
  }, [submitErrorTarget, validationMessage]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const closeModal = (): void => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    onClose();
  };

  const completeSubmission = (availability: AvailabilityStatus, response: MarketingResponse = {}): void => {
    setModalState(availability);
    setValidationMessage("");
    setPricingRange(response.pricing_range ?? null);
    setEtaText(response.eta_text ?? null);

    window.dispatchEvent(
      new CustomEvent("form_success", {
        detail: {
          zip,
          availability,
        },
      }),
    );

    closeTimerRef.current = window.setTimeout(() => {
      onClose();

      if (window.location.hash.toLowerCase().includes("thank-you")) {
        window.location.assign("/thank-you");
      }
    }, 1200);
  };

  const validateForm = (): InvalidField | null => {
    const trimmedEmail = email.trim();
    const trimmedZip = zip.trim();

    if (!emailPattern.test(trimmedEmail)) {
      return "email";
    }

    if (!zipPattern.test(trimmedZip)) {
      return "zip";
    }

    if (!consent) {
      return "consent";
    }

    return null;
  };

  const submitSignup = async (): Promise<void> => {
    const invalidField = validateForm();

    if (invalidField) {
      setModalState("error");
      setValidationMessage(VALIDATION_ERROR);
      setSubmitErrorTarget(invalidField);
      return;
    }

    setModalState("loading");
    setValidationMessage("");
    setSubmitErrorTarget(null);

    const payload = {
      email: email.trim(),
      zip: zip.trim(),
      name: name.trim() ? name.trim() : undefined,
      utm: collectUtmParams(),
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

      if (response.status === 409) {
        setModalState("duplicate");
        setValidationMessage(DUPLICATE_ENTRY);
        return;
      }

      if (response.status === 404) {
        completeSubmission("pending");
        return;
      }

      const data = parseMarketingResponse(await response.json().catch(() => null));

      if (data.duplicate || data.error === "duplicate") {
        setModalState("duplicate");
        setValidationMessage(DUPLICATE_ENTRY);
        return;
      }

      completeSubmission(data.availability_status ?? "pending", data);
    } catch {
      completeSubmission("pending");
    }
  };

  const handleSubmit = (event: SignupFormEvent): void => {
    event.preventDefault();
    void submitSignup();
  };

  const handleDialogKeyDown = (event: SignupDialogKeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableSelector = "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex=\"-1\"] )";
    const queryResult = dialogRef.current?.querySelectorAll(focusableSelector) ?? [];
    const focusableElements = (Array.from(queryResult) as HTMLElement[]).filter(
      (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
    );

    if (focusableElements.length === 0) {
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

  const handleOverlayMouseDown = (event: OverlayMouseEvent): void => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  };

  const goToBookingDetails = (): void => {
    window.location.assign("/thank-you");
  };

  if (!open || !portalElement) {
    return null;
  }

  const isLoading = modalState === "loading";
  const hasSuccessState = modalState === "served" || modalState === "pending";
  const statusChip = modalState === "served" ? SUCCESS_CHIP : PENDING_CHIP;
  const statusMessage = modalState === "served" ? SUCCESS_MESSAGE : PENDING_MESSAGE;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex min-h-screen items-end justify-center bg-[color-mix(in_srgb,var(--color-text)_36%,transparent)] px-[var(--space-md)] py-[var(--space-lg)] sm:items-center"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: "easeOut" }}
      onMouseDown={handleOverlayMouseDown}
    >
      <motion.dialog
        ref={dialogRef}
        id="signup-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-modal-title"
        aria-describedby="signup-modal-description"
        open
        onKeyDown={handleDialogKeyDown}
        className="m-0 w-full max-w-[36rem] border border-[color:var(--color-border)] bg-[var(--color-bg)] p-0 text-[var(--color-text)] backdrop:bg-[transparent]"
        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: "easeOut" }}
      >
        <div className="bg-[var(--color-bg)] rounded-[var(--radius-md)] shadow-[var(--elev-2)] p-6 md:p-8 text-[var(--color-text)]">
          <div className="flex items-start justify-between gap-[var(--space-md)]">
            <div className="space-y-[var(--space-xs)]">
              <p className="font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-muted)]">
                WalkBuddy early access
              </p>
              <h2
                id="signup-modal-title"
                className="font-[family-name:var(--font-display)] text-[length:var(--type-md)] font-semibold leading-[30px] text-[var(--color-text)] md:text-[length:var(--type-lg)] md:leading-[36px]"
              >
                {MODAL_TITLE}
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close signup modal"
              onClick={closeModal}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-round)] border border-[color:var(--color-border)] bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-medium leading-[22px] text-[var(--color-text)] transition-transform duration-200 ease-out hover:scale-[1.02] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] active:scale-[0.98]"
            >
              ×
            </button>
          </div>

          <p
            id="signup-modal-description"
            className="mt-[var(--space-sm)] max-w-[32rem] font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-normal leading-[22px] text-[var(--color-muted)]"
          >
            Enter your email and ZIP to confirm whether WalkBuddy serves your area.
          </p>

          <form className="mt-[var(--space-lg)] space-y-[var(--space-md)]" onSubmit={handleSubmit} noValidate>
            <div className="space-y-[var(--space-xs)]">
              <label
                htmlFor="signup-email"
                className="block font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-medium leading-[20px] text-[var(--color-text)]"
              >
                Email
              </label>
              <input
                ref={(node) => {
                  emailRef.current = node;
                  initialFocusRef.current = node;
                }}
                id="signup-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={EMAIL_PLACEHOLDER}
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                aria-invalid={submitErrorTarget === "email"}
                aria-describedby="signup-status"
                disabled={isLoading}
                className="h-11 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] transition-[border-color,box-shadow] duration-200 ease-out focus-visible:border-[color:var(--color-accent)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-70"
              ></input>
            </div>

            <div className="space-y-[var(--space-xs)]">
              <label
                htmlFor="signup-zip"
                className="block font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-medium leading-[20px] text-[var(--color-text)]"
              >
                ZIP code
              </label>
              <input
                ref={zipRef}
                id="signup-zip"
                name="zip"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                placeholder={ZIP_PLACEHOLDER}
                value={zip}
                onChange={(event) => setZip(event.currentTarget.value.replace(/\D/g, "").slice(0, 5))}
                aria-invalid={submitErrorTarget === "zip"}
                aria-describedby="signup-status"
                disabled={isLoading}
                className="h-11 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] transition-[border-color,box-shadow] duration-200 ease-out focus-visible:border-[color:var(--color-accent)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-70"
              ></input>
            </div>

            <div className="space-y-[var(--space-xs)]">
              <label
                htmlFor="signup-name"
                className="block font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-medium leading-[20px] text-[var(--color-text)]"
              >
                Name
              </label>
              <input
                id="signup-name"
                name="name"
                type="text"
                autoComplete="given-name"
                placeholder="First name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                disabled={isLoading}
                className="h-11 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] transition-[border-color,box-shadow] duration-200 ease-out focus-visible:border-[color:var(--color-accent)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-70"
              ></input>
            </div>

            <label className="flex items-start gap-[var(--space-sm)] rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
              <input
                ref={consentRef}
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.currentTarget.checked)}
                aria-invalid={submitErrorTarget === "consent"}
                disabled={isLoading}
                className="mt-[var(--space-xxs)] h-5 w-5 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] accent-[var(--color-primary)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-70"
              ></input>
              <span>{CONSENT_LABEL}</span>
            </label>

            <div className="flex flex-col gap-[var(--space-sm)] pt-[var(--space-xs)] sm:flex-row sm:items-center">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={prefersReducedMotion || isLoading ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion || isLoading ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-8 font-[family-name:var(--font-display)] text-[length:var(--type-body)] font-semibold leading-[22px] text-[var(--color-text)] shadow-none transition-[filter] duration-200 ease-out hover:brightness-[0.99] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isLoading ? CHECKING_STATE : PRIMARY_SUBMIT_LABEL}
              </motion.button>

              <button
                type="button"
                onClick={() => void submitSignup()}
                disabled={isLoading}
                className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-[transparent] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-medium leading-[22px] text-[var(--color-text)] underline decoration-[color:var(--color-accent)] decoration-2 underline-offset-4 transition-transform duration-200 ease-out hover:scale-[1.01] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {SECONDARY_BUTTON_LABEL}
              </button>
            </div>
          </form>

          <div
            id="signup-status"
            aria-live="polite"
            className="mt-[var(--space-md)] min-h-[3.5rem] rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[var(--color-surface)] p-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)]"
          >
            {isLoading ? <p>{CHECKING_STATE}</p> : null}

            {validationMessage ? (
              <p className="font-medium text-[var(--color-text)]">{validationMessage}</p>
            ) : null}

            {hasSuccessState ? (
              <div className="space-y-[var(--space-sm)]">
                <span className="inline-flex rounded-[var(--radius-round)] bg-[var(--color-accent)] px-[var(--space-sm)] py-[var(--space-xxs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-text)]">
                  {statusChip}
                </span>
                <p>{statusMessage}</p>
                {pricingRange ? <p className="text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">Estimated pricing: {pricingRange}</p> : null}
                {etaText ? <p className="text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">Timeline: {etaText}</p> : null}
                <button
                  type="button"
                  onClick={goToBookingDetails}
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-text)] transition-transform duration-200 ease-out hover:scale-[1.02] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] active:scale-[0.98]"
                >
                  {FOLLOW_UP_CTA}
                </button>
              </div>
            ) : null}

            {!isLoading && !validationMessage && !hasSuccessState ? (
              <p className="text-[var(--color-muted)]">Enter your ZIP to see if we serve your area.</p>
            ) : null}
          </div>
        </div>
      </motion.dialog>
    </motion.div>,
    portalElement,
  );
}
