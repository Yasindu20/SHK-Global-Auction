import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ChevronRight, Play } from 'lucide-react';
import HeroBackground from './HeroBackground';
import HeroCarousel from './HeroCarousel';
import HeroStats from './HeroStats';
import MagneticButton from './MagneticButton';

gsap.registerPlugin(ScrollTrigger);

const HEADLINE_LINE1 = 'GLOBAL AUCTIONS';
const HEADLINE_LINE2 = 'PREMIUM VEHICLES';

interface HeroSlide {
  image: string;
  alt: string;
  label: string;
}

const heroSlides: HeroSlide[] = [
  {
    image: 'https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&w=1200&q=75',
    alt: 'Mercedes-Benz S-Class',
    label: 'Mercedes-Benz S-Class',
  },
  {
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=75',
    alt: 'Porsche 911 GT3',
    label: 'Porsche 911 GT3',
  },
  {
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=75',
    alt: 'BMW M4 Competition',
    label: 'BMW M4 Competition',
  },
  {
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=75',
    alt: 'Lamborghini Huracán',
    label: 'Lamborghini Huracán',
  },
];

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as [number, number, number, number];

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.94,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: EASE_OUT_EXPO },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-40%' : '40%',
    opacity: 0,
    scale: 0.94,
    transition: { duration: 0.55, ease: EASE_OUT_EXPO },
  }),
};

