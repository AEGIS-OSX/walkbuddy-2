"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

type Availability = "served" | "pending" | null;

type UTMParams = Record<string, string>;

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidZip(value: string) {
  return /^\d{5}$/.test(value.trim());
}

function getAvailability(value: string): Availability {
  if (!isValidZip(value)) {
    return null;
  }

  return value.startsWith("787") ? "served" : "pending";
}

function getUTMParams(): UTMParams {
  if (typeof window === "undefined") {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const utm: UTMParams = {};

  params.forEach((value, key) => {
    if (key.toLowerCase().startsWith("utm_")) {
      utm[key] = value;
    }
  });

  return utm;
}

export default function SignupModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [availability, setAvailability] = useState<Availability>(null);
  const [checking, setChecking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const emailValid = isValidEmail(email);
  const zipValid = isValidZip(zip);
  const formValid = emailValid && zipValid;
  const canSubmit = formValid && consent && !checking;
  const currentAvailability = availability ?? getAvailability(zip);
  const successMessage = currentAvailability === "served"
    ? "Great. WalkBuddy serves your ZIP. You will receive a confirmation email with next steps."
    : "We’re not live yet. Join early access and we’ll notify you when we expand.";

  const resetMessages = () => {
    setError("");
    setSubmitted(false);
  };

  const closeModal = () => {
    setOpen(false);
    setChecking(false);
    setError("");
  };

  const checkAvailability = () => {
    if (!formValid) {
      setSubmitted(false);
      setAvailability(null);
      setError("Please enter a valid email and a 5-digit ZIP code.");
      return;
    }

    setError("");
    setAvailability(getAvailability(zip));
  };

  useEffect(() => {
    const handleOpenSignupModal = (event: Event) => {
      const signupEvent = event as CustomEvent<{ zip?: string }>;
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
      setError("");
      setSubmitted(false);

      if (signupEvent.detail?.zip) {
        setZip(signupEvent.detail.zip);
        setAvailability(getAvailability(signupEvent.detail.zip));
      }
    };

    window.addEventListener("open-signup-modal", handleOpenSignupModal);

    return () => {
      window.removeEventListener("open-signup-modal", handleOpenSignupModal);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      previousFocusRef.current?.focus();
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusableElements = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
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
  }, [open]);

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    if (!formValid) {
      setSubmitted(false);
      setAvailability(null);
      setError("Please enter a valid email and a 5-digit ZIP code.");
      return;
    }

    if (!consent || checking) {
      return;
    }

    const nextAvailability = getAvailability(zip);
    setChecking(true);
    setError("");
    setAvailability(nextAvailability);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_MARKETING_API_URL ?? "", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          zip: zip.trim(),
          ...(name.trim() ? { name: name.trim() } : {}),
          consent: true,
          utm: getUTMParams(),
          source: "landing",
        }),
      });

      if (response.status === 409) {
        setSubmitted(false);
        setError("This ZIP and email are already on our list. We just sent a confirmation.");
        return;
      }

      if (!response.ok) {
        setSubmitted(false);
        setError("Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
      setError("");
    } catch {
      setSubmitted(false);
      setError("Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center px-4 py-6 font-[var(--font-body)] sm:px-6">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-black/35"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={closeModal}
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-modal-title"
        aria-describedby="signup-modal-description"
        className="relative w-full max-w-[32rem] overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-[var(--color-text)] shadow-[0_24px_80px_rgba(0,0,0,0.18)] outline-none sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">WalkBuddy early access</p>
            <h2 id="signup-modal-title" className="font-[var(--font-display)] text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">
              Check availability
            </h2>
            <p id="signup-modal-description" className="mt-2 max-w-[28rem] text-sm leading-6 text-[var(--color-muted)]">
              Enter your details to confirm service coverage and join the gated waitlist.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--color-border)] text-lg leading-none text-[var(--color-muted)] transition hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            aria-label="Close signup modal"
            onClick={closeModal}
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-[var(--color-text)] sm:col-span-2">
              <span>Email <span aria-hidden="true">*</span></span>
              <input
                type="email"
                required
                value={email}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={Boolean(error) && !emailValid}
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-base text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                onChange={(event) => {
                  setEmail(event.target.value);
                  resetMessages();
                }}
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium text-[var(--color-text)]">
              <span>ZIP <span aria-hidden="true">*</span></span>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={5}
                value={zip}
                placeholder="ZIP code"
                autoComplete="postal-code"
                aria-invalid={Boolean(error) && !zipValid}
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-base text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                onChange={(event) => {
                  const nextZip = event.target.value.replace(/\D/g, "").slice(0, 5);
                  setZip(nextZip);
                  setAvailability(getAvailability(nextZip));
                  resetMessages();
                }}
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium text-[var(--color-text)]">
              <span>First name</span>
              <input
                type="text"
                value={name}
                placeholder="First name"
                autoComplete="given-name"
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-base text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] p-3 text-sm leading-5 text-[var(--color-muted)]">
            <input
              type="checkbox"
              required
              checked={consent}
              className="mt-0.5 size-4 rounded border-[var(--color-border)] accent-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              onChange={(event) => {
                setConsent(event.target.checked);
                resetMessages();
              }}
            />
            <span>I agree to receive marketing emails from WalkBuddy.</span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-cta-bg)] px-5 text-sm font-semibold text-[var(--color-cta-text)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checking ? "Checking ZIP..." : "Join the Waitlist"}
            </button>
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              onClick={checkAvailability}
            >
              Check availability
            </button>
          </div>

          <div className="min-h-20" aria-live="polite" aria-atomic="true">
            {error ? (
              <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm leading-6 text-[var(--color-error,var(--color-text))]">
                {error}
              </p>
            ) : null}

            {!error && (availability || submitted) ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text)]">
                    {currentAvailability === "served" ? "Service available" : "Join city waitlist"}
                  </span>
                  {submitted && currentAvailability === "served" ? (
                    <button
                      type="button"
                      className="text-sm font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                    >
                      View booking details
                    </button>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{successMessage}</p>
                {submitted && currentAvailability === "served" ? (
                  <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-text)]">
                    Launching in Austin, TX: estimated price per 30-min walk: $18–$25.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
