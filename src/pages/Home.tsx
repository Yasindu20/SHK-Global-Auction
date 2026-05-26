import Hero from '../components/Hero';
import CarReveal from '../sections/CarReveal';
import TrustBar from '../sections/TrustBar';
import MarqueeDestinations from '../sections/MarqueeDestinations';
import VehicleGrid from '../sections/VehicleGrid';
import HowItWorks from '../sections/HowItWorks';
import DestinationShowcase from '../sections/DestinationShowcase';
import CTABanner from '../sections/CTABanner';
import Footer from '../sections/Footer';
import { useLenis } from '../hooks/useLenis';

export default function Home() {
  useLenis();

  return (
    <main>
      <Hero />
      <CarReveal />
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