import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function CTABanner() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        content.children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.2,
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-padding" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="container-main">
        <div
          className="rounded-2xl text-center py-16 md:py-20 px-6"
          style={{
            background: 'linear-gradient(135deg, #1a1209 0%, #0A0A0A 100%)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div ref={contentRef}>
            <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
              Ready to Find Your Vehicle?
            </h2>
            <p
              className="mt-4 mx-auto max-w-[480px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Get a personalized quote with shipping to your destination. No obligation,
              full transparency on all costs.
            </p>
            <Link
              to="/inventory"
              className="inline-block mt-6 px-8 py-3.5 rounded-lg font-semibold text-base transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--amber)',
                color: 'var(--bg)',
              }}
            >
              Request a Quote
            </Link>
            <div className="mt-4">
              <Link
                to="/inventory"
                className="inline-flex items-center gap-1 transition-all duration-200 group"
                style={{ color: 'var(--amber)', fontSize: '0.875rem' }}
              >
                Or browse inventory
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
