import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CarRevealScene from "../components/CarRevealScene";

gsap.registerPlugin(ScrollTrigger);

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
    label: "Precision Engineering",
    title: "Sculpted to Move",
    sub: "Grade 4–5 factory condition, direct from auction",
    fadeIn:  [0.00, 0.07],
    peak:    [0.07, 0.18],
    fadeOut: [0.18, 0.24],
  },
  {
    label: "Every Angle Considered",
    title: "Form Meets Function",
    sub: "JDM classics & modern imports, verified history",
    fadeIn:  [0.26, 0.33],
    peak:    [0.33, 0.44],
    fadeOut: [0.44, 0.50],
  },
  {
    label: "Step Inside",
    title: "A Cabin Built for You",
    sub: "Premium interiors with auction-sheet transparency",
    fadeIn:  [0.52, 0.59],
    peak:    [0.59, 0.70],
    fadeOut: [0.70, 0.76],
  },
  {
    label: "Crafted Comfort",
    title: "Every Journey, Elevated",
    sub: "Full inspection reports & condition grading",
    fadeIn:  [0.78, 0.85],
    peak:    [0.85, 0.94],
    fadeOut: [0.94, 1.00],
  },
];

function sceneOpacity(scene: Scene, p: number): number {
  const [fi0, fi1] = scene.fadeIn;
  const [fo0, fo1] = scene.fadeOut;
  if (p < fi0 || p > fo1) return 0;
  if (p < fi1) return (p - fi0) / (fi1 - fi0);
  if (p < fo0) return 1;
  return Math.max(0, 1 - (p - fo0) / Math.max(fo1 - fo0, 0.001));
}

