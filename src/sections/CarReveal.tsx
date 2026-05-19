import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CarRevealScene from '../components/CarRevealScene';

gsap.registerPlugin(ScrollTrigger);

/* ─── Scene definitions ────────────────────────────────────────────── */
interface Scene {
  label: string;
  title: string;
  sub: string;
  fadeIn: [number, number];
  peak: [number, number];
  fadeOut: [number, number];
}

const SCENES: Scene[] = [
  {
    label: 'Precision Engineering',
    title: 'Sculpted to Move',
    sub: 'Grade 4.5–5 factory condition',
    fadeIn: [0.00, 0.06],
    peak: [0.06, 0.13],
    fadeOut: [0.13, 0.18],
  },
  {
    label: 'Every Angle Considered',
    title: 'Form Meets Function',
    sub: "Direct from Japan's major auctions",
    fadeIn: [0.22, 0.28],
    peak: [0.28, 0.35],
    fadeOut: [0.35, 0.40],
  },
  {
    label: 'Step Inside',
    title: 'A Cabin Built for You',
    sub: 'Premium interiors, verified condition',
    fadeIn: [0.44, 0.50],
    peak: [0.50, 0.57],
    fadeOut: [0.57, 0.62],
  },
  {
    label: 'Crafted Comfort',
    title: 'Every Journey, Elevated',
    sub: 'Inspection reports included',
    fadeIn: [0.66, 0.72],
    peak: [0.72, 0.79],
    fadeOut: [0.79, 0.84],
  },
  {
    label: 'Ready to Drive?',
    title: 'Your Vehicle Awaits',
    sub: 'Shipped to 80+ countries worldwide',
    fadeIn: [0.88, 0.93],
    peak: [0.93, 0.99],
    fadeOut: [0.99, 1.00],
  },
];

function sceneOpacity(scene: Scene, p: number): number {
  const [fi0, fi1] = scene.fadeIn;
  const [, pk1] = scene.peak;
  const [fo0, fo1] = scene.fadeOut;
  if (p < fi0 || p > fo1) return 0;
  if (p < fi1) return (p - fi0) / (fi1 - fi0);
  if (p < fo0) return 1; // peak — stay fully visible
  return Math.max(0, 1 - (p - fo0) / Math.max(fo1 - fo0, 0.001));
  void pk1; // used for type satisfaction
}

/* ─── HUD corner bracket ───────────────────────────────────────────── */
function Corner({
  top, right, bottom, left,
}: {
  top?: boolean; right?: boolean; bottom?: boolean; left?: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: top !== undefined ? (top ? 28 : undefined) : undefined,
        bottom: bottom !== undefined ? (bottom ? 28 : undefined) : undefined,
        left: left !== undefined ? (left ? 28 : undefined) : undefined,
        right: right !== undefined ? (right ? 28 : undefined) : undefined,
        width: 28,
        height: 28,
        borderTop: top ? '1.5px solid rgba(212,168,83,0.55)' : undefined,
        borderBottom: bottom ? '1.5px solid rgba(212,168,83,0.55)' : undefined,
        borderLeft: left ? '1.5px solid rgba(212,168,83,0.55)' : undefined,
        borderRight: right ? '1.5px solid rgba(212,168,83,0.55)' : undefined,
        pointerEvents: 'none',
      }}
    />
  );
}

