"use client";

import { motion } from "framer-motion";
import { ProjectImage } from "@/app/components/ProjectImage";

type FeatureRow = {
  title: string;
  body: string;
  imageId: "feature_1" | "feature_2" | "feature_3";
  reverse: boolean;
};

const featureRows: FeatureRow[] = [
  {
    title: "Book → Walk → Report",
    body: "Tap a time, your vetted walker arrives, then you get photos and a GPS recap.",
    imageId: "feature_1",
    reverse: false,
  },
  {
    title: "Vetted local walkers",
    body: "Every walker is background-checked and verified. See ratings and real reviews.",
    imageId: "feature_2",
    reverse: true,
  },
  {
    title: "Transparent pricing & coverage",
    body: "Austin launch pricing is $18–$25 per 30‑min walk. Check your ZIP to see if we serve your area.",
    imageId: "feature_3",
    reverse: false,
  },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: "easeOut",
      staggerChildren: 0.08,
    },
  },
};

function getChildVariants(offset: number) {
  return {
    hidden: { opacity: 0, x: offset },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.26, ease: "easeOut" },
    },
  };
}

export default function FeaturesSection(): JSX.Element {
  return (
    <motion.section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="bg-[var(--color-bg)] py-[var(--space-5xl)] text-[var(--color-text)]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={sectionVariants}
    >
      <div className="container flex flex-col gap-[var(--space-lg)]">
        <h2 id="how-it-works-title" className="visually-hidden text-[var(--color-text)]">
          How it works
        </h2>
        {featureRows.map((row) => {
          const imageOffset = row.reverse ? 12 : -12;
          const textOffset = row.reverse ? -12 : 12;

          return (
            <motion.article
              key={row.title}
              className={`flex flex-col gap-[var(--space-lg)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-xl)] shadow-[var(--elev-1)] md:items-center ${row.reverse ? "md:flex-row-reverse" : "md:flex-row"}`}
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.28,
                    ease: "easeOut",
                    staggerChildren: 0.08,
                  },
                },
              }}
            >
              <motion.div className="w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-bg)] md:basis-[42%]" variants={getChildVariants(imageOffset)}>
                <ProjectImage id={row.imageId} className="aspect-[4/3] h-full w-full rounded-[var(--radius-md)] object-cover" />
              </motion.div>
              <motion.div className="flex w-full flex-col gap-[var(--space-sm)] md:basis-[58%]" variants={getChildVariants(textOffset)}>
                <h3 className="font-[family-name:var(--font-display)] text-[var(--type-sm)] font-semibold leading-[24px] text-[var(--color-text)]">
                  {row.title}
                </h3>
                <p className="max-w-prose font-[family-name:var(--font-body)] text-[var(--type-body)] font-normal leading-[22px] text-[var(--color-text)] md:text-[16px] md:leading-[24px]">
                  {row.body}
                </p>
              </motion.div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}
