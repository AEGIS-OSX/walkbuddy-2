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
  "[tabindex]:not([tabindex=\"-1\"])",
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

  const checkAvailability = async () => {
    if (!formValid) {
      setSubmitted(false);
      setAvailability(null);
      setError("Please enter a valid email and a 5-digit ZIP code.");
      return;
    }

    if (checking) {
      return;
    }

    setChecking(true);
    setError("");
    setSubmitted(false);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 240));
      setAvailability(getAvailability(zip));
    } finally {
      setChecking(false);
    }
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
      } else if (!event.shiftKey && activeElement === lastElement) {
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

      let responseBody: { error?: string; availability_status?: "served" | "pending" } | null = null;

      try {
        responseBody = await response.json();
      } catch {
        responseBody = null;
      }

      if (
        response.status === 409
        || responseBody?.error === "This ZIP and email are already on our list. We just sent a confirmation."
      ) {
        setSubmitted(false);
        setError("This ZIP and email are already on our list. We just sent a confirmation.");
        return;
      }

      if (!response.ok) {
        setSubmitted(false);
        setError("Something went wrong. Please try again.");
        return;
      }

      if (responseBody?.availability_status === "served" || responseBody?.availability_status === "pending") {
        setAvailability(responseBody.availability_status);
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
    <div className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center px-[var(--space-md)] py-[var(--space-lg)] font-[var(--font-body)] sm:px-[var(--space-lg)]">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--color-text)] opacity-35"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeModal();
          }
        }}
      ></motion.div>

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-modal-title"
        aria-describedby="signup-modal-description"
        tabIndex={-1}
        className="relative w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-lg)] text-[var(--color-text)] shadow-[var(--elev-2)] outline-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <div className="mb-[var(--space-lg)] flex items-start justify-between gap-[var(--space-md)]">
          <div>
            <p className="mb-[var(--space-xs)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] uppercase tracking-[0.16em] text-[var(--color-muted)]">WalkBuddy early access</p>
            <h2 id="signup-modal-title" className="font-[var(--font-display)] text-[length:var(--type-md)] font-[var(--font-weight-semibold)] leading-[30px] tracking-[-0.03em] sm:text-[length:var(--type-lg)] sm:leading-[36px]">
              Check availability
            </h2>
            <p id="signup-modal-description" className="mt-[var(--space-xs)] max-w-md text-[length:var(--type-body)] leading-[22px] text-[var(--color-muted)]">
              Enter your details to confirm service coverage and join the gated waitlist.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-round)] border border-[var(--color-border)] text-[length:var(--type-sm)] leading-none text-[var(--color-muted)] transition hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            aria-label="Close signup modal"
            onClick={closeModal}
          >
            ×
          </button>
        </div>

        <form className="space-y-[var(--space-md)]" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-[var(--space-sm)] sm:grid-cols-2">
            <label className="space-y-[var(--space-xs)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)] sm:col-span-2">
              <span>Email <span aria-hidden="true">*</span></span>
              <input
                type="email"
                required
                value={email}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={Boolean(error) && !emailValid}
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-sm)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                onChange={(event) => {
                  setEmail(event.target.value);
                  resetMessages();
                }}
              ></input>
            </label>

            <label className="space-y-[var(--space-xs)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)]">
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
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-sm)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                onChange={(event) => {
                  const nextZip = event.target.value.replace(/\D/g, "").slice(0, 5);
                  setZip(nextZip);
                  setAvailability(getAvailability(nextZip));
                  resetMessages();
                }}
              ></input>
            </label>

            <label className="space-y-[var(--space-xs)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)]">
              <span>First name</span>
              <input
                type="text"
                value={name}
                placeholder="First name"
                autoComplete="given-name"
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-sm)] text-[length:var(--type-body)] leading-[22px] text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                onChange={(event) => setName(event.target.value)}
              ></input>
            </label>
          </div>

          <label className="flex items-start gap-[var(--space-sm)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-[var(--space-sm)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">
            <input
              type="checkbox"
              required
              checked={consent}
              className="mt-[var(--space-xxs)] size-4 rounded-[var(--radius-sm)] border-[var(--color-border)] accent-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              onChange={(event) => {
                setConsent(event.target.checked);
                resetMessages();
              }}
            ></input>
            <span>I agree to receive marketing emails from WalkBuddy.</span>
          </label>

          <div className="flex flex-col gap-[var(--space-sm)] sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-round)] bg-[var(--color-cta-bg)] px-[var(--space-lg)] text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-[18px] text-[var(--color-cta-text)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checking ? "Checking ZIP..." : "Join the Waitlist"}
            </button>
            <button
              type="button"
              disabled={checking}
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-round)] border border-[var(--color-border)] px-[var(--space-lg)] text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-[18px] text-[var(--color-text)] transition hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={checkAvailability}
            >
              Check availability
            </button>
          </div>

          <div className="min-h-20" aria-live="polite" aria-atomic="true">
            {error ? (
              <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-text)]">
                {error}
              </p>
            ) : null}

            {!error && (availability || submitted) ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)]">
                <div className="flex flex-wrap items-center gap-[var(--space-xs)]">
                  <span className="inline-flex rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-accent)] px-[var(--space-sm)] py-[var(--space-xxs)] text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-[18px] text-[var(--color-accent-text)]">
                    {currentAvailability === "served" ? "Service available" : "Join city waitlist"}
                  </span>
                  {submitted && currentAvailability === "served" ? (
                    <button
                      type="button"
                      className="text-[length:var(--type-xs)] font-[var(--font-weight-semibold)] leading-[18px] text-[var(--color-text)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                    >
                      View booking details
                    </button>
                  ) : null}
                </div>
                <p className="mt-[var(--space-sm)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)]">{successMessage}</p>
                {submitted && currentAvailability === "served" ? (
                  <p className="mt-[var(--space-xs)] text-[length:var(--type-xs)] font-[var(--font-weight-medium)] leading-[18px] text-[var(--color-text)]">
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
