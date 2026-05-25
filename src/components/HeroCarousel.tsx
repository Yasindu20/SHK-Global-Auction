import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { animate } from 'animejs';

interface CarItem {
  name: string;
  year: string;
  image: string;
}

const cars: CarItem[] = [
  {
    name: 'Porsche 911 GT3',
    year: '2023',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=500&q=80'
  },
  {
    name: 'Ford Mustang GT',
    year: '1967',
    image: 'https://images.unsplash.com/photo-1552519507-da3b1421c324?auto=format&fit=crop&w=500&q=80'
  },
  {
    name: 'BMW M4 Competition',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80'
  },
  {
    name: 'Chevrolet Camaro',
    year: '1969',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=500&q=80'
  },
  {
    name: 'Lamborghini Huracán',
    year: '2022',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=500&q=80'
  },
  {
    name: 'Mercedes-AMG GT',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=500&q=80'
  }
];

export default function HeroCarousel() {
  const trackRef = useRef<<HTMLDivElement>(null);
  const animationRef = useRef<<ReturnType<<typeof animate> | null>(null);

  const setupAnimation = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const originalItems = track.querySelectorAll('[data-carousel-item="original"]');
    const clones = track.querySelectorAll('[data-carousel-item="clone"]');
    clones.forEach(c => c.remove());

    if (originalItems.length === 0) return;

    const firstItem = originalItems[0] as HTMLElement;
    const itemWidth = firstItem.offsetWidth + 24;
    const totalWidth = itemWidth * originalItems.length;

    originalItems.forEach(item => {
      const clone = item.cloneNode(true) as HTMLElement;
      clone.setAttribute('data-carousel-item', 'clone');
      track.appendChild(clone);
    });

    animate(track, { translateX: 0, duration: 0 });

    animationRef.current = animate(track, {
      translateX: -totalWidth,
      duration: 40000,
      ease: 'linear',
      loop: true,
      autoplay: true
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(setupAnimation, 100);

    const handleVisibilityChange = () => {
      if (!animationRef.current) return;
      if (document.hidden) animationRef.current.pause();
      else animationRef.current.play();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationRef.current) animationRef.current.pause();
    };
  }, [setupAnimation]);

  const handleMouseEnter = () => {
    if (animationRef.current) animationRef.current.pause();
  };

  const handleMouseLeave = () => {
    if (animationRef.current) animationRef.current.play();
  };

  return (
    <div
      className="relative w-full overflow-hidden py-8 cursor-grab active:cursor-grabbing"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-[var(--bg)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-[var(--bg)] to-transparent z-10 pointer-events-none" />

      <div ref={trackRef} className="flex gap-6 w-max will-change-transform">
        {cars.map((car, i) => (
          <motion.div
            key={`car-${i}`}
            data-carousel-item="original"
            className="group relative flex-shrink-0 w-72 h-44 rounded-xl overflow-hidden cursor-pointer bg-[var(--surface)]"
            whileHover={{ y: -8, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.img
              src={car.image}
              alt={car.name}
              loading="lazy"
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.12, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />

            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <div className="text-label text-[var(--amber)] mb-1">{car.year}</div>
              <div className="text-h4 text-white font-semibold">{car.name}</div>
            </div>

            <motion.div
              className="absolute inset-0 rounded-xl border border-white/0 pointer-events-none"
              whileHover={{ borderColor: 'rgba(212,168,83,0.3)', transition: { duration: 0.4 } }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}