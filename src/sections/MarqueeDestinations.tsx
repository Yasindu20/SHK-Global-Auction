import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { marqueeDestinations } from '../data/vehicles';

gsap.registerPlugin(ScrollTrigger);

export default function MarqueeDestinations() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        track,
        { x: '100vw' },
        {
          x: '-100%',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const items = [...marqueeDestinations, ...marqueeDestinations, ...marqueeDestinations];

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden"
      style={{
        backgroundColor: 'var(--marquee-bg)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '3rem 0',
      }}
    >
      <div
        ref={trackRef}
        className="flex whitespace-nowrap items-center"
        style={{ gap: '4rem' }}
      >
        {items.map((dest, i) => (
          <div key={i} className="flex items-center shrink-0" style={{ gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>
              {getFlag(dest)}
            </span>
            <span
              className="text-h3"
              style={{
                color: 'var(--text-primary)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {dest}
            </span>
            <span
              className="ml-8"
              style={{ color: 'var(--text-secondary)', fontSize: '1.5rem' }}
            >
              ·
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function getFlag(city: string): string {
  const map: Record<string, string> = {
    'Mombasa': '🇰🇪',
    'Dar es Salaam': '🇹🇿',
    'Durban': '🇿🇦',
    'Kingston': '🇯🇲',
    'Port of Spain': '🇹🇹',
    'Georgetown': '🇬🇾',
    'Colombo': '🇱🇰',
    'Chittagong': '🇧🇩',
    'Lae': '🇵🇬',
    'Suva': '🇫🇯',
    'Port Klang': '🇲🇾',
    'Manila': '🇵🇭',
  };
  return map[city] || '🌍';
}
