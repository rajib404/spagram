import { HeroSection } from "@/components/home/hero-section";
import { ValueProps } from "@/components/home/value-props";
import { FeaturedTherapists } from "@/components/home/featured-therapists";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaSection } from "@/components/home/cta-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValueProps />
      <FeaturedTherapists />
      <HowItWorks />
      <CtaSection />
    </>
  );
}