/* ─── Component ────────────────────────────────────────────────────── */
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
        scrub: 1.4,
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
      style={{ height: '500vh', backgroundColor: 'var(--bg)', position: 'relative' }}
    >
      {/* ── Sticky viewport ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Three.js canvas */}
        <CarRevealScene scrollProgress={progress} />

        {/* ── Letterbox bars (cinematic) ─────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 4,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.88) 100%)',
          }}
        />

        {/* ── Radial vignette ───────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 5,
            background:
              'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.72) 100%)',
          }}
        />

        {/* ── Film grain ────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 6,
            opacity: 0.048,
            mixBlendMode: 'overlay',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px',
          }}
        />

        {/* ── CRT scan lines (subtle, game-UI feel) ─────────────────── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 7,
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 3px)',
          }}
        />

        {/* ── HUD corner brackets ────────────────────────────────────── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 8, pointerEvents: 'none' }}>
          <Corner top left />
          <Corner top right />
          <Corner bottom left />
          <Corner bottom right />
        </div>

        {/* ── Side progress rail ────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            right: 22,
            top: '20%',
            height: '60%',
            width: 1,
            backgroundColor: 'rgba(212,168,83,0.12)',
            zIndex: 8,
            pointerEvents: 'none',
          }}
        >
          {/* Progress fill */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${Math.min(progress * 100, 100)}%`,
              background:
                'linear-gradient(to bottom, rgba(212,168,83,0.8), rgba(212,168,83,0.3))',
              transition: 'height 0.08s linear',
            }}
          />
          {/* Scene dot markers */}
          {SCENES.map((scene, i) => {
            const dotPos = (i / (SCENES.length - 1)) * 100;
            const active =
              progress >= scene.fadeIn[0] && progress <= scene.fadeOut[1];
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: `${dotPos}%`,
                  transform: 'translate(-50%, -50%)',
                  width: active ? 6 : 3,
                  height: active ? 6 : 3,
                  borderRadius: '50%',
                  backgroundColor: active
                    ? 'var(--amber)'
                    : 'rgba(212,168,83,0.35)',
                  boxShadow: active ? '0 0 6px rgba(212,168,83,0.7)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            );
          })}
        </div>

        {/* ── Top HUD strip ─────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: 72,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 24,
            zIndex: 8,
            pointerEvents: 'none',
            opacity: Math.min(progress * 10, 1) * 0.7,
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.6rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(212,168,83,0.6)',
            }}
          >
            JDM EXPORT
          </span>
          <div
            style={{
              width: 40,
              height: 1,
              backgroundColor: 'rgba(212,168,83,0.25)',
            }}
          />
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.6rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(245,240,235,0.35)',
            }}
          >
            Vehicle Showcase
          </span>
          <div
            style={{
              width: 40,
              height: 1,
              backgroundColor: 'rgba(212,168,83,0.25)',
            }}
          />
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.6rem',
              letterSpacing: '0.22em',
              color: 'rgba(212,168,83,0.6)',
            }}
          >
            {String(Math.round(progress * 100)).padStart(3, '0')}%
          </span>
        </div>

        {/* ── Cinematic scene text overlays ─────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 9,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '13vh',
          }}
        >
          {SCENES.map((scene, idx) => {
            const opacity = sceneOpacity(scene, progress);
            if (opacity <= 0) return null;
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  textAlign: 'center',
                  padding: '0 2rem',
                  opacity,
                  transform: `translateY(${(1 - opacity) * 18}px)`,
                  willChange: 'opacity, transform',
                }}
              >
                {/* Label */}
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '0.6rem',
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    color: 'var(--amber)',
                    marginBottom: '0.6rem',
                  }}
                >
                  {scene.label}
                </span>

                {/* Title — movie intertitle style */}
                <h2
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.025em',
                    color: 'var(--text-primary)',
                    textShadow:
                      '0 2px 32px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.6)',
                    margin: 0,
                  }}
                >
                  {scene.title}
                </h2>

                {/* Divider line */}
                <div
                  style={{
                    width: 36,
                    height: 1,
                    backgroundColor: 'var(--amber)',
                    opacity: 0.5,
                    margin: '10px auto',
                  }}
                />

                {/* Sub-caption */}
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '0.78rem',
                    letterSpacing: '0.06em',
                    color: 'rgba(245,240,235,0.55)',
                  }}
                >
                  {scene.sub}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Bottom left — scene counter ────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            left: 36,
            zIndex: 8,
            pointerEvents: 'none',
            opacity: 0.5,
          }}
        >
          {SCENES.map((scene, i) => {
            const active =
              progress >= scene.fadeIn[0] && progress <= scene.fadeOut[1];
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 5,
                  opacity: active ? 1 : 0.22,
                  transition: 'opacity 0.4s ease',
                }}
              >
                <div
                  style={{
                    width: active ? 18 : 8,
                    height: 1,
                    backgroundColor: active
                      ? 'var(--amber)'
                      : 'rgba(212,168,83,0.4)',
                    transition: 'width 0.3s ease',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.55rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: active ? 'var(--amber)' : 'rgba(245,240,235,0.4)',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Scroll hint ────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9,
            opacity: progress < 0.04 ? 1 - progress / 0.04 : 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '0.55rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(245,240,235,0.4)',
            }}
          >
            Scroll to Explore
          </span>
          <div
            style={{
              width: 1,
              height: 36,
              overflow: 'hidden',
              backgroundColor: 'rgba(212,168,83,0.2)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 10,
                backgroundColor: 'var(--amber)',
                borderRadius: 2,
                animation: 'scrollDrop 1.9s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollDrop {
          0%   { transform: translateY(-10px); opacity: 0; }
          35%  { opacity: 1; }
          100% { transform: translateY(36px); opacity: 0; }
        }
      `}</style>
    </section>
  );
}