import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const title = "WalkBuddy — Trusted local dog walks, on your schedule.";
const description =
  "We match you with vetted local walkers. After each walk you get photos and a GPS recap. You pay the posted walk rate; tips are optional and we email a receipt after every charge.";

export const metadata: Metadata = {
  title,
  description,
  themeColor: "var(--color-cta-bg)",
  openGraph: {
    title,
    description,
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          background: "var(--color-bg)",
          color: "var(--color-text)",
          fontFamily: "var(--font-body)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
