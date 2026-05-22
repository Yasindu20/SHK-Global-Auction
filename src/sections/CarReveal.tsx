import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CarRevealScene from "../components/CarRevealScene";

gsap.registerPlugin(ScrollTrigger);

interface Scene {
  label: string;
  title: string;
  sub: string;
  // Normalized [0,1] scroll positions
  fadeIn:  [number, number];
  peak:    [number, number];
  fadeOut: [number, number];
}

const SCENES: Scene[] = [
  {
    label:   "Precision Engineering",
    title:   "Sculpted to Move",
    sub:     "Grade 4–5 factory condition, direct from auction",
    fadeIn:  [0.00, 0.07],
    peak:    [0.07, 0.18],
    fadeOut: [0.18, 0.24],
  },
  {
    label:   "Every Angle Considered",
    title:   "Form Meets Function",
    sub:     "JDM classics & modern imports, verified history",
    fadeIn:  [0.26, 0.33],
    peak:    [0.33, 0.44],
    fadeOut: [0.44, 0.50],
  },
  {
    label:   "Step Inside",
    title:   "A Cabin Built for You",
    sub:     "Premium interiors with auction-sheet transparency",
    fadeIn:  [0.52, 0.59],
    peak:    [0.59, 0.70],
    fadeOut: [0.70, 0.76],
  },
  {
    label:   "Crafted Comfort",
    title:   "Every Journey, Elevated",
    sub:     "Full inspection reports & condition grading",
    fadeIn:  [0.78, 0.85],
    peak:    [0.85, 0.94],
    fadeOut: [0.94, 1.00],
  },
];

// Smoothstep eased opacity
function sceneOpacity(scene: Scene, p: number): number {
  const [fi0, fi1] = scene.fadeIn;
  const [fo0, fo1] = scene.fadeOut;
  if (p <= fi0 || p >= fo1) return 0;
  if (p < fi1) {
    const t = (p - fi0) / (fi1 - fi0);
    return t * t * (3 - 2 * t); // smoothstep
  }
  if (p <= fo0) return 1;
  const t = 1 - (p - fo0) / Math.max(fo1 - fo0, 0.001);
  return t * t * (3 - 2 * t); // smoothstep out
}

