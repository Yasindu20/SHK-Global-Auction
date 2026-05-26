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

// Static slides array - defined outside component to prevent re-creation on every render
const heroSlides: HeroSlide[] = [
  {
    image: 'https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&w=1600&q=80',
    alt: 'Mercedes-Benz S-Class',
    label: 'Mercedes-Benz S-Class'
  },
  {
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1600&q=80',
    alt: 'Porsche 911 GT3',
    label: 'Porsche 911 GT3'
  },
  {
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1600&q=80',
    alt: 'BMW M4 Competition',
    label: 'BMW M4 Competition'
  },
  {
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1600&q=80',
    alt: 'Lamborghini Huracán',
    label: 'Lamborghini Huracán'
  }
];

// Optimized cubic bezier for smooth Awwwards-quality animations
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as [number, number, number, number];

// Memoized slide variants with enhanced 3D transforms
const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    z: -200,
    opacity: 0,
    scale: 0.85,
    rotateY: direction > 0 ? 25 : -25,
    rotateX: direction * 4,
    rotateZ: direction * 1.5
  }),
  center: {
    x: 0,
    z: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
    rotateX: 0,
    rotateZ: 0,
    transition: {
      duration: 1.1,
      ease: EASE_OUT_EXPO,
      type: 'spring' as const,
      stiffness: 80,
      damping: 25
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    z: -150,
    opacity: 0,
    scale: 0.85,
    rotateY: direction > 0 ? -25 : 25,
    rotateX: -direction * 4,
    rotateZ: -direction * 1.5,
    transition: {
      duration: 0.8,
      ease: EASE_OUT_EXPO
    }
  })
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

  const [[slidePage, slideDirection], setSlidePage] = useState([0, 0]);
  const slideIndex = ((slidePage % heroSlides.length) + heroSlides.length) % heroSlides.length;

  const paginate = useCallback((newDirection: number) => {
    setSlidePage(prev => [prev[0] + newDirection, newDirection]);
  }, []);

  // Auto-advance hero slideshow
  useEffect(() => {
    const timer = setInterval(() => paginate(1), 6000);
    return () => clearInterval(timer);
  }, [paginate]);

  // Mouse parallax with GSAP for ultra-smooth interpolation
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    // Enhanced 3D parallax for image layer
    gsap.to(imageLayerRef.current, {
      rotateY: x * 6,
      rotateX: -y * 4,
      z: Math.abs(x) * 15 + Math.abs(y) * 10,
      duration: 0.9,
      ease: 'power3.out',
      force3D: true
    });

    // Counter-parallax for text layer
    gsap.to(textLayerRef.current, {
      x: x * -30,
      y: y * -18,
      z: 50,
      duration: 1.1,
      ease: 'power3.out',
      force3D: true
    });

    // Subtle CTA parallax
    gsap.to(ctaRef.current, {
      x: x * -12,
      y: y * -9,
      duration: 1.3,
      ease: 'power2.out',
      force3D: true
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // GSAP Master Timeline with enhanced Awwwards-quality animations
  useGSAP(() => {
    const tl = gsap.timeline({
      defaults: { ease: 'power4.out' },
      onComplete: () => {
        gsap.to(scrollIndicatorRef.current, { opacity: 1, duration: 1.2 });
      }
    });

    // Atmospheric background reveal
    tl.fromTo('.hero-atmosphere', { opacity: 0 }, { opacity: 1, duration: 2.5 });
    
    // Eyebrow text animation
    tl.fromTo('.hero-eyebrow', { y: 30, opacity: 0, rotateX: -20 }, { 
      y: 0, opacity: 1, rotateX: 0, duration: 1, ease: 'back.out(1.7)' 
    }, '-=2');
    
    // Split text headline animation with staggered reveal
    tl.fromTo('.hero-word-inner', { y: '120%', opacity: 0, rotateX: 60, scale: 0.9 }, {
      y: '0%', opacity: 1, rotateX: 0, scale: 1, duration: 1.6, stagger: 0.08, ease: 'power3.out'
    }, '-=1.4');
    
    // Subheadline with blur reveal effect
    tl.fromTo('.hero-subheadline', { opacity: 0, filter: 'blur(16px)', y: 40, scale: 0.95 }, {
      opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, duration: 1.4, ease: 'power3.out'
    }, '-=1.1');
    
    // Image layer dramatic entrance
    tl.fromTo(imageLayerRef.current, {
      scale: 0.82, opacity: 0, y: 80, rotateY: 18, z: -100
    }, {
      scale: 1, opacity: 1, y: 0, rotateY: 0, z: 0, duration: 2, ease: 'expo.out'
    }, '-=1.6');
    
    // CTA buttons with spring-like entrance
    tl.fromTo('.hero-cta-btn', { y: 50, opacity: 0, scale: 0.9 }, {
      y: 0, opacity: 1, scale: 1, duration: 1.1, stagger: 0.14, ease: 'elastic.out(1, 0.5)'
    }, '-=1.4');
    
    // Stats counter animation
    tl.fromTo('.hero-stats-wrapper', { opacity: 0, y: 40, scale: 0.95 }, {
      opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out'
    }, '-=0.9');
    
    // Carousel dramatic slide-in
    tl.fromTo('.hero-carousel-wrapper', { opacity: 0, y: 80, rotateX: 10 }, {
      opacity: 1, y: 0, rotateX: 0, duration: 1.4, ease: 'power3.out'
    }, '-=0.8');

    // Scroll-driven parallax exit effects
    gsap.to(textLayerRef.current, {
      y: -150,
      z: -50,
      scrollTrigger: { trigger: containerRef.current, start: 'top top', end: 'bottom top', scrub: 1.8 }
    });
    gsap.to(imageLayerRef.current, {
      y: 100, scale: 1.12, z: -80,
      scrollTrigger: { trigger: containerRef.current, start: 'top top', end: 'bottom top', scrub: 1.8 }
    });
    gsap.to(containerRef.current, {
      opacity: 0.2,
      scrollTrigger: { trigger: containerRef.current, start: '60% top', end: 'bottom top', scrub: 1.2 }
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] overflow-hidden flex flex-col"
      style={{ perspective: '1200px' }}
    >
      <HeroBackground />

      <div className="hero-atmosphere absolute inset-0 pointer-events-none z-[1]">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-40 animate-ambient"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212,168,83,0.12) 0%, rgba(212,168,83,0.04) 30%, transparent 70%)'
          }}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center pt-24 pb-8">
        <div className="container-main w-full">
          {/* Text Layer with enhanced 3D perspective */}
          <div
            ref={textLayerRef}
            className="text-center max-w-5xl mx-auto will-change-transform"
            style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
          >
            <motion.div
              className="hero-eyebrow text-label text-[var(--amber)] mb-6 md:mb-8 tracking-[0.2em] opacity-0"
              whileHover={{ letterSpacing: '0.35em', transition: { duration: 0.5, ease: 'easeOut' } }}
              animate={{ textShadow: ['0 0 0px rgba(212,168,83,0)', '0 0 20px rgba(212,168,83,0.4)', '0 0 0px rgba(212,168,83,0)'] }}
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

            {/* CTAs with Magnetic Effect and enhanced hover states */}
            <div ref={ctaRef} className="flex flex-wrap gap-4 justify-center will-change-transform">
              <MagneticButton
                as="a"
                href="/inventory"
                className="hero-cta-btn group relative inline-flex items-center gap-2 px-8 py-4 bg-[var(--amber)] text-[var(--bg)] font-semibold rounded-sm overflow-hidden opacity-0"
                strength={0.3}
              >
                <span className="relative z-10">Explore Inventory</span>
                <ChevronRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-600 ease-out" />
                <motion.div
                  className="absolute inset-0 bg-white/10 opacity-0"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
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
                <motion.div
                  className="absolute inset-0 border border-[var(--amber)] opacity-0 rounded-sm"
                  whileHover={{ opacity: 0.3, scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                />
              </MagneticButton>
            </div>
          </div>

          {/* Car Image Layer with Framer Motion Slideshow and enhanced 3D */}
          <div
            ref={imageLayerRef}
            className="relative w-full max-w-4xl mx-auto mt-8 md:mt-4 will-change-transform"
            style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
          >
            <div className="relative aspect-[16/9] md:aspect-[2.2/1] overflow-visible">
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
                  className="absolute inset-0 w-full h-full object-cover drop-shadow-2xl z-10"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    filter: 'brightness(1.05) contrast(1.02)',
                    backfaceVisibility: 'hidden'
                  }}
                />
              </AnimatePresence>

              {/* Enhanced floor reflection with gradient layers */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[90%] h-32 bg-gradient-to-t from-[var(--amber)]/20 via-[var(--amber)]/8 to-transparent blur-3xl z-0" />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-10 bg-black/50 blur-2xl z-0 rounded-full" />
              
              {/* Side glow accents for depth */}
              <motion.div
                className="absolute top-1/2 -left-20 w-40 h-40 bg-[var(--amber)]/10 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute top-1/2 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.5, 0.3, 0.5]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              />
            </div>

            {/* Slide Navigation Dots with enhanced animation */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {heroSlides.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setSlidePage([i, i > slideIndex ? 1 : -1])}
                  className={`h-2 rounded-full transition-colors ${
                    i === slideIndex ? 'bg-[var(--amber)]' : 'bg-[var(--border-strong)] hover:bg-[var(--text-secondary)]'
                  }`}
                  animate={{
                    width: i === slideIndex ? 48 : 10,
                    opacity: i === slideIndex ? 1 : 0.4,
                    scaleX: i === slideIndex ? 1.1 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  whileHover={{ scale: 1.3, backgroundColor: 'var(--amber)' }}
                  whileTap={{ scale: 0.85 }}
                />
              ))}
            </div>

            {/* Active Slide Label with smooth transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={heroSlides[slideIndex].label}
                initial={{ opacity: 0, y: 12, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -12, rotateX: 15 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="text-center mt-4 text-label text-[var(--text-secondary)] tracking-widest"
                style={{ transformStyle: 'preserve-3d' }}
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

      {/* Scroll Indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 opacity-0"
      >
        <span className="text-label text-[var(--text-secondary)] tracking-widest text-[10px]">SCROLL</span>
        <div className="relative w-px h-12 bg-[var(--border-subtle)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full bg-[var(--amber)] animate-scroll-line" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg)] to-transparent z-10 pointer-events-none" />
    </section>
  );
}