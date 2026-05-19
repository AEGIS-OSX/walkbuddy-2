"use client";

import { motion } from "framer-motion";
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

type AvailabilityStatus = "served" | "pending";

type ModalView = "form" | "loading" | "served" | "pending";

type SignupResponse = {
  availability_status?: AvailabilityStatus;
  pricing_range?: string;
  earliest_beta_date?: string;
  expansion_quarter?: string;
  duplicate?: boolean;
  error?: string;
};

type SignupPayload = {
  email: string;
  zip: string;
  consent: true;
  utm: Record<string, string>;
  source: "landing";
  name?: string;
};

type ModalPrefill = {
  email?: string;
  zip?: string;
  name?: string;
};

const MODAL_TITLE = "Check availability";
const EMAIL_PLACEHOLDER = "you@example.com";
const ZIP_PLACEHOLDER = "ZIP code";
const PRIMARY_BUTTON_LABEL = "Join the Waitlist";
const SECONDARY_BUTTON_LABEL = "Check availability";
const VALIDATION_ERROR = "Please enter a valid email and a 5-digit ZIP code.";
const DUPLICATE_ENTRY = "This ZIP and email are already on our list. We just sent a confirmation.";
const CHECKING_STATE_LABEL = "Checking ZIP...";
const SUCCESS_CHIP = "Service available";
const SUCCESS_MESSAGE = "Great. WalkBuddy serves your ZIP. You will receive a confirmation email with next steps.";
const PENDING_CHIP = "Join city waitlist";
const PENDING_MESSAGE = `We’re not live yet. Join early access and we’ll notify you when we expand.`;
const FOLLOW_UP_CTA = "View booking details";
const SERVED_PRICING_LINE = "Estimated price per 30-min walk: $18–$25.";
const SERVED_CONFIRMATION_NOTE = "Confirmation email on its way in ~5 minutes.";
const CONSENT_LABEL = "I agree to receive updates and marketing emails.";
const NAME_PLACEHOLDER = "First name";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const zipPattern = /^\d{5}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseSignupResponse(value: unknown): SignupResponse {
  if (!isRecord(value)) {
    return {};
  }

  const availability = readString(value.availability_status);

  return {
    availability_status: availability === "served" || availability === "pending" ? availability : undefined,
    pricing_range: readString(value.pricing_range),
    earliest_beta_date: readString(value.earliest_beta_date),
    expansion_quarter: readString(value.expansion_quarter),
    duplicate: value.duplicate === true,
    error: readString(value.error),
  };
}

function readUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  params.forEach((value, key) => {
    if (key.startsWith("utm_") || key === "source") {
      utm[key] = value;
    }
  });

  return utm;
}

function focusFirstElement(container: HTMLElement | null): void {
  const focusable = getFocusableElements(container);
  focusable[0]?.focus();
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }

  const selector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex=\"-1\"])";
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    return element.offsetParent !== null || element === document.activeElement;
  });
}