export default function CarReveal() {
  const sectionRef        = useRef<HTMLElement>(null);
  const stickyRef         = useRef<HTMLDivElement>(null);
  const progressRef       = useRef<number>(0);
  const textRefs          = useRef<(HTMLDivElement | null)[]>([]);
  const counterRefs       = useRef<(HTMLDivElement | null)[]>([]);
  const scrollHintRef     = useRef<HTMLDivElement>(null);
  const letterboxTopRef   = useRef<HTMLDivElement>(null);
  const letterboxBottomRef = useRef<HTMLDivElement>(null);
  const hudRef            = useRef<HTMLDivElement>(null);
  const hudProgressRef    = useRef<HTMLSpanElement>(null);
  const railFillRef       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky  = stickyRef.current;
    if (!section || !sticky) return;

    // ── Master scroll timeline ─────────────────────────────────────────────
    // scrub: 1 gives a 1 second lag — feels cinematic and smooth
    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start:   "top top",
        end:     "+=400%",
        pin:     sticky,
        scrub:   1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressRef.current = self.progress;

          // Update HUD counter (just DOM text, very cheap)
          if (hudProgressRef.current) {
            hudProgressRef.current.textContent =
              String(Math.round(self.progress * 100)).padStart(3, "0") + "%";
          }

          // Update rail fill
          if (railFillRef.current) {
            railFillRef.current.style.height =
              `${Math.min(self.progress * 100, 100)}%`;
          }

          // ── Update text overlays ─────────────────────────────────────────
          const p = self.progress;
          SCENES.forEach((scene, i) => {
            const el = textRefs.current[i];
            if (!el) return;
            const op = sceneOpacity(scene, p);
            el.style.opacity = String(op);
            el.style.transform = `translateY(${(1 - op) * 22}px)`;

            // Counter active state
            const counter = counterRefs.current[i];
            if (counter) {
              const isActive = p >= scene.fadeIn[0] && p <= scene.fadeOut[1];
              counter.style.opacity = isActive ? "1" : "0.22";
              const bar = counter.querySelector(".cr-bar") as HTMLElement | null;
              if (bar) {
                bar.style.width = isActive ? "22px" : "8px";
                bar.style.backgroundColor = isActive
                  ? "var(--amber)"
                  : "rgba(212,168,83,0.3)";
              }
            }
          });
        },
      },
    });

    // Letterbox open
    masterTl.fromTo(
      [letterboxTopRef.current, letterboxBottomRef.current],
      { scaleY: 0 },
      { scaleY: 1, duration: 0.06, ease: "power2.out" },
      0
    );

    // HUD fade in
    masterTl.fromTo(
      hudRef.current,
      { opacity: 0, y: -16 },
      { opacity: 1, y: 0, duration: 0.05, ease: "power2.out" },
      0.02
    );

    // Scroll hint fade out
    const hintSt = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=8%",
      scrub: 1,
      onUpdate: (self) => {
        if (scrollHintRef.current) {
          scrollHintRef.current.style.opacity = String(1 - self.progress);
        }
      },
    });

    // Subtle mouse parallax — only rotateY/X, no translate (avoids edge artifacts)
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(sticky, {
        rotateY:  x * 1.2,
        rotateX: -y * 1.2,
        duration: 1.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      masterTl.kill();
      hintSt.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.trigger === section) st.kill();
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[var(--bg)]"
      style={{ height: "500vh" }}
    >
      <div
        ref={stickyRef}
        className="sticky top-0 w-full h-screen overflow-hidden"
        style={{ perspective: "1200px", willChange: "transform" }}
      >
        {/* ── Three.js canvas ─────────────────────────────────────────────── */}
        <CarRevealScene progressRef={progressRef} />

        {/* ── Letterbox bars ───────────────────────────────────────────────── */}
        <div
          ref={letterboxTopRef}
          className="absolute top-0 left-0 right-0 bg-black z-20 pointer-events-none origin-top"
          style={{ height: "5.5vh" }}
        />
        <div
          ref={letterboxBottomRef}
          className="absolute bottom-0 left-0 right-0 bg-black z-20 pointer-events-none origin-bottom"
          style={{ height: "5.5vh" }}
        />

        {/* ── Vignette ─────────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none z-[5]"
          style={{
            background:
              "radial-gradient(ellipse 78% 68% at 50% 50%, transparent 32%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* ── Film grain ───────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none z-[6] opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />

        {/* ── Scanlines ────────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none z-[7] opacity-[0.18]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 4px)",
          }}
        />

        {/* ── Corner brackets ──────────────────────────────────────────────── */}
        <div className="absolute inset-0 z-[8] pointer-events-none">
          {(["tl", "tr", "bl", "br"] as const).map((pos) => (
            <CornerBracket key={pos} pos={pos} />
          ))}
        </div>

        {/* ── Top HUD ──────────────────────────────────────────────────────── */}
        <div
          ref={hudRef}
          className="absolute top-[7vh] left-0 right-0 flex justify-center items-center gap-5 z-[9] pointer-events-none opacity-0"
        >
          <span
            className="font-sans text-[0.62rem] tracking-[0.24em] uppercase"
            style={{ color: "rgba(212,168,83,0.65)" }}
          >
            JDM Export
          </span>
          <div
            className="w-8 h-px"
            style={{ backgroundColor: "rgba(212,168,83,0.2)" }}
          />
          <span
            className="font-sans text-[0.62rem] tracking-[0.16em] uppercase"
            style={{ color: "rgba(245,240,235,0.32)" }}
          >
            Vehicle Showcase
          </span>
          <div
            className="w-8 h-px"
            style={{ backgroundColor: "rgba(212,168,83,0.2)" }}
          />
          <span
            ref={hudProgressRef}
            className="font-mono text-[0.62rem] tracking-[0.14em] tabular-nums"
            style={{ color: "rgba(212,168,83,0.65)" }}
          >
            000%
          </span>
        </div>

        {/* ── Scene text overlays ──────────────────────────────────────────── */}
        <div className="absolute inset-0 z-[9] pointer-events-none flex items-end justify-center pb-[13vh]">
          {SCENES.map((scene, idx) => (
            <div
              key={idx}
              ref={(el) => { textRefs.current[idx] = el; }}
              className="absolute text-center px-8"
              style={{
                opacity: 0,
                transform: "translateY(22px)",
                // GPU-composite only properties for smooth transitions
                willChange: "opacity, transform",
                transition: "none", // GSAP handles this via onUpdate
              }}
            >
              <span
                className="block font-sans font-medium mb-3"
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "var(--amber)",
                }}
              >
                {scene.label}
              </span>
              <h2
                className="font-sans font-bold m-0 leading-none"
                style={{
                  fontSize: "clamp(1.9rem, 4.5vw, 3.4rem)",
                  letterSpacing: "-0.025em",
                  color: "var(--text-primary)",
                  textShadow: "0 4px 40px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.7)",
                }}
              >
                {scene.title}
              </h2>
              {/* Divider line */}
              <div
                className="mx-auto my-3"
                style={{
                  width: 36,
                  height: 1,
                  backgroundColor: "var(--amber)",
                  opacity: 0.45,
                }}
              />
              <span
                className="block font-sans font-normal"
                style={{
                  fontSize: "0.78rem",
                  letterSpacing: "0.055em",
                  color: "rgba(245,240,235,0.52)",
                }}
              >
                {scene.sub}
              </span>
            </div>
          ))}
        </div>

        {/* ── Scene counter (bottom-left) ───────────────────────────────────── */}
        <div className="absolute bottom-[7vh] left-8 z-[8] pointer-events-none">
          {SCENES.map((_, i) => (
            <div
              key={i}
              ref={(el) => { counterRefs.current[i] = el; }}
              className="flex items-center gap-2 mb-1.5"
              style={{ opacity: 0.22, willChange: "opacity" }}
            >
              <div
                className="cr-bar h-px transition-all duration-300"
                style={{
                  width: 8,
                  backgroundColor: "rgba(212,168,83,0.3)",
                }}
              />
              <span
                className="font-sans"
                style={{
                  fontSize: "0.52rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--amber)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>

        {/* ── Scroll hint ──────────────────────────────────────────────────── */}
        <div
          ref={scrollHintRef}
          className="absolute bottom-[7vh] left-1/2 -translate-x-1/2 z-[9] flex flex-col items-center gap-2 pointer-events-none"
        >
          <span
            className="font-sans font-medium"
            style={{
              fontSize: "0.52rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(245,240,235,0.38)",
            }}
          >
            Scroll to Explore
          </span>
          <div
            className="relative overflow-hidden"
            style={{
              width: 1,
              height: 36,
              backgroundColor: "rgba(212,168,83,0.18)",
            }}
          >
            <div className="absolute top-0 left-0 w-full rounded-sm animate-scrollDrop"
              style={{ height: 10, backgroundColor: "var(--amber)" }}
            />
          </div>
        </div>

        {/* ── Side progress rail ───────────────────────────────────────────── */}
        <div
          className="absolute right-5 z-[8] pointer-events-none"
          style={{
            top: "25%",
            height: "50%",
            width: 1,
            backgroundColor: "rgba(212,168,83,0.1)",
          }}
        >
          <div
            ref={railFillRef}
            className="absolute top-0 left-0 w-full"
            style={{
              height: "0%",
              background:
                "linear-gradient(to bottom, rgba(212,168,83,0.7), rgba(212,168,83,0.25))",
              willChange: "height",
            }}
          />
          {SCENES.map((_, i) => {
            const pct = (i / (SCENES.length - 1)) * 100;
            return (
              <div
                key={i}
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  top: `${pct}%`,
                  width: 4,
                  height: 4,
                  backgroundColor: "rgba(212,168,83,0.4)",
                }}
              />
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes scrollDrop {
          0%   { transform: translateY(-8px); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateY(28px); opacity: 0; }
        }
        .animate-scrollDrop {
          animation: scrollDrop 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

// ── Corner bracket ────────────────────────────────────────────────────────────
function CornerBracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const isTop    = pos === "tl" || pos === "tr";
  const isLeft   = pos === "tl" || pos === "bl";
  const style: React.CSSProperties = {
    position: "absolute",
    width: 26,
    height: 26,
    top:    isTop    ? 30 : undefined,
    bottom: !isTop   ? 30 : undefined,
    left:   isLeft   ? 30 : undefined,
    right:  !isLeft  ? 30 : undefined,
    borderTop:    isTop    ? "1.5px solid rgba(212,168,83,0.48)" : undefined,
    borderBottom: !isTop   ? "1.5px solid rgba(212,168,83,0.48)" : undefined,
    borderLeft:   isLeft   ? "1.5px solid rgba(212,168,83,0.48)" : undefined,
    borderRight:  !isLeft  ? "1.5px solid rgba(212,168,83,0.48)" : undefined,
  };
  return <div style={style} />;
}