export default function CarReveal() {
  // ── Fixed: single `<` instead of `<<` on all refs ──
  const sectionRef        = useRef<HTMLElement>(null);
  const stickyRef         = useRef<HTMLDivElement>(null);
  const progressRef       = useRef<number>(0);
  const textRefs          = useRef<(HTMLDivElement | null)[]>([]);
  const hudRef            = useRef<HTMLDivElement>(null);
  const counterRefs       = useRef<(HTMLDivElement | null)[]>([]);
  const scrollHintRef     = useRef<HTMLDivElement>(null);
  const letterboxTopRef   = useRef<HTMLDivElement>(null);
  const letterboxBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky  = stickyRef.current;
    if (!section || !sticky) return;

    // ── Master GSAP timeline with ScrollTrigger (pin + scrub) ──
    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=400%",
        pin: sticky,
        scrub: 1.2,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
        onLeaveBack: () => {
          textRefs.current.forEach((el) => {
            if (el) gsap.set(el, { opacity: 0, y: 40 });
          });
        },
      },
    });

    // Animate letterbox bars in
    masterTl.fromTo(
      [letterboxTopRef.current, letterboxBottomRef.current],
      { scaleY: 0 },
      { scaleY: 1, duration: 0.08, ease: "power2.out" },
      0
    );

    // Animate HUD in
    masterTl.fromTo(
      hudRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.06, ease: "power2.out" },
      0.02
    );

    // Scene text animations driven by progress
    const sceneTriggers: ScrollTrigger[] = [];
    SCENES.forEach((scene, i) => {
      const el = textRefs.current[i];
      if (!el) return;

      // Split text into spans for character stagger
      const label = el.querySelector(".cr-label") as HTMLElement;
      const title = el.querySelector(".cr-title") as HTMLElement;
      const sub   = el.querySelector(".cr-sub")   as HTMLElement;
      const line  = el.querySelector(".cr-line")  as HTMLElement;

      if (label) {
        label.innerHTML = label.textContent!
          .split("")
          .map((ch) => `<span class="cr-char">${ch === " " ? "&nbsp;" : ch}</span>`)
          .join("");
      }
      if (title) {
        title.innerHTML = title.textContent!
          .split("")
          .map((ch) => `<span class="cr-char">${ch === " " ? "&nbsp;" : ch}</span>`)
          .join("");
      }
      if (sub) {
        sub.innerHTML = sub.textContent!
          .split("")
          .map((ch) => `<span class="cr-char">${ch === " " ? "&nbsp;" : ch}</span>`)
          .join("");
      }

      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=400%",
        scrub: 1,
        onUpdate: (self) => {
          const p  = self.progress;
          const op = sceneOpacity(scene, p);
          gsap.set(el, {
            opacity: op,
            y: (1 - op) * 30,
            pointerEvents: op > 0.05 ? "auto" : "none",
          });

          // Character stagger animation when entering peak
          if (p >= scene.fadeIn[0] && p <= scene.fadeIn[1]) {
            const localProg = (p - scene.fadeIn[0]) / (scene.fadeIn[1] - scene.fadeIn[0]);
            const chars = el.querySelectorAll(".cr-char");
            gsap.set(chars, { opacity: localProg, y: (1 - localProg) * 15 });
          }

          // Animate divider line width
          if (line) {
            gsap.set(line, { scaleX: op, opacity: op * 0.6 });
          }

          // Update counter active state
          const counter = counterRefs.current[i];
          if (counter) {
            const isActive = p >= scene.fadeIn[0] && p <= scene.fadeOut[1];
            gsap.to(counter, {
              opacity: isActive ? 1 : 0.25,
              x: isActive ? 0 : -4,
              duration: 0.3,
            });
            const bar = counter.querySelector(".cr-counter-bar") as HTMLElement;
            if (bar) {
              gsap.to(bar, {
                width: isActive ? 20 : 8,
                backgroundColor: isActive ? "var(--amber)" : "rgba(212,168,83,0.3)",
                duration: 0.3,
              });
            }
          }
        },
      });
      sceneTriggers.push(st);
    });

    // Scroll hint fade out
    const hintSt = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=10%",
      scrub: true,
      onUpdate: (self) => {
        if (scrollHintRef.current) {
          gsap.set(scrollHintRef.current, { opacity: 1 - self.progress });
        }
      },
    });

    // Mouse parallax for sticky container
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(sticky, {
        rotateY:  x * 1.5,
        rotateX: -y * 1.5,
        duration: 1,
        ease: "power2.out",
      });
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      masterTl.kill();
      sceneTriggers.forEach((st) => st.kill());
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
        style={{ perspective: "1200px" }}
      >
        {/* Three.js Canvas */}
        <CarRevealScene progressRef={progressRef} />

        {/* ── Cinematic Overlays ── */}
        {/* Letterbox bars */}
        <div
          ref={letterboxTopRef}
          className="absolute top-0 left-0 right-0 h-[6vh] bg-black z-20 pointer-events-none origin-top"
        />
        <div
          ref={letterboxBottomRef}
          className="absolute bottom-0 left-0 right-0 h-[6vh] bg-black z-20 pointer-events-none origin-bottom"
        />

        {/* Vignette + grain */}
        <div
          className="absolute inset-0 pointer-events-none z-[5]"
          style={{
            background:
              "radial-gradient(ellipse 75% 65% at 50% 50%, transparent 35%, rgba(0,0,0,0.65) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none z-[6] opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px 180px",
          }}
        />

        {/* CRT scanlines */}
        <div
          className="absolute inset-0 pointer-events-none z-[7] opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 4px)",
          }}
        />

        {/* Corner brackets */}
        <div className="absolute inset-0 z-[8] pointer-events-none">
          <CornerBracket top left />
          <CornerBracket top right />
          <CornerBracket bottom left />
          <CornerBracket bottom right />
        </div>

        {/* ── Top HUD ── */}
        <div
          ref={hudRef}
          className="absolute top-8 left-0 right-0 flex justify-center items-center gap-6 z-[9] pointer-events-none opacity-0"
        >
          <span className="font-sans text-[0.65rem] tracking-[0.25em] uppercase text-[rgba(212,168,83,0.7)]">
            JDM Export
          </span>
          <div className="w-10 h-px bg-[rgba(212,168,83,0.25)]" />
          <span className="font-sans text-[0.65rem] tracking-[0.18em] uppercase text-[rgba(245,240,235,0.35)]">
            Vehicle Showcase
          </span>
          <div className="w-10 h-px bg-[rgba(212,168,83,0.25)]" />
          <span className="font-mono text-[0.65rem] tracking-[0.15em] text-[rgba(212,168,83,0.7)] tabular-nums">
            {String(Math.round(progressRef.current * 100)).padStart(3, "0")}%
          </span>
        </div>

        {/* ── Scene Text Overlays ── */}
        <div className="absolute inset-0 z-[9] pointer-events-none flex items-end justify-center pb-[14vh]">
          {SCENES.map((_scene, idx) => (
            <div
              key={idx}
              ref={(el) => { textRefs.current[idx] = el; }}
              className="absolute text-center px-8 opacity-0"
            >
              <span className="cr-label block font-sans font-medium text-[0.65rem] tracking-[0.28em] uppercase text-[var(--amber)] mb-3">
                {SCENES[idx].label}
              </span>
              <h2 className="cr-title font-sans font-bold text-[clamp(1.8rem,4.5vw,3.2rem)] leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)] drop-shadow-[0_4px_40px_rgba(0,0,0,0.9)] m-0">
                {SCENES[idx].title}
              </h2>
              <div className="cr-line w-9 h-px bg-[var(--amber)] opacity-50 mx-auto my-3 origin-center" />
              <span className="cr-sub block font-sans font-normal text-[0.8rem] tracking-[0.06em] text-[rgba(245,240,235,0.55)]">
                {SCENES[idx].sub}
              </span>
            </div>
          ))}
        </div>

        {/* ── Bottom Left Scene Counter ── */}
        <div className="absolute bottom-10 left-9 z-[8] pointer-events-none">
          {SCENES.map((_scene, i) => (
            <div
              key={i}
              ref={(el) => { counterRefs.current[i] = el; }}
              className="flex items-center gap-2 mb-1.5 opacity-25"
            >
              <div className="cr-counter-bar h-px w-2 bg-[rgba(212,168,83,0.3)] transition-all" />
              <span className="font-sans text-[0.55rem] tracking-[0.2em] uppercase text-[var(--amber)]">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>

        {/* ── Scroll Hint ── */}
        <div
          ref={scrollHintRef}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[9] flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="font-sans font-medium text-[0.55rem] tracking-[0.28em] uppercase text-[rgba(245,240,235,0.4)]">
            Scroll to Explore
          </span>
          <div className="w-px h-9 relative overflow-hidden bg-[rgba(212,168,83,0.2)]">
            <div className="absolute top-0 left-0 w-full h-2.5 bg-[var(--amber)] rounded-sm animate-scrollDrop" />
          </div>
        </div>

        {/* ── Side Progress Rail ── */}
        <div className="absolute right-6 top-1/4 h-1/2 w-px bg-[rgba(212,168,83,0.12)] z-[8] pointer-events-none">
          <div
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-[rgba(212,168,83,0.8)] to-[rgba(212,168,83,0.3)] transition-all duration-75"
            style={{ height: `${Math.min(progressRef.current * 100, 100)}%` }}
          />
          {SCENES.map((scene, i) => {
            const dotPos = (i / (SCENES.length - 1)) * 100;
            const active =
              progressRef.current >= scene.fadeIn[0] &&
              progressRef.current <= scene.fadeOut[1];
            return (
              <div
                key={i}
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
                style={{
                  top: `${dotPos}%`,
                  width:  active ? 6 : 3,
                  height: active ? 6 : 3,
                  backgroundColor: active ? "var(--amber)" : "rgba(212,168,83,0.35)",
                  boxShadow: active ? "0 0 8px rgba(212,168,83,0.6)" : "none",
                }}
              />
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes scrollDrop {
          0%   { transform: translateY(-10px); opacity: 0; }
          35%  { opacity: 1; }
          100% { transform: translateY(36px);  opacity: 0; }
        }
        .animate-scrollDrop {
          animation: scrollDrop 1.9s ease-in-out infinite;
        }
        .cr-char {
          display: inline-block;
          will-change: opacity, transform;
        }
      `}</style>
    </section>
  );
}

function CornerBracket({
  top,
  right,
  bottom,
  left,
}: {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top:    top    !== undefined ? (top    ? 28 : undefined) : undefined,
        bottom: bottom !== undefined ? (bottom ? 28 : undefined) : undefined,
        left:   left   !== undefined ? (left   ? 28 : undefined) : undefined,
        right:  right  !== undefined ? (right  ? 28 : undefined) : undefined,
        width:  28,
        height: 28,
        borderTop:    top    ? "1.5px solid rgba(212,168,83,0.55)" : undefined,
        borderBottom: bottom ? "1.5px solid rgba(212,168,83,0.55)" : undefined,
        borderLeft:   left   ? "1.5px solid rgba(212,168,83,0.55)" : undefined,
        borderRight:  right  ? "1.5px solid rgba(212,168,83,0.55)" : undefined,
      }}
    />
  );
}