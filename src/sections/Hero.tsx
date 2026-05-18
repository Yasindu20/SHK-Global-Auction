import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroScene from '../components/HeroScene';
import gsap from 'gsap';

export default function Hero() {
  const labelRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      labelRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.5 }
    )
      .fromTo(
        headlineRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8 },
        0.7
      )
      .fromTo(
        sublineRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        1.0
      )
      .fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        1.2
      );

    return () => {
      tl.kill();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setHidden(true);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '100vh', backgroundColor: 'var(--bg)' }}
    >
      <HeroScene />

      {/* Bottom gradient overlay for text readability */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[2]"
        style={{
          height: '60%',
          background: 'linear-gradient(to top, rgba(10,10,10,0.85) 0%, transparent 100%)',
        }}
      />

      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-[3]">
        <div className="container-main pb-16 md:pb-20">
          <div ref={labelRef} className="opacity-0" style={{ color: 'var(--text-secondary)' }}>
            <span className="text-label">Premium JDM Vehicle Export</span>
          </div>

          <h1
            ref={headlineRef}
            className="text-display mt-3 opacity-0"
            style={{ color: 'var(--text-primary)' }}
          >
            From Auction to<br className="hidden md:block" /> Your Port
          </h1>

          <div ref={sublineRef} className="mt-4 opacity-0 max-w-[520px]">
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Direct access to 150,000+ vehicles from Japan's major auto auctions.
              Shipped to 80+ countries with complete documentation.
            </p>
          </div>

          <div ref={ctaRef} className="mt-6 opacity-0">
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 font-semibold transition-all duration-200 group"
              style={{ color: 'var(--amber)', fontSize: '1rem' }}
            >
              Browse Inventory
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollIndicatorRef}
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-[3] transition-opacity duration-300 ${hidden ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="relative w-[1px] h-10 overflow-hidden" style={{ backgroundColor: 'var(--text-secondary)' }}>
          <div
            className="absolute top-0 left-0 w-full h-2 rounded-full"
            style={{
              backgroundColor: 'var(--text-primary)',
              animation: 'scrollDot 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scrollDot {
          0% { top: 0; opacity: 1; }
          80% { top: 32px; opacity: 0; }
          100% { top: 0; opacity: 0; }
        }
      `}</style>
    </section>
  );
}