export default function SignupModal(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [view, setView] = useState<ModalView>("form");
  const [message, setMessage] = useState("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const zipRef = useRef<HTMLInputElement | null>(null);
  const consentRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = (): void => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    const openModal = (event: Event): void => {
      const customEvent = event as CustomEvent<ModalPrefill | undefined>;
      const prefill = customEvent.detail;

      setEmail(prefill?.email ?? "");
      setZip(prefill?.zip ?? "");
      setName(prefill?.name ?? "");
      setConsent(false);
      setView("form");
      setMessage("");
      setIsOpen(true);
    };

    window.addEventListener("open-signup-modal", openModal);

    return () => {
      window.removeEventListener("open-signup-modal", openModal);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.setTimeout(() => {
      focusFirstElement(cardRef.current);
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const closeModal = (): void => {
    if (view === "loading") {
      return;
    }

    setIsOpen(false);
  };

  const validateForm = (): boolean => {
    const trimmedEmail = email.trim();
    const trimmedZip = zip.trim();

    if (!emailPattern.test(trimmedEmail)) {
      setMessage(VALIDATION_ERROR);
      emailRef.current?.focus();
      return false;
    }

    if (!zipPattern.test(trimmedZip)) {
      setMessage(VALIDATION_ERROR);
      zipRef.current?.focus();
      return false;
    }

    if (!consent) {
      setMessage(VALIDATION_ERROR);
      consentRef.current?.focus();
      return false;
    }

    setMessage("");
    return true;
  };

  const completeSignup = (availabilityStatus: AvailabilityStatus): void => {
    setView(availabilityStatus);
    setMessage(availabilityStatus === "served" ? SUCCESS_MESSAGE : PENDING_MESSAGE);
  };

  const submitSignup = async (): Promise<void> => {
    if (!validateForm()) {
      setView("form");
      return;
    }

    setView("loading");
    setMessage(CHECKING_STATE_LABEL);

    const trimmedName = name.trim();
    const payload: SignupPayload = {
      email: email.trim(),
      zip: zip.trim(),
      consent: true,
      utm: readUtmParams(),
      source: "landing",
      ...(trimmedName ? { name: trimmedName } : {}),
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
        setView("form");
        setMessage(DUPLICATE_ENTRY);
        return;
      }

      const data = parseSignupResponse(await response.json().catch(() => null));

      if (data.duplicate || data.error === "duplicate") {
        setView("form");
        setMessage(DUPLICATE_ENTRY);
        return;
      }

      completeSignup(data.availability_status ?? "pending");
    } catch {
      completeSignup("pending");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void submitSignup();
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = getFocusableElements(cardRef.current);
    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  if (!isOpen || !portalTarget) {
    return <></>;
  }

  const isLoading = view === "loading";
  const isServed = view === "served";
  const isPending = view === "pending";
  const showResult = isServed || isPending;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-[var(--color-text)]/60 px-[var(--space-md)] py-[var(--space-lg)]"
      onMouseDown={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <motion.div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-modal-title"
        aria-describedby="signup-modal-status"
        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: "easeOut" }}
        className="relative max-h-[calc(100vh-var(--space-xl))] w-full max-w-xl overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-lg)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] shadow-[var(--elev-2)] md:p-[var(--space-xl)]"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={closeModal}
          disabled={isLoading}
          className="absolute right-[var(--space-md)] top-[var(--space-md)] inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[length:var(--type-sm)] leading-[24px] text-[var(--color-text)] transition-transform duration-200 ease-out hover:scale-[1.02] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          ×
        </button>

        <div className="pr-[var(--space-3xl)]">
          <h2
            id="signup-modal-title"
            className="font-[family-name:var(--font-display)] text-[length:var(--type-lg)] font-bold leading-[36px] text-[var(--color-text)] md:text-[length:var(--type-xxl)] md:leading-[48px]"
          >
            {MODAL_TITLE}
          </h2>
          <p className="mt-[var(--space-xs)] max-w-md font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-muted)] md:leading-[24px]">
            Enter your details to see current WalkBuddy availability for your ZIP.
          </p>
        </div>

        <div
          id="signup-modal-status"
          aria-live="polite"
          className="mt-[var(--space-lg)] min-h-[28px] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)]"
        >
          {message ? (
            <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-md)] py-[var(--space-sm)]">
              {message}
            </p>
          ) : null}
        </div>

        {showResult ? (
          <div className="mt-[var(--space-lg)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-md)]">
            <span
              className={
                isServed
                  ? "inline-flex min-h-7 items-center rounded-[var(--radius-round)] bg-[var(--color-accent)] px-[var(--space-sm)] py-[var(--space-xxs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-accent-text)]"
                  : "inline-flex min-h-7 items-center rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-sm)] py-[var(--space-xxs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] font-medium leading-[18px] text-[var(--color-text)]"
              }
            >
              {isServed ? SUCCESS_CHIP : PENDING_CHIP}
            </span>
            <p className="mt-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)]">
              {isServed ? SUCCESS_MESSAGE : PENDING_MESSAGE}
            </p>
            {isServed ? (
              <div className="mt-[var(--space-sm)] space-y-[var(--space-xs)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">
                <p>{SERVED_PRICING_LINE}</p>
                <p>{SERVED_CONFIRMATION_NOTE}</p>
                <motion.button
                  type="button"
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onClick={() => window.location.assign("/thank-you")}
                  className="mt-[var(--space-sm)] inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-8 font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-medium leading-[22px] text-[var(--color-text)] focus-visible:outline-none"
                >
                  {FOLLOW_UP_CTA}
                </motion.button>
              </div>
            ) : null}
          </div>
        ) : (
          <form className="mt-[var(--space-lg)] space-y-[var(--space-md)]" onSubmit={handleSubmit} noValidate>
            <div className="space-y-[var(--space-xs)]">
              <label
                htmlFor="signup-email"
                className="block font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-medium leading-[20px] text-[var(--color-text)]"
              >
                Email
              </label>
              <input
                ref={emailRef}
                id="signup-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder={EMAIL_PLACEHOLDER}
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                disabled={isLoading}
                aria-describedby="signup-modal-status"
                className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
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
                required
                placeholder={ZIP_PLACEHOLDER}
                value={zip}
                onChange={(event) => setZip(event.currentTarget.value.replace(/\D/g, "").slice(0, 5))}
                disabled={isLoading}
                aria-describedby="signup-modal-status"
                className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="space-y-[var(--space-xs)]">
              <label
                htmlFor="signup-name"
                className="block font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-medium leading-[20px] text-[var(--color-text)]"
              >
                First name
              </label>
              <input
                id="signup-name"
                name="name"
                type="text"
                autoComplete="given-name"
                placeholder={NAME_PLACEHOLDER}
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                disabled={isLoading}
                className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-md)] font-[family-name:var(--font-body)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <label className="flex items-start gap-[var(--space-sm)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
              <input
                ref={consentRef}
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.currentTarget.checked)}
                required
                disabled={isLoading}
                className="mt-[var(--space-xxs)] h-5 w-5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] accent-[var(--color-cta-bg)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span>{CONSENT_LABEL}</span>
            </label>

            <div className="flex flex-col gap-[var(--space-sm)] pt-[var(--space-xs)] sm:flex-row sm:items-center">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={prefersReducedMotion || isLoading ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion || isLoading ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-8 font-[family-name:var(--font-display)] text-[length:var(--type-body)] font-semibold leading-[22px] text-[var(--color-cta-text)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isLoading ? CHECKING_STATE_LABEL : PRIMARY_BUTTON_LABEL}
              </motion.button>

              <motion.button
                type="button"
                disabled={isLoading}
                onClick={() => void submitSignup()}
                whileHover={prefersReducedMotion || isLoading ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion || isLoading ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-8 font-[family-name:var(--font-body)] text-[length:var(--type-body)] font-medium leading-[22px] text-[var(--color-text)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {SECONDARY_BUTTON_LABEL}
              </motion.button>
            </div>
          </form>
        )}
      </motion.div>
    </div>,
    portalTarget,
  );
}