function SplitText({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text.split(' ').map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={`hero-word inline-block overflow-hidden ${className || ''}`}
        >
          <span className="hero-word-inner inline-block">{word}</span>
          {i < text.split(' ').length - 1 && (
            <span className="inline-block w-[0.25em]" />
          )}
        </span>
      ))}
    </>
  );
}

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const imageLayerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // RAF token for throttled mouse parallax
  const mouseRafRef = useRef<number>(0);
  const mouseDataRef = useRef({ x: 0, y: 0 });

  const [[slidePage, slideDirection], setSlidePage] = useState([0, 0]);
  const slideIndex = ((slidePage % heroSlides.length) + heroSlides.length) % heroSlides.length;

  const paginate = useCallback((newDirection: number) => {
    setSlidePage((prev) => [prev[0] + newDirection, newDirection]);
  }, []);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => paginate(1), 6000);
    return () => clearInterval(timer);
  }, [paginate]);

  // Mouse parallax — 2D transforms only (compositor-only, no layout reflow).
  const applyParallax = useCallback(() => {
    const { x, y } = mouseDataRef.current;

    gsap.to(imageLayerRef.current, {
      x: x * 14,
      y: y * 8,
      duration: 1.0,
      ease: 'power2.out',
      overwrite: 'auto',
    });

    gsap.to(textLayerRef.current, {
      x: x * -18,
      y: y * -10,
      duration: 1.1,
      ease: 'power2.out',
      overwrite: 'auto',
    });

    gsap.to(ctaRef.current, {
      x: x * -7,
      y: y * -5,
      duration: 1.3,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseDataRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };

      cancelAnimationFrame(mouseRafRef.current);
      mouseRafRef.current = requestAnimationFrame(applyParallax);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(mouseRafRef.current);
    };
  }, [applyParallax]);

  // GSAP entrance animations
  useGSAP(() => {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        // ✅ FIX: Guard against null — scrollIndicatorRef is only populated
        // if the scroll indicator element exists in the JSX. Without this
        // check, GSAP logs "target null not found" on every page load.
        if (scrollIndicatorRef.current) {
          gsap.to(scrollIndicatorRef.current, { opacity: 1, duration: 1.2 });
        }
      },
    });

    tl.fromTo('.hero-atmosphere', { opacity: 0 }, { opacity: 1, duration: 2 });

    tl.fromTo(
      '.hero-eyebrow',
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9 },
      '-=1.8'
    );

    tl.fromTo(
      '.hero-word-inner',
      { y: '110%', opacity: 0 },
      { y: '0%', opacity: 1, duration: 1.4, stagger: 0.07 },
      '-=1.3'
    );

    tl.fromTo(
      '.hero-subheadline',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2 },
      '-=1'
    );

    tl.fromTo(
      imageLayerRef.current,
      { scale: 0.88, opacity: 0, y: 60 },
      { scale: 1, opacity: 1, y: 0, duration: 1.6, ease: 'expo.out' },
      '-=1.4'
    );

    tl.fromTo(
      '.hero-cta-btn',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.12 },
      '-=1.2'
    );

    tl.fromTo(
      '.hero-stats-wrapper',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1 },
      '-=0.8'
    );

    tl.fromTo(
      '.hero-carousel-wrapper',
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.1 },
      '-=0.7'
    );

    // Scroll-driven parallax.
    gsap.to(textLayerRef.current, {
      y: -100,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });

    gsap.to(imageLayerRef.current, {
      y: 70,
      scale: 1.06,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });

    gsap.to(containerRef.current, {
      opacity: 0.15,
      scrollTrigger: {
        trigger: containerRef.current,
        start: '60% top',
        end: 'bottom top',
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] overflow-hidden flex flex-col"
    >
      <HeroBackground />

      {/* Ambient glow layer */}
      <div className="hero-atmosphere absolute inset-0 pointer-events-none z-[1]">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-40 animate-ambient"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(212,168,83,0.10) 0%, rgba(212,168,83,0.03) 32%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center pt-24 pb-8">
        <div className="container-main w-full">
          {/* Text Layer */}
          <div
            ref={textLayerRef}
            className="text-center max-w-5xl mx-auto will-change-transform"
          >
            <motion.div
              className="hero-eyebrow text-label text-[var(--amber)] mb-6 md:mb-8 tracking-[0.2em] opacity-0"
              animate={{
                textShadow: [
                  '0 0 0px rgba(212,168,83,0)',
                  '0 0 20px rgba(212,168,83,0.4)',
                  '0 0 0px rgba(212,168,83,0)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              SHK GLOBAL AUCTION
            </motion.div>

            <h1 className="text-display text-[var(--text-primary)] mb-6 md:mb-8 leading-[1.05]">
              <span className="block overflow-hidden">
                <SplitText text={HEADLINE_LINE1} />
              </span>
              <span className="block overflow-hidden mt-1 md:mt-2">
                <SplitText text={HEADLINE_LINE2} />
              </span>
            </h1>

            <p className="hero-subheadline text-base md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed opacity-0">
              Curated collection of the world's finest automobiles.
              <br className="hidden md:block" />
              Bid on exclusivity. Own the extraordinary.
            </p>

            <div ref={ctaRef} className="flex flex-wrap gap-4 justify-center will-change-transform">
              <MagneticButton
                as="a"
                href="/inventory"
                className="hero-cta-btn group relative inline-flex items-center gap-2 px-8 py-4 bg-[var(--amber)] text-[var(--bg)] font-semibold rounded-sm overflow-hidden opacity-0"
                strength={0.3}
              >
                <span className="relative z-10">Explore Inventory</span>
                <ChevronRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/25 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              </MagneticButton>

              <MagneticButton
                as="a"
                href="/how-it-works"
                className="hero-cta-btn group inline-flex items-center gap-3 px-8 py-4 border border-[var(--border-strong)] text-[var(--text-primary)] font-semibold rounded-sm hover:border-[var(--amber)] hover:text-[var(--amber)] transition-all duration-300 opacity-0 backdrop-blur-sm"
                strength={0.25}
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full border border-current group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-3 h-3 fill-current" />
                </span>
                <span>How It Works</span>
              </MagneticButton>
            </div>
          </div>

          {/* Image / Slideshow Layer */}
          <div
            ref={imageLayerRef}
            className="relative w-full max-w-4xl mx-auto mt-8 md:mt-4 will-change-transform"
          >
            <div className="relative aspect-[16/9] md:aspect-[2.2/1] overflow-hidden rounded-sm">
              <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
                <motion.img
                  key={slidePage}
                  src={heroSlides[slideIndex].image}
                  alt={heroSlides[slideIndex].alt}
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={slideIndex === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </AnimatePresence>

              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[85%] h-28 bg-gradient-to-t from-[var(--amber)]/15 via-[var(--amber)]/6 to-transparent blur-3xl pointer-events-none" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[65%] h-8 bg-black/40 blur-2xl rounded-full pointer-events-none" />
            </div>

            {/* Dot navigation */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {heroSlides.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setSlidePage([i, i > slideIndex ? 1 : -1])}
                  className={`h-1.5 rounded-full transition-colors ${
                    i === slideIndex
                      ? 'bg-[var(--amber)]'
                      : 'bg-[var(--border-strong)] hover:bg-[var(--text-secondary)]'
                  }`}
                  animate={{ width: i === slideIndex ? 40 : 8, opacity: i === slideIndex ? 1 : 0.4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              ))}
            </div>

            {/* Slide label */}
            <AnimatePresence mode="wait">
              <motion.div
                key={heroSlides[slideIndex].label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="text-center mt-3 text-label text-[var(--text-secondary)] tracking-widest"
              >
                {heroSlides[slideIndex].label}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stats */}
          <div className="hero-stats-wrapper mt-8 md:mt-12 opacity-0">
            <HeroStats />
          </div>
        </div>
      </div>

      {/* Bottom Carousel */}
      <div className="hero-carousel-wrapper relative z-10 mt-auto opacity-0">
        <div className="container-main mb-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
            <span className="text-label text-[var(--text-secondary)] tracking-widest">FEATURED COLLECTION</span>
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>
        </div>
        <HeroCarousel />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg)] to-transparent z-10 pointer-events-none" />
    </section>
  );
}