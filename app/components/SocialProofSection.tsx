"use client";

import { motion } from "framer-motion";
import { ProjectImage } from "@/app/components/ProjectImage";

export default function SocialProofSection(): JSX.Element {
  return (
    <motion.section
      aria-label="Verified WalkBuddy customer quote"
      className="bg-[var(--color-bg)] py-[var(--space-5xl)] text-[var(--color-text)]"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-xs)] shadow-[var(--elev-1)]">
            <ProjectImage id="social_proof" className="w-full h-auto rounded-[var(--radius-md)]" />
          </div>

          <motion.figure
            className="relative z-10 mx-[var(--space-md)] -mt-[var(--space-2xl)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-lg)] shadow-[var(--elev-2)] sm:mx-[var(--space-xl)] md:mx-auto md:max-w-2xl md:p-[var(--space-xl)]"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.12, duration: 0.42, ease: "easeOut" }}
          >
            <span className="mb-[var(--space-md)] inline-flex min-h-7 items-center rounded-[var(--radius-round)] bg-[var(--color-accent)] px-[var(--space-sm)] font-[family-name:var(--font-body)] text-[var(--type-xs)] font-medium leading-[18px] text-[var(--color-accent-text)]">
              Verified beta quote
            </span>
            <blockquote className="font-[family-name:var(--font-display)] text-[var(--type-md)] font-semibold leading-[30px] tracking-[-0.01em] text-[var(--color-text)] md:text-[var(--type-lg)] md:leading-[36px]">
              “WalkBuddy made weekday walks painless. Real GPS maps and happy dog photos sealed it.”
            </blockquote>
            <figcaption className="mt-[var(--space-md)] font-[family-name:var(--font-body)] text-[var(--type-body)] font-medium leading-[22px] text-[var(--color-muted)] md:text-[16px] md:leading-[24px]">
              — Jenna P., South Congress
            </figcaption>
          </motion.figure>
        </div>
      </div>
    </motion.section>
  );
}
