"use client";

import type { ReactElement } from "react";
import FeaturesSection from "@/app/components/FeaturesSection";
import HeroSection from "@/app/components/HeroSection";
import SignupModal from "@/app/components/SignupModal";
import SiteFooter from "@/app/components/SiteFooter";
import SocialProofSection from "@/app/components/SocialProofSection";
import WalkerPreviewSection from "@/app/components/WalkerPreviewSection";

export default function Home(): ReactElement {
  return (
    <main id="top">
      <HeroSection />
      <FeaturesSection />
      <WalkerPreviewSection />
      <SocialProofSection />
      <SignupModal />
      <SiteFooter />
    </main>
  );
}
