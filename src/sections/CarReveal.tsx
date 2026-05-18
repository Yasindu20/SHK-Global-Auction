import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CarRevealScene from '../components/CarRevealScene';

gsap.registerPlugin(ScrollTrigger);

export default function CarReveal() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
        onUpdate: (self) => setProgress(self.progress),
      },
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.trigger === section) st.kill();
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: '400vh', backgroundColor: 'var(--bg)' }}
    >
      <div
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: '100vh' }}
      >
        <CarRevealScene scrollProgress={progress} />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-[5]"
          style={{
            background:
              'radial-gradient(circle at center, transparent 50%, rgba(10,10,10,0.6) 100%)',
          }}
        />
        {/* Film grain */}
        <div
          className="absolute inset-0 pointer-events-none z-[6] opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '128px',
          }}
        />

        {/* Phase text overlays */}
        <div className="absolute inset-0 z-[4] pointer-events-none flex flex-col items-center justify-center">
          <div
            className="absolute text-center"
            style={{
              opacity: progress < 0.15 ? 1 - progress / 0.15 : 0,
              transform: `translateY(${(progress - 0.075) * -80}px)`,
            }}
          >
            <span className="text-label block mb-3" style={{ color: 'var(--amber)' }}>
              Precision Engineering
            </span>
            <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
              Sculpted to Move
            </h2>
          </div>

          <div
            className="absolute text-center"
            style={{
              opacity: progress > 0.3 && progress < 0.45 ? 1 : 0,
              transform: `translateY(${(progress - 0.375) * -60}px)`,
            }}
          >
            <span className="text-label block mb-3" style={{ color: 'var(--amber)' }}>
              Every Angle Considered
            </span>
            <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
              Form Meets Function
            </h2>
          </div>

          <div
            className="absolute text-center"
            style={{
              opacity: progress > 0.5 && progress < 0.65 ? 1 : 0,
              transform: `translateY(${(progress - 0.575) * -60}px)`,
            }}
          >
            <span className="text-label block mb-3" style={{ color: 'var(--amber)' }}>
              Step Inside
            </span>
            <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
              A Cabin Built for You
            </h2>
          </div>

          <div
            className="absolute text-center"
            style={{
              opacity: progress > 0.7 && progress < 0.85 ? 1 : 0,
              transform: `translateY(${(progress - 0.775) * -60}px)`,
            }}
          >
            <span className="text-label block mb-3" style={{ color: 'var(--amber)' }}>
              Crafted Comfort
            </span>
            <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
              Where Journeys Begin
            </h2>
          </div>

          <div
            className="absolute text-center"
            style={{
              opacity: progress > 0.9 ? (progress - 0.9) / 0.1 : 0,
              transform: `translateY(${(1 - progress) * 40}px)`,
            }}
          >
            <span className="text-label block mb-3" style={{ color: 'var(--amber)' }}>
              Ready to Drive?
            </span>
            <h2 className="text-h2 mb-6" style={{ color: 'var(--text-primary)' }}>
              Your Vehicle Awaits
            </h2>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[4] transition-opacity duration-500"
          style={{ opacity: progress < 0.05 ? 1 : 0 }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
              Scroll to Explore
            </span>
            <div
              className="w-[1px] h-8 overflow-hidden"
              style={{ backgroundColor: 'var(--text-secondary)' }}
            >
              <div
                className="w-full h-2 rounded-full"
                style={{
                  backgroundColor: 'var(--amber)',
                  animation: 'scrollHint 1.5s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollHint {
          0% { transform: translateY(-8px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(32px); opacity: 0; }
        }
      `}</style>
    </section>
  );
}