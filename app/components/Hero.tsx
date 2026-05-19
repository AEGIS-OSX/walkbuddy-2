"use client";

import { motion } from "framer-motion";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ProjectImage } from "@/app/components/ProjectImage";

type QuickCheckStatus = "idle" | "checking" | "invalid" | "served" | "pending";
type ModalStatus = "idle" | "loading" | "served" | "pending" | "duplicate" | "error";

type MarketingSignupResponse = {
  availability_status?: "served" | "pending";
  error?: string;
};

const zipPattern = /^\d{5}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const childMotion = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 }
};

function getChildTransition(delay: number) {
  return { duration: 0.52, ease: "easeOut", delay };
}

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickZip, setQuickZip] = useState("");
  const [quickStatus, setQuickStatus] = useState<QuickCheckStatus>("idle");
  const [email, setEmail] = useState("");
  const [modalZip, setModalZip] = useState("");
  const [modalStatus, setModalStatus] = useState<ModalStatus>("idle");
  const [modalError, setModalError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  function openModal() {
    setModalError("");
    setModalStatus("idle");
    setModalZip(zipPattern.test(quickZip) ? quickZip : "");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleQuickCheck() {
    const normalizedZip = quickZip.trim();
    setQuickZip(normalizedZip);

    if (!zipPattern.test(normalizedZip)) {
      setQuickStatus("invalid");
      return;
    }

    setQuickStatus("checking");

    window.setTimeout(() => {
      setQuickStatus(normalizedZip.startsWith("787") ? "served" : "pending");
    }, 450);
  }

  async function submitModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedZip = modalZip.trim();

    if (!emailPattern.test(normalizedEmail) || !zipPattern.test(normalizedZip)) {
      setModalStatus("error");
      setModalError("Please enter a valid email and a 5-digit ZIP code.");
      return;
    }

    setModalStatus("loading");
    setModalError("");

    try {
      const response = await fetch("/api/marketing-signups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: normalizedEmail,
          zip: normalizedZip,
          source: "hero-modal"
        })
      });

      const data = (await response.json()) as MarketingSignupResponse;

      if (response.status === 409) {
        setModalStatus("duplicate");
        setModalError("This ZIP and email are already on our list. We just sent a confirmation.");
        return;
      }

      if (!response.ok) {
        setModalStatus("error");
        setModalError(data.error === "Please enter a valid email and a 5-digit ZIP code." ? data.error : "Please enter a valid email and a 5-digit ZIP code.");
        return;
      }

      setModalStatus(data.availability_status === "served" ? "served" : "pending");
    } catch {
      setModalStatus("error");
      setModalError("Something went wrong. Please try again.");
    }
  }

  const quickResult = quickStatus === "served" || quickStatus === "pending";
  const modalResult = modalStatus === "served" || modalStatus === "pending";

  return (
    <>
      <motion.section
        className="mx-auto grid max-w-screen-lg gap-8 px-4 pb-16 pt-28 text-[var(--color-text)] md:grid-cols-[58%_42%] md:gap-12 md:px-6 md:pb-20 md:pt-32"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        aria-labelledby="hero-heading"
      >
        <div className="flex flex-col items-start justify-center">
          <motion.p
            className="mb-4 inline-flex rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 font-[family-name:var(--font-body)] text-[length:var(--type-xs)] leading-[18px] text-[var(--color-muted)] shadow-[var(--elev-1)]"
            {...childMotion}
            transition={getChildTransition(0)}
          >
            Background-checked walkers — GPS recaps — Photo proof.
          </motion.p>

          <motion.h1
            id="hero-heading"
            className="max-w-[12ch] font-[family-name:var(--font-display)] text-[28px] font-bold leading-[36px] tracking-[-0.04em] text-[var(--color-text)] md:text-[40px] md:leading-[48px]"
            {...childMotion}
            transition={getChildTransition(0.08)}
          >
            Trusted local dog walks, on your schedule.
          </motion.h1>

          <motion.p
            className="mt-5 max-w-[34rem] font-[family-name:var(--font-body)] text-[15px] leading-[22px] text-[var(--color-text)] md:text-[16px] md:leading-[24px]"
            {...childMotion}
            transition={getChildTransition(0.16)}
          >
            Book a vetted local walker, see photos and live GPS.
          </motion.p>

          <motion.p
            className="mt-4 inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 font-[family-name:var(--font-body)] text-[13px] font-medium leading-[18px] text-[var(--color-text)] shadow-[var(--elev-1)]"
            {...childMotion}
            transition={getChildTransition(0.24)}
          >
            Launching in Austin, TX: estimated price per 30-min walk: $18–$25.
          </motion.p>

          <motion.div
            className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:items-center"
            {...childMotion}
            transition={getChildTransition(0.32)}
          >
            <motion.button
              type="button"
              onClick={openModal}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-12 rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-8 font-[family-name:var(--font-body)] text-[15px] font-semibold leading-[20px] text-[var(--color-cta-text)] transition-[box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] md:h-14"
            >
              Join the Waitlist
            </motion.button>
            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-8 font-[family-name:var(--font-body)] text-[15px] font-semibold leading-[20px] text-[var(--color-text)] transition-[box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] md:h-14"
            >
              How it works
            </motion.a>
          </motion.div>

          <motion.form
            className="mt-6 w-full max-w-[34rem] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--elev-1)]"
            onSubmit={(event) => {
              event.preventDefault();
              handleQuickCheck();
            }}
            {...childMotion}
            transition={getChildTransition(0.4)}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="hero-zip">
                ZIP code
              </label>
              <input
                id="hero-zip"
                inputMode="numeric"
                autoComplete="postal-code"
                value={quickZip}
                onChange={(event) => {
                  setQuickZip(event.target.value);
                  setQuickStatus("idle");
                }}
                placeholder="78701"
                className="h-11 min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 font-[family-name:var(--font-body)] text-[15px] leading-[22px] text-[var(--color-text)] outline-none transition-[box-shadow,border-color] duration-200 ease-out placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)] focus:ring-offset-0"
                aria-describedby="hero-zip-helper hero-zip-status"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={quickStatus === "checking"}
                className="h-11 rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-5 font-[family-name:var(--font-body)] text-[14px] font-semibold leading-[20px] text-[var(--color-cta-text)] transition-[box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Check availability
              </motion.button>
            </div>
            <div id="hero-zip-helper" className="mt-3 font-[family-name:var(--font-body)] text-[13px] leading-[18px] text-[var(--color-muted)]">
              Enter your ZIP to see if we serve your area.
            </div>
            <div id="hero-zip-status" className="mt-3 min-h-[2rem]" aria-live="polite">
              {quickStatus === "invalid" ? (
                <p className="font-[family-name:var(--font-body)] text-[13px] leading-[18px] text-[var(--color-text)]">
                  Please enter a valid 5-digit ZIP code.
                </p>
              ) : null}
              {quickStatus === "checking" ? (
                <p className="inline-flex items-center gap-2 font-[family-name:var(--font-body)] text-[13px] font-medium leading-[18px] text-[var(--color-text)]">
                  <span className="h-3 w-3 animate-spin rounded-[var(--radius-round)] border border-[var(--color-border)] border-t-[var(--color-text)]" aria-hidden="true" />
                  Checking ZIP...
                </p>
              ) : null}
              {quickResult ? (
                <div className="flex flex-col gap-2">
                  <span className="w-fit rounded-[var(--radius-round)] bg-[var(--color-accent)] px-3 py-1 font-[family-name:var(--font-body)] text-[13px] font-medium leading-[18px] text-[var(--color-accent-text)]">
                    {quickStatus === "served" ? "Service available" : "Join city waitlist"}
                  </span>
                  <p className="font-[family-name:var(--font-body)] text-[13px] leading-[18px] text-[var(--color-text)]">
                    {quickStatus === "served" ? "Great. WalkBuddy serves your ZIP. Select a time to book a walk." : "We’re not live in this ZIP yet. Join early access and we’ll notify you when we expand."}
                  </p>
                </div>
              ) : null}
            </div>
          </motion.form>
        </div>

        <motion.div
          className="flex items-center"
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
          <div className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--elev-2)]">
            <ProjectImage id="hero" className="h-auto w-full rounded-[var(--radius-md)] shadow-[var(--elev-1)]" />
          </div>
        </motion.div>
      </motion.section>

      {isModalOpen ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[var(--color-text)]/20 px-4 py-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          role="presentation"
        >
          <motion.div
            className="w-full max-w-[540px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 text-[var(--color-text)] shadow-[var(--elev-2)] md:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-modal-title"
            initial={{ opacity: 0, scale: 0.985, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-[family-name:var(--font-body)] text-[13px] font-medium leading-[18px] text-[var(--color-muted)]">
                  WalkBuddy early access
                </p>
                <h2 id="signup-modal-title" className="mt-1 font-[family-name:var(--font-display)] text-[22px] font-semibold leading-[30px] tracking-[-0.02em] text-[var(--color-text)] md:text-[28px] md:leading-[36px]">
                  Check availability
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeModal}
                className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-round)] border border-[var(--color-border)] bg-[var(--color-surface)] font-[family-name:var(--font-body)] text-[18px] font-medium leading-none text-[var(--color-text)] transition-[box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
                aria-label="Close availability modal"
              >
                ×
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={submitModal}>
              <label className="grid gap-2 font-[family-name:var(--font-body)] text-[14px] font-medium leading-[20px] text-[var(--color-text)]" htmlFor="signup-email">
                Email
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setModalError("");
                    if (modalStatus === "error" || modalStatus === "duplicate") {
                      setModalStatus("idle");
                    }
                  }}
                  placeholder="you@example.com"
                  className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 font-[family-name:var(--font-body)] text-[15px] font-normal leading-[22px] text-[var(--color-text)] outline-none transition-[box-shadow,border-color] duration-200 ease-out placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)] focus:ring-offset-0"
                  aria-describedby="signup-status"
                />
              </label>

              <label className="grid gap-2 font-[family-name:var(--font-body)] text-[14px] font-medium leading-[20px] text-[var(--color-text)]" htmlFor="signup-zip">
                ZIP code
                <input
                  id="signup-zip"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={modalZip}
                  onChange={(event) => {
                    setModalZip(event.target.value);
                    setModalError("");
                    if (modalStatus === "error" || modalStatus === "duplicate") {
                      setModalStatus("idle");
                    }
                  }}
                  placeholder="ZIP code"
                  className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 font-[family-name:var(--font-body)] text-[15px] font-normal leading-[22px] text-[var(--color-text)] outline-none transition-[box-shadow,border-color] duration-200 ease-out placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)] focus:ring-offset-0"
                  aria-describedby="signup-status"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <motion.button
                  type="button"
                  onClick={() => {
                    if (zipPattern.test(modalZip.trim())) {
                      setModalStatus(modalZip.trim().startsWith("787") ? "served" : "pending");
                      setModalError("");
                    } else {
                      setModalStatus("error");
                      setModalError("Please enter a valid email and a 5-digit ZIP code.");
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={modalStatus === "loading"}
                  className="h-12 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-6 font-[family-name:var(--font-body)] text-[15px] font-semibold leading-[20px] text-[var(--color-text)] transition-[box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Check availability
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={modalStatus === "loading"}
                  className="h-12 rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-8 font-[family-name:var(--font-body)] text-[15px] font-semibold leading-[20px] text-[var(--color-cta-text)] transition-[box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60 md:h-14"
                >
                  {modalStatus === "loading" ? "Checking ZIP..." : "Join the Waitlist"}
                </motion.button>
              </div>

              <div id="signup-status" className="min-h-[4rem] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4" aria-live="polite">
                {modalStatus === "loading" ? (
                  <p className="inline-flex items-center gap-2 font-[family-name:var(--font-body)] text-[14px] font-medium leading-[20px] text-[var(--color-text)]">
                    <span className="h-3 w-3 animate-spin rounded-[var(--radius-round)] border border-[var(--color-border)] border-t-[var(--color-text)]" aria-hidden="true" />
                    Checking ZIP...
                  </p>
                ) : null}

                {modalError ? (
                  <p className="font-[family-name:var(--font-body)] text-[14px] leading-[20px] text-[var(--color-text)]">
                    {modalError}
                  </p>
                ) : null}

                {modalResult ? (
                  <div className="grid gap-3">
                    <span className="w-fit rounded-[var(--radius-round)] bg-[var(--color-accent)] px-3 py-1 font-[family-name:var(--font-body)] text-[13px] font-medium leading-[18px] text-[var(--color-accent-text)]">
                      {modalStatus === "served" ? "Service available" : "Join city waitlist"}
                    </span>
                    <p className="font-[family-name:var(--font-body)] text-[14px] leading-[20px] text-[var(--color-text)]">
                      {modalStatus === "served" ? "Great. WalkBuddy serves your ZIP. You will receive a confirmation email with next steps." : "We’re not live yet. Join early access and we’ll notify you when we expand."}
                    </p>
                    <a
                      href="#how-it-works"
                      onClick={closeModal}
                      className="w-fit rounded-[var(--radius-md)] bg-[var(--color-cta-bg)] px-4 py-3 font-[family-name:var(--font-body)] text-[14px] font-semibold leading-[20px] text-[var(--color-cta-text)] transition-[box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                    >
                      View booking details
                    </a>
                  </div>
                ) : null}

                {modalStatus === "idle" && !modalError ? (
                  <p className="font-[family-name:var(--font-body)] text-[14px] leading-[20px] text-[var(--color-muted)]">
                    Enter your email and ZIP to check WalkBuddy coverage.
                  </p>
                ) : null}
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </>
  );
}
