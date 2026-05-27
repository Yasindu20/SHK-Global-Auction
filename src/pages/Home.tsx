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
  // useLenis handles its own double-RAF ScrollTrigger.refresh internally —
  // no extra useEffect needed here. Adding one caused a race where
  // ScrollTrigger measured positions before Lenis had taken over scroll,
  // producing the 2-3 second "dead zone" on first load.
  useLenis();

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