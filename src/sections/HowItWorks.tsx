import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { processSteps } from '../data/vehicles';

gsap.registerPlugin(ScrollTrigger);

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const arrowsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const steps = stepsRef.current.filter(Boolean);
    const arrows = arrowsRef.current.filter(Boolean);
    if (!section || steps.length === 0) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      tl.to(steps, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.15,
      });

      tl.to(
        arrows,
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.15,
        },
        '-=0.5'
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="section-padding"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      <div className="container-main">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
            How It Works
          </h2>
          <p
            className="mt-3 mx-auto max-w-[480px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            From auction floor to your destination port in 5 simple steps.
          </p>
        </div>

        {/* Steps - Desktop horizontal */}
        <div className="hidden lg:flex items-start justify-center gap-4">
          {processSteps.map((step, i) => (
            <div key={i} className="flex items-center">
              <div
                ref={(el) => { stepsRef.current[i] = el; }}
                className="text-center max-w-[200px] opacity-0"
                style={{ transform: 'translateY(40px)' }}
              >
                <span
                  className="block font-bold"
                  style={{
                    fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                    lineHeight: 1.05,
                    letterSpacing: '-0.03em',
                    color: 'rgba(212, 168, 83, 0.12)',
                  }}
                >
                  {step.number}
                </span>
                <h4
                  className="mt-2 font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {step.title}
                </h4>
                <p
                  className="mt-1"
                  style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}
                >
                  {step.description}
                </p>
              </div>
              {i < processSteps.length - 1 && (
                <span
                  ref={(el) => { arrowsRef.current[i] = el; }}
                  className="mx-4 text-2xl opacity-0 shrink-0"
                  style={{
                    color: 'var(--text-secondary)',
                    transform: 'translateX(-10px)',
                  }}
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Steps - Mobile vertical */}
        <div className="lg:hidden relative">
          {/* Timeline line */}
          <div
            className="absolute left-[23px] top-0 bottom-0 w-[1px]"
            style={{ backgroundColor: 'var(--text-secondary)' }}
          />

          <div className="space-y-8">
            {processSteps.map((step, i) => (
              <div
                key={i}
                ref={(el) => { stepsRef.current[i] = el; }}
                className="flex gap-4 opacity-0"
                style={{ transform: 'translateY(40px)' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-sm font-bold z-10"
                  style={{
                    backgroundColor: 'var(--surface-light)',
                    color: 'var(--amber)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {step.number}
                </div>
                <div>
                  <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {step.title}
                  </h4>
                  <p
                    className="mt-1"
                    style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
