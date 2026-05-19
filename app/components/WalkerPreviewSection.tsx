"use client";

import { motion } from "framer-motion";
import { ProjectImage } from "@/app/components/ProjectImage";

const sectionVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function WalkerPreviewSection(): JSX.Element {
  return (
    <motion.section
      aria-label="Walker preview"
      className="bg-[var(--color-surface)] py-[var(--space-5xl)] text-[var(--color-text)]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={sectionVariants}
    >
      <div className="container flex justify-center md:justify-start">
        <motion.article
          className="w-full max-w-xl overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-[var(--space-md)] shadow-[var(--elev-2)] md:max-w-2xl md:p-[var(--space-lg)]"
          variants={cardVariants}
        >
          <div className="max-h-96 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)]">
            <ProjectImage id="feature_2" className="w-full h-auto rounded-[var(--radius-md)]" />
          </div>

          <div className="flex flex-col gap-[var(--space-sm)] pt-[var(--space-lg)]">
            <h3 className="font-[family-name:var(--font-display)] text-[var(--type-sm)] font-semibold leading-[24px] text-[var(--color-text)]">
              Maya R. — Zilker
            </h3>
            <p className="font-[family-name:var(--font-body)] text-[var(--type-xs)] font-medium leading-[18px] text-[var(--color-text)]">
              4.9★ • 120 walks • Verified
            </p>
            <p className="font-[family-name:var(--font-body)] text-[var(--type-xs)] font-normal leading-[18px] text-[var(--color-muted)]">
              Background check • Insurance • ID verified
            </p>
            <p className="max-w-prose font-[family-name:var(--font-body)] text-[var(--type-body)] font-normal leading-[22px] text-[var(--color-text)] md:text-[16px] md:leading-[24px]">
              Austin dog lover and early-morning walker. Great with energetic pups.
            </p>
            <motion.button
              type="button"
              className="mt-[var(--space-xs)] inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-[var(--space-lg)] font-[family-name:var(--font-display)] text-[var(--type-body)] font-semibold leading-[22px] text-[var(--color-text)] transition-colors duration-200 ease-out hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] sm:w-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              See a sample report
            </motion.button>
          </div>
        </motion.article>
      </div>
    </motion.section>
  );
}
