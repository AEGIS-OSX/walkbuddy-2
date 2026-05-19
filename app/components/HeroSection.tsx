"use client";

import { motion } from "framer-motion";
import { ProjectImage } from "@/app/components/ProjectImage";
import React, { useEffect, useRef, useState } from "react";

type ZipStatus = "idle" | "invalid" | "checking" | "served" | "pending";

const zipPattern = /^\d{5}$/;

function isServedZip(zip: string): boolean {
  return zip.startsWith("787");
}

export default function HeroSection(): JSX.Element {
  const [zip, setZip] = useState("");
  const [zipStatus, setZipStatus] = useState<ZipStatus>("idle");
  const checkingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (checkingTimerRef.current !== null) {
        window.clearTimeout(checkingTimerRef.current);
      }
    };
  }, []);

  const normalizedZip = zip.trim();
  const hasValidZip = zipPattern.test(normalizedZip);
  const isChecking = zipStatus === "checking";
  const isServed = zipStatus === "served";
  const isPending = zipStatus === "pending";
  const isInvalid = zipStatus === "invalid";

  const handleZipSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (checkingTimerRef.current !== null) {
      window.clearTimeout(checkingTimerRef.current);
    }

    if (!hasValidZip) {
      setZipStatus("invalid");
      return;
    }

    setZipStatus("checking");
    checkingTimerRef.current = window.setTimeout(() => {
      setZipStatus(isServedZip(normalizedZip) ? "served" : "pending");
    }, 650);
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}
      >
        <nav className="container flex h-14 items-center justify-between gap-4 md:h-16" aria-label="Primary navigation">
          <a
            href="/"
            className="font-bold focus-visible:outline-none"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-display)", fontSize: "var(--type-sm)", lineHeight: "24px" }}
          >
            WalkBuddy
          </a>

          <div className="flex items-center gap-4 text-sm font-medium" style={{ color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
            <a href="#how-it-works" className="hidden transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:outline-none sm:inline-flex">
              How it works
            </a>
            <a href="#features" className="hidden transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:outline-none sm:inline-flex">
              Pricing
            </a>
            <motion.button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-signup-modal"))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="inline-flex min-h-11 items-center justify-center rounded-full border px-4 focus-visible:outline-none"
              style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Check availability
            </motion.button>
          </div>
        </nav>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        aria-label="WalkBuddy hero"
        style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
      >
        <div className="container flex flex-col py-16 md:flex-row md:items-center md:py-24" style={{ gap: "var(--space-xl)" }}>
          <div className="flex flex-col items-start md:basis-[58%]">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05, duration: 0.45, ease: "easeOut" }}
              className="max-w-3xl font-bold tracking-[-0.02em] md:text-[length:var(--type-xxl)] md:leading-[48px]"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-display)", fontSize: "var(--type-lg)", lineHeight: "36px" }}
            >
              Trusted local dog walks, on your schedule.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
              className="mt-4 max-w-2xl font-medium"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-display)", fontSize: "var(--type-sm)", lineHeight: "24px" }}
            >
              Book a vetted local walker, see photos and live GPS.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.45, ease: "easeOut" }}
              className="mt-4 max-w-2xl rounded-full border px-4 py-2 font-medium"
              style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)", boxShadow: "var(--elev-1)", color: "var(--color-text)", fontFamily: "var(--font-body)", fontSize: "var(--type-xs)", lineHeight: "18px" }}
            >
              Launching in Austin, TX: estimated price per 30-min walk: $18–$25.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.45, ease: "easeOut" }}
              className="mt-4 font-medium"
              style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "var(--type-xs)", lineHeight: "18px" }}
            >
              Background-checked walkers — GPS recaps — Photo proof
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.45, ease: "easeOut" }}
              className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center"
            >
              <motion.button
                type="button"
                onClick={() => {
                  if (hasValidZip) {
                    window.dispatchEvent(new CustomEvent("open-signup-modal", { detail: { zip: normalizedZip } }));
                    return;
                  }

                  window.dispatchEvent(new CustomEvent("open-signup-modal"));
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="inline-flex h-12 items-center justify-center rounded-xl px-8 font-semibold focus-visible:outline-none md:h-14"
                style={{ backgroundColor: "var(--color-cta-bg)", boxShadow: isServed ? "var(--elev-2)" : "var(--elev-1)", color: "var(--color-cta-text)", fontFamily: "var(--font-display)", fontSize: "var(--type-body)", lineHeight: "22px" }}
              >
                Join the Waitlist
              </motion.button>

              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-xl px-4 font-medium transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:outline-none md:h-14"
                style={{ color: "var(--color-text)", fontFamily: "var(--font-body)", fontSize: "var(--type-body)", lineHeight: "22px" }}
              >
                How it works
              </a>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.45, ease: "easeOut" }}
              onSubmit={handleZipSubmit}
              className="mt-8 w-full max-w-xl rounded-xl border p-4"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              noValidate
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <label htmlFor="hero-zip" className="block font-medium" style={{ color: "var(--color-text)", fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: "20px" }}>
                    ZIP code
                  </label>
                  <input
                    id="hero-zip"
                    name="zip"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                    placeholder="78701"
                    value={zip}
                    onChange={(event) => {
                      setZip(event.currentTarget.value.replace(/\D/g, "").slice(0, 5));
                      if (zipStatus !== "idle") {
                        setZipStatus("idle");
                      }
                    }}
                    aria-describedby="hero-zip-status"
                    aria-invalid={isInvalid}
                    disabled={isChecking}
                    className="focus-ring h-11 w-full rounded-xl border px-4 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)", fontFamily: "var(--font-body)", fontSize: "var(--type-body)", lineHeight: "22px" }}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isChecking}
                  whileHover={isChecking ? undefined : { scale: 1.02 }}
                  whileTap={isChecking ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="inline-flex h-11 min-w-36 items-center justify-center rounded-xl px-6 font-semibold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: "var(--color-cta-bg)", color: "var(--color-cta-text)", fontFamily: "var(--font-display)", fontSize: "14px", lineHeight: "20px" }}
                >
                  {isChecking ? "Checking ZIP..." : "Check availability"}
                </motion.button>
              </div>

              <div id="hero-zip-status" aria-live="polite" className="mt-3 min-h-[46px]" style={{ fontFamily: "var(--font-body)", fontSize: "var(--type-xs)", lineHeight: "18px" }}>
                {zipStatus === "idle" ? <p style={{ color: "var(--color-muted)" }}>Enter your ZIP to see if we serve your area.</p> : null}
                {isInvalid ? <p style={{ color: "var(--color-text)" }}>Please enter a valid 5-digit ZIP code.</p> : null}
                {isChecking ? <p style={{ color: "var(--color-text)" }}>Checking ZIP...</p> : null}
                {isServed ? (
                  <div className="flex flex-col items-start gap-2">
                    <span className="inline-flex min-h-7 items-center rounded-full px-3 py-1 font-medium" style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)" }}>
                      Service available
                    </span>
                    <p style={{ color: "var(--color-text)" }}>Great. WalkBuddy serves your ZIP. Select a time to book a walk.</p>
                  </div>
                ) : null}
                {isPending ? (
                  <div className="flex flex-col items-start gap-2">
                    <span className="inline-flex min-h-7 items-center rounded-full border px-3 py-1 font-medium" style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                      Join city waitlist
                    </span>
                    <p style={{ color: "var(--color-text)" }}>We’re not live in this ZIP yet. Join early access and we will notify you when we expand.</p>
                  </div>
                ) : null}
              </div>
            </motion.form>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18, duration: 0.5, ease: "easeOut" }}
            className="w-full rounded-xl border p-2 md:basis-[42%]"
            style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)", boxShadow: "var(--elev-2)" }}
          >
            <ProjectImage id="hero" className="h-auto w-full rounded-xl" fetchpriority="high" />
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}
