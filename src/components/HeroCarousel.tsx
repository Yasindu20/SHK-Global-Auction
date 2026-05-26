import { useRef } from 'react';
import { motion } from 'framer-motion';

interface CarItem {
  name: string;
  year: string;
  image: string;
}

const cars: CarItem[] = [
  {
    name: 'Porsche 911 GT3',
    year: '2023',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=500&q=70',
  },
  {
    name: 'Ford Mustang GT',
    year: '1967',
    image: 'https://images.unsplash.com/photo-1552519507-da3b1421c324?auto=format&fit=crop&w=500&q=70',
  },
  {
    name: 'BMW M4 Competition',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=70',
  },
  {
    name: 'Chevrolet Camaro',
    year: '1969',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=500&q=70',
  },
  {
    name: 'Lamborghini Huracán',
    year: '2022',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=500&q=70',
  },
  {
    name: 'Mercedes-AMG GT',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=500&q=70',
  },
];

/**
 * HeroCarousel — Pure CSS infinite marquee.
 *
 * Replaced the previous animejs approach that used JS-driven translateX updates
 * every frame (causes main-thread work). CSS animations run on the compositor
 * thread and are paused automatically by the browser when the tab is hidden.
 *
 * Hover to pause via CSS `animation-play-state` — no JS listeners needed.
 */
export default function HeroCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  // Duplicate set for seamless loop
  const allCars = [...cars, ...cars];

  return (
    <div className="relative w-full overflow-hidden py-8">
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-[var(--bg)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-[var(--bg)] to-transparent z-10 pointer-events-none" />

      {/* CSS marquee track — pause on hover */}
      <div
        ref={trackRef}
        className="hero-carousel-track flex gap-6 w-max"
        style={{ willChange: 'transform' }}
      >
        {allCars.map((car, i) => (
          <motion.div
            key={`car-${i}`}
            className="group relative flex-shrink-0 w-72 h-44 rounded-xl overflow-hidden cursor-pointer bg-[var(--surface)]"
            whileHover={{ y: -6, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
            whileTap={{ scale: 0.98 }}
          >
            <img
              src={car.image}
              alt={car.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <div className="text-label text-[var(--amber)] mb-1">{car.year}</div>
              <div className="text-h4 text-white font-semibold">{car.name}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CSS animation — no JS main-thread work, compositor-only */}
      <style>{`
        .hero-carousel-track {
          animation: heroCarouselScroll 38s linear infinite;
        }
        .hero-carousel-track:hover {
          animation-play-state: paused;
        }
        @keyframes heroCarouselScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-carousel-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}