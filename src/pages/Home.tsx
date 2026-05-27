import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from '../components/Hero';
import TrustBar from '../sections/TrustBar';
import MarqueeDestinations from '../sections/MarqueeDestinations';
import VehicleGrid from '../sections/VehicleGrid';
import HowItWorks from '../sections/HowItWorks';
import DestinationShowcase from '../sections/DestinationShowcase';
import CTABanner from '../sections/CTABanner';
import Footer from '../sections/Footer';
import { useLenis } from '../hooks/useLenis';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  useLenis();

  // After Lenis attaches to the GSAP ticker (next tick), tell ScrollTrigger
  // to re-measure all scroll positions. Without this, ScrollTrigger uses
  // native scroll offsets that Lenis hasn't intercepted yet, causing the
  // 2-3 second delay before animations and scroll feel correct.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <main>
      <Hero />
      <TrustBar />
      <MarqueeDestinations />
      <VehicleGrid />
      <HowItWorks />
      <DestinationShowcase />
      <CTABanner />
      <Footer />
    </main>
  );
}