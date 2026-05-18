import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { destinations } from '../data/vehicles';

gsap.registerPlugin(ScrollTrigger);

export default function DestinationShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const left = leftRef.current;
    const cards = cardsRef.current.filter(Boolean);
    if (!section || !left) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        left,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );

      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: 'power2.out',
            delay: i * 0.1,
            scrollTrigger: {
              trigger: section,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="destinations"
      ref={sectionRef}
      className="section-padding"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div className="container-main">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left column */}
          <div ref={leftRef} className="lg:w-[40%] opacity-0">
            <span className="text-label" style={{ color: 'var(--amber)' }}>
              Global Reach
            </span>
            <h2 className="text-h2 mt-3" style={{ color: 'var(--text-primary)' }}>
              Shipped to 80+ Countries
            </h2>
            <p className="mt-4" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              From East Africa to the Caribbean, Southeast Asia to Oceania — we handle
              every step including pre-shipment inspection, customs documentation, and
              port clearance.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 mt-4 font-semibold transition-all duration-200 group"
              style={{ color: 'var(--amber)' }}
            >
              View All Destinations
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </a>

            <div className="flex gap-8 mt-8">
              <div>
                <span className="text-h3" style={{ color: 'var(--amber)' }}>
                  3,200+
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Shipments in 2025
                </p>
              </div>
              <div>
                <span className="text-h3" style={{ color: 'var(--amber)' }}>
                  97%
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  On-time arrival
                </p>
              </div>
            </div>
          </div>

          {/* Right column - destination cards */}
          <div className="lg:w-[60%] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {destinations.slice(0, 4).map((dest, i) => (
              <div
                key={dest.country}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="p-6 rounded-xl opacity-0 transition-all duration-200 cursor-default"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '2rem' }}>{dest.flag}</span>
                <h4 className="mt-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {dest.country}
                </h4>
                <p className="mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Port: {dest.port}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Transit: {dest.transit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
