import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import {
  Search,
  FileCheck,
  Globe,
  Ship,
  ShieldCheck,
  Headphones,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  DollarSign,
  Award,
  Users,
  BarChart3,
  MessageCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

// ─── Ambient Three.js Background ───────────────────────────────────────────────
function AmbientNetwork() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mount.appendChild(renderer.domElement);

    // Particle positions & velocities
    const COUNT = 70;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const vels: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      vels.push({
        x: (Math.random() - 0.5) * 0.018,
        y: (Math.random() - 0.5) * 0.018,
        z: (Math.random() - 0.5) * 0.008,
      });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xd4a853,
      size: 0.13,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const arr = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < COUNT; i++) {
        arr[i * 3] += vels[i].x;
        arr[i * 3 + 1] += vels[i].y;
        arr[i * 3 + 2] += vels[i].z;
        if (Math.abs(arr[i * 3]) > 30) vels[i].x *= -1;
        if (Math.abs(arr[i * 3 + 1]) > 20) vels[i].y *= -1;
        if (Math.abs(arr[i * 3 + 2]) > 10) vels[i].z *= -1;
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.35, zIndex: 0 }}
    />
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────────
const steps = [
  {
    id: '01',
    title: 'Browse & Select',
    description:
      'Explore our curated inventory of verified vehicles from Japan, UAE, USA, and Europe. Filter by make, model, year, price, and destination port.',
    icon: Search,
    details: [
      '50,000+ verified listings',
      'Real-time availability',
      'HD photos & condition reports',
      'VIN history included',
    ],
  },
  {
    id: '02',
    title: 'Place Your Bid or Buy',
    description:
      'Participate in live auctions with transparent bidding or purchase instantly at fixed prices. No hidden fees, no surprises.',
    icon: DollarSign,
    details: [
      'Live auction tracking',
      'Proxy bidding available',
      'Instant Buy Now options',
      'Secure escrow payments',
    ],
  },
  {
    id: '03',
    title: 'Documentation & Compliance',
    description:
      'Our team handles all export paperwork, customs documentation, and compliance checks for your destination country.',
    icon: FileCheck,
    details: [
      'Export certificates',
      'Customs clearance',
      'Duties & taxes guidance',
      'Legal compliance verified',
    ],
  },
  {
    id: '04',
    title: 'Global Shipping',
    description:
      'Choose from container, RORO, or air freight. Track your vehicle in real-time from port to port with full insurance coverage.',
    icon: Ship,
    details: [
      'Real-time GPS tracking',
      'Full marine insurance',
      'Container/RORO/Air options',
      '120+ destination ports',
    ],
  },
  {
    id: '05',
    title: 'Delivery & Support',
    description:
      'Receive your vehicle at the destination port with full inspection support. Our team remains available for after-sales assistance.',
    icon: Globe,
    details: [
      'Port pickup coordination',
      'Local compliance check',
      'After-sales support',
      'Warranty options available',
    ],
  },
];

const trustIndicators = [
  { icon: ShieldCheck, value: '100%', label: 'Secure Transactions', desc: 'Escrow-protected payments' },
  { icon: Clock, value: '48h', label: 'Avg. Processing', desc: 'From bid to shipping docs' },
  { icon: MapPin, value: '120+', label: 'Global Ports', desc: 'Shipping destinations worldwide' },
  { icon: Users, value: '15K+', label: 'Happy Clients', desc: 'Across 85 countries' },
  { icon: Award, value: 'A+', label: 'BBB Rating', desc: 'Trusted since 2015' },
  { icon: BarChart3, value: '$2B+', label: 'Volume Traded', desc: 'In vehicle transactions' },
];

const expectations = [
  {
    title: 'Transparent Pricing',
    description:
      'Every cost is itemized upfront. No hidden auction fees, no surprise shipping charges. You see exactly what you pay before you commit.',
    icon: DollarSign,
  },
  {
    title: 'Vehicle Verification',
    description:
      'Each listing includes a comprehensive condition report, auction sheet translation, and verified odometer reading by independent inspectors.',
    icon: CheckCircle2,
  },
  {
    title: 'Dedicated Agent',
    description:
      'From your first inquiry to final delivery, a dedicated export specialist manages your case with direct communication in your timezone.',
    icon: Headphones,
  },
  {
    title: 'Regulatory Guidance',
    description:
      'We navigate import regulations, emission standards, and homologation requirements so your vehicle clears customs without delays.',
    icon: FileCheck,
  },
];

const faqs = [
  {
    question: 'How long does shipping take?',
    answer:
      'Shipping times vary by destination and method. RORO to East Africa typically takes 21–28 days, container shipping to Europe 14–21 days, and air freight 3–5 days. You receive a precise timeline before confirming your shipment.',
  },
  {
    question: 'Can I inspect the vehicle before buying?',
    answer:
      'Absolutely. We provide detailed condition reports, auction sheets (translated), and high-resolution photos. For premium purchases, we can arrange third-party physical inspections at the source location.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept wire transfers, secure escrow services, and major credit cards for deposits. Full payment is typically required within 48 hours of winning a bid, with escrow protection until delivery confirmation.',
  },
  {
    question: 'Do you handle import duties and taxes?',
    answer:
      'We provide accurate duty and tax estimates for your destination country before purchase. While you are responsible for paying these upon arrival, we handle all documentation to ensure smooth customs clearance.',
  },
  {
    question: 'What if the vehicle arrives damaged?',
    answer:
      'All shipments include comprehensive marine insurance. In the rare event of transit damage, our claims team handles the entire process. We also offer pre-shipment video documentation for additional peace of mind.',
  },
  {
    question: 'Can you source specific vehicles not in inventory?',
    answer:
      'Yes. Our procurement team can source specific makes, models, or specifications through our network of partner auctions and dealerships in Japan, UAE, USA, and Europe. Contact us with your requirements.',
  },
];

// ─── Awwwards-Quality Process Steps Section ───────────────────────────────────
// Features: horizontal scroll pin, 3D card perspective, giant bg typography,
// SVG path drawing, progress indicator, snap-to-section, cursor-reactive tilt

function ProcessStepsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const bgNumbersRef = useRef<(HTMLDivElement | null)[]>([]);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const stepDotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const counterCurrentRef = useRef<HTMLSpanElement>(null);
  const connectorPathsRef = useRef<(SVGPathElement | null)[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Check mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Desktop: Horizontal Scroll Pin with 3D Cards ────────────────────────────
  useEffect(() => {
    if (isMobile) return;
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    const bgNumbers = bgNumbersRef.current.filter(Boolean) as HTMLDivElement[];
    const dots = stepDotsRef.current.filter(Boolean) as HTMLDivElement[];
    const paths = connectorPathsRef.current.filter(Boolean) as SVGPathElement[];
    const progressFill = progressFillRef.current;
    const counterCurrent = counterCurrentRef.current;

    // Calculate total track width
    const getScrollAmount = () => {
      const trackWidth = track.scrollWidth;
      const viewportWidth = window.innerWidth;
      return -(trackWidth - viewportWidth);
    };

    // Main horizontal scroll timeline
    const scrollTl = gsap.timeline();
    scrollTl.to(track, {
      x: getScrollAmount,
      ease: 'none',
    });

    // Pin the section and scrub
    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${track.scrollWidth - window.innerWidth}`,
      pin: true,
      animation: scrollTl,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      snap: {
        snapTo: (progress) => {
          const stepSize = 1 / (steps.length - 1);
          const step = Math.round(progress / stepSize);
          return step * stepSize;
        },
        duration: { min: 0.4, max: 0.8 },
        ease: 'power2.inOut',
        delay: 0.1,
      },
      onUpdate: (self) => {
        const progress = self.progress;
        // Update progress bar
        if (progressFill) {
          progressFill.style.width = `${progress * 100}%`;
        }
        // Update active step
        const stepIndex = Math.min(
          Math.floor(progress * steps.length),
          steps.length - 1
        );
        setActiveStep(stepIndex);
        // Update counter
        if (counterCurrent) {
          counterCurrent.textContent = String(stepIndex + 1).padStart(2, '0');
        }
        // Update dots
        dots.forEach((dot, i) => {
          if (i <= stepIndex) {
            dot.style.backgroundColor = 'var(--amber)';
            dot.style.boxShadow = '0 0 12px rgba(212,168,83,0.5)';
          } else {
            dot.style.backgroundColor = 'rgba(212,168,83,0.2)';
            dot.style.boxShadow = 'none';
          }
        });
      },
    });

    // Per-card 3D entrance animations
    cards.forEach((card, i) => {
      const bgNum = bgNumbers[i];

      // Card entrance: 3D flip in from right
      gsap.fromTo(
        card,
        {
          rotateY: 25,
          rotateX: 5,
          z: -150,
          opacity: 0,
          x: 100,
        },
        {
          rotateY: 0,
          rotateX: 0,
          z: 0,
          opacity: 1,
          x: 0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            containerAnimation: scrollTl,
            start: 'left 90%',
            end: 'left 30%',
            scrub: 1,
          },
        }
      );

      // Background number parallax
      if (bgNum) {
        gsap.fromTo(
          bgNum,
          { scale: 0.6, opacity: 0 },
          {
            scale: 1,
            opacity: 0.04,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              containerAnimation: scrollTl,
              start: 'left 80%',
              end: 'left 40%',
              scrub: 1,
            },
          }
        );
      }

      // Details stagger
      const details = card.querySelectorAll('.step-detail-item');
      gsap.fromTo(
        details,
        { opacity: 0, x: 20 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            containerAnimation: scrollTl,
            start: 'left 60%',
            end: 'left 30%',
            scrub: 1,
          },
        }
      );
    });

    // Connector path draw animations
    paths.forEach((path, i) => {
      const length = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: cards[i],
          containerAnimation: scrollTl,
          start: 'left 70%',
          end: 'left 20%',
          scrub: 1,
        },
      });
    });

    // Resize handler
    const onResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);

    return () => {
      st.kill();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.vars.containerAnimation === scrollTl) t.kill();
      });
      scrollTl.kill();
      window.removeEventListener('resize', onResize);
    };
  }, [isMobile]);

  // ── Mobile: Vertical 3D Card Reveals ────────────────────────────────────────
  useEffect(() => {
    if (!isMobile) return;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];

    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 60, rotateX: 15, transformPerspective: 1000 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            once: true,
          },
          delay: i * 0.1,
        }
      );
    });
  }, [isMobile]);

  // ── Cursor-reactive 3D Tilt (Desktop only) ──────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (isMobile) return;
    const card = cardsRef.current[index];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    gsap.to(card, {
      rotateX,
      rotateY,
      scale: 1.02,
      duration: 0.4,
      ease: 'power2.out',
      transformPerspective: 1200,
    });
  }, [isMobile]);

  const handleMouseLeave = useCallback((index: number) => {
    if (isMobile) return;
    const card = cardsRef.current[index];
    if (!card) return;
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
    });
  }, [isMobile]);

  return (
    <section
      id="process"
      ref={sectionRef}
      className="process-section relative overflow-hidden"
      style={{
        backgroundColor: 'var(--bg)',
        height: isMobile ? 'auto' : '100vh',
      }}
    >
      {/* Section Header - Fixed during scroll on desktop */}
      <div
        className="process-header relative z-20"
        style={{
          padding: isMobile ? '4rem 0 2rem' : '3rem 0 1.5rem',
          textAlign: 'center',
        }}
      >
        <span
          className="text-label block mb-3"
          style={{ color: 'var(--amber)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}
        >
          The Process
        </span>
        <h2
          className="text-h2 mb-3"
          style={{
            color: 'var(--text-primary)',
            fontSize: isMobile ? 'clamp(1.5rem, 5vw, 2.5rem)' : 'clamp(2rem, 4vw, 3.5rem)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          Five Steps to Your Vehicle
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            maxWidth: '520px',
            margin: '0 auto',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}
        >
          We've refined our process over a decade to eliminate friction and uncertainty from international vehicle purchasing.
        </p>
      </div>

      {/* ── Desktop: Horizontal Scroll Track ────────────────────────────────── */}
      <div
        ref={trackRef}
        className="hidden lg:flex items-center"
        style={{
          gap: '3rem',
          padding: '0 10vw',
          height: 'calc(100vh - 220px)',
          willChange: 'transform',
          transformStyle: 'preserve-3d',
        }}
      >
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeStep === index;
          return (
            <div key={step.id} className="flex items-center" style={{ flexShrink: 0 }}>
              {/* Card Container with 3D perspective */}
              <div
                ref={(el) => { cardsRef.current[index] = el; }}
                className="relative"
                style={{
                  width: 'clamp(340px, 28vw, 420px)',
                  transformStyle: 'preserve-3d',
                  cursor: 'pointer',
                }}
                onMouseMove={(e) => handleMouseMove(e, index)}
                onMouseLeave={() => handleMouseLeave(index)}
              >
                {/* Giant Background Number */}
                <div
                  ref={(el) => { bgNumbersRef.current[index] = el; }}
                  className="absolute select-none pointer-events-none"
                  style={{
                    top: '-2rem',
                    right: '-1rem',
                    fontSize: '12rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    color: 'var(--amber)',
                    opacity: 0,
                    zIndex: 0,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  {step.id}
                </div>

                {/* Card */}
                <div
                  className="relative rounded-2xl p-7 transition-all duration-500"
                  style={{
                    backgroundColor: 'rgba(20,20,20,0.7)',
                    border: `1px solid ${isActive ? 'rgba(212,168,83,0.4)' : 'var(--border-subtle)'}`,
                    boxShadow: isActive
                      ? '0 0 60px rgba(212,168,83,0.1), 0 8px 32px rgba(0,0,0,0.4)'
                      : '0 8px 32px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 1,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Glow orb behind icon */}
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      top: '2rem',
                      left: '2rem',
                      width: '3rem',
                      height: '3rem',
                      background: 'radial-gradient(circle, rgba(212,168,83,0.15) 0%, transparent 70%)',
                      filter: 'blur(20px)',
                    }}
                  />

                  {/* Step badge */}
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                    style={{
                      backgroundColor: 'rgba(212,168,83,0.1)',
                      border: '1px solid rgba(212,168,83,0.2)',
                    }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{ color: 'var(--amber)', fontFamily: 'monospace' }}
                    >
                      STEP {step.id}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                    style={{
                      backgroundColor: 'rgba(212,168,83,0.08)',
                      border: '1px solid rgba(212,168,83,0.15)',
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: 'var(--amber)' }} strokeWidth={1.5} />
                  </div>

                  {/* Title */}
                  <h3
                    className="font-semibold mb-3"
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: '1.35rem',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-sm leading-relaxed mb-5"
                    style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
                  >
                    {step.description}
                  </p>

                  {/* Details */}
                  <ul className="space-y-2.5">
                    {step.details.map((d, i) => (
                      <li
                        key={i}
                        className="step-detail-item flex items-start gap-2.5 text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <CheckCircle2
                          className="w-4 h-4 mt-0.5 flex-shrink-0"
                          style={{ color: 'rgba(212,168,83,0.8)' }}
                        />
                        <span style={{ fontSize: '0.8rem' }}>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Connector Arrow (between cards) */}
              {index < steps.length - 1 && (
                <div className="flex-shrink-0" style={{ width: '80px', margin: '0 1.5rem' }}>
                  <svg
                    width="80"
                    height="24"
                    viewBox="0 0 80 24"
                    fill="none"
                    style={{ overflow: 'visible' }}
                  >
                    <defs>
                      <linearGradient id={`connGrad${index}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(212,168,83,0.1)" />
                        <stop offset="50%" stopColor="rgba(212,168,83,0.5)" />
                        <stop offset="100%" stopColor="rgba(212,168,83,0.1)" />
                      </linearGradient>
                      <filter id={`glow${index}`}>
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <path
                      ref={(el) => { connectorPathsRef.current[index] = el; }}
                      d="M0 12 L60 12 L55 6 M60 12 L55 18"
                      stroke={`url(#connGrad${index})`}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={`url(#glow${index})`}
                      fill="none"
                    />
                    {/* Animated particle on path */}
                    <circle r="3" fill="var(--amber)" filter={`url(#glow${index})`} opacity="0.8">
                      <animateMotion
                        dur="2s"
                        repeatCount="indefinite"
                        path="M0 12 L60 12"
                      />
                    </circle>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Mobile: Vertical Timeline ─────────────────────────────────────────── */}
      <div className="lg:hidden container-main" style={{ paddingBottom: '4rem' }}>
        <div className="flex flex-col gap-6 relative">
          {/* Vertical line */}
          <div
            className="absolute"
            style={{
              left: '27px',
              top: '0',
              bottom: '0',
              width: '2px',
              background: 'linear-gradient(to bottom, rgba(212,168,83,0.3), rgba(212,168,83,0.1), rgba(212,168,83,0.3))',
            }}
          />
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                ref={(el) => { cardsRef.current[index] = el; }}
                className="flex gap-5 relative"
              >
                {/* Timeline node */}
                <div className="flex-shrink-0 z-10">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: 'rgba(20,20,20,0.9)',
                      border: '2px solid rgba(212,168,83,0.3)',
                      boxShadow: '0 0 20px rgba(212,168,83,0.1)',
                    }}
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: 'var(--amber)', fontFamily: 'monospace' }}
                    >
                      {step.id}
                    </span>
                  </div>
                </div>

                {/* Card */}
                <div
                  className="flex-1 rounded-2xl p-5"
                  style={{
                    backgroundColor: 'rgba(20,20,20,0.6)',
                    border: '1px solid var(--border-subtle)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(212,168,83,0.1)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: 'var(--amber)' }} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {step.description}
                  </p>
                  <ul className="space-y-1.5">
                    {step.details.map((d, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(212,168,83,0.7)' }} />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ambient corner glows */}
      <div
        className="absolute pointer-events-none hidden lg:block"
        style={{
          top: '10%',
          left: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(212,168,83,0.04) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        className="absolute pointer-events-none hidden lg:block"
        style={{
          bottom: '15%',
          right: '-5%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(212,168,83,0.03) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
    </section>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function FAQItem({ faq, index }: { faq: (typeof faqs)[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  // Entrance animation
  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power2.out',
          delay: index * 0.05,
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            once: true,
          },
        }
      );
    });
    return () => ctx.revert();
  }, [index]);

  // Open/close animation
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (isOpen) {
      el.style.display = 'block';
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.35, ease: 'power2.out' });
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.28,
        ease: 'power2.in',
        onComplete: () => { el.style.display = 'none'; },
      });
    }
  }, [isOpen]);

  return (
    <div ref={itemRef} className="border-b last:border-0" style={{ borderColor: 'var(--border-subtle)', opacity: 0 }}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full py-5 flex items-center justify-between gap-4 text-left group focus:outline-none"
        aria-expanded={isOpen}
      >
        <span
          className="text-base font-medium transition-colors duration-300"
          style={{ color: isOpen ? 'var(--amber)' : 'var(--text-primary)' }}
        >
          {faq.question}
        </span>
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: isOpen ? 'var(--amber)' : 'transparent',
            border: `1px solid ${isOpen ? 'var(--amber)' : 'var(--border-strong)'}`,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronDown
            className="w-4 h-4"
            style={{ color: isOpen ? 'var(--bg)' : 'var(--text-secondary)' }}
          />
        </span>
      </button>
      <div ref={bodyRef} style={{ overflow: 'hidden', display: 'none' }}>
        <p className="pb-5 pr-12 leading-relaxed text-sm" style={{ color: 'var(--text-secondary)' }}>
          {faq.answer}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  // ── Page-level entrance (hero text, trust bar, steps, etc.) ──────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero badge + title + subtitle + buttons
      gsap.fromTo(
        '.hiw-badge',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.1 }
      );
      gsap.fromTo(
        '.hiw-title',
        { opacity: 0, y: 48, skewY: 1.5 },
        { opacity: 1, y: 0, skewY: 0, duration: 0.95, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo(
        '.hiw-subtitle',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.4 }
      );
      gsap.fromTo(
        '.hiw-hero-btns',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.55 }
      );

      // Trust bar stats
      gsap.fromTo(
        '.trust-card',
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: { trigger: '.trust-section', start: 'top 88%', once: true },
        }
      );

      // Expectation cards
      gsap.fromTo(
        '.expect-card',
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: { trigger: '.expect-section', start: 'top 85%', once: true },
        }
      );

      // Section headers
      gsap.utils.toArray<HTMLElement>('.section-header').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          }
        );
      });

      // CTA section
      gsap.fromTo(
        '.cta-block',
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.cta-block', start: 'top 84%', once: true },
        }
      );
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <AmbientNetwork />

      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center text-center pt-24 pb-20"
        style={{ minHeight: '78vh' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,168,83,0.07) 0%, transparent 70%)' }}
        />

        <div className="container-main relative z-10">
          <div
            className="hiw-badge inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              backgroundColor: 'rgba(212,168,83,0.1)',
              border: '1px solid rgba(212,168,83,0.25)',
              opacity: 0,
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ backgroundColor: 'var(--amber)' }} />
            <span className="text-label" style={{ color: 'var(--amber)' }}>
              Global Vehicle Export Platform
            </span>
          </div>

          <h1
            className="hiw-title text-display mx-auto mb-6"
            style={{ maxWidth: '820px', color: 'var(--text-primary)', opacity: 0 }}
          >
            How SHK Global Auction{' '}
            <span style={{ color: 'var(--amber)' }}>Works</span>
          </h1>

          <p
            className="hiw-subtitle mx-auto leading-relaxed mb-10"
            style={{ maxWidth: '540px', color: 'var(--text-secondary)', fontSize: '1.1rem', opacity: 0 }}
          >
            From auction floor to your driveway — a transparent, five-step process trusted by buyers in 85 countries.
          </p>

          <div className="hiw-hero-btns flex flex-col sm:flex-row items-center justify-center gap-4" style={{ opacity: 0 }}>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-lg transition-all duration-300 hover:-translate-y-0.5"
              style={{
                backgroundColor: 'var(--amber)',
                color: 'var(--bg)',
                boxShadow: '0 0 0 rgba(212,168,83,0)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(212,168,83,0.32)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 rgba(212,168,83,0)'; }}
            >
              Browse Inventory <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#process"
              className="inline-flex items-center gap-2 px-8 py-4 font-medium rounded-lg transition-all duration-300"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,168,83,0.5)';
                (e.currentTarget as HTMLElement).style.color = 'var(--amber)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
              }}
            >
              See the Process
            </a>
          </div>
        </div>
      </section>

      {/* ─── Trust Indicators ─────────────────────────────────────────────────── */}
      <section
        className="trust-section relative z-10"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(10,10,10,0.7)',
          backdropFilter: 'blur(12px)',
          padding: 'clamp(2.5rem,5vh,4rem) 0',
        }}
      >
        <div className="container-main">
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}
          >
            {trustIndicators.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="trust-card text-center px-4 py-6" style={{ opacity: 0 }}>
                  <div
                    className="inline-flex items-center justify-center w-11 h-11 rounded-full mb-3"
                    style={{ backgroundColor: 'rgba(212,168,83,0.12)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: 'var(--amber)' }} strokeWidth={1.5} />
                  </div>
                  <div
                    className="font-bold mb-1"
                    style={{ fontSize: '2rem', lineHeight: 1, color: 'var(--amber)', letterSpacing: '-0.02em' }}
                  >
                    {item.value}
                  </div>
                  <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {item.label}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {item.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── AWWWARDS-QUALITY PROCESS STEPS SECTION ─────────────────────────────── */}
      <ProcessStepsSection />

      {/* ─── What You Can Expect ──────────────────────────────────────────────── */}
      <section
        className="expect-section relative z-10"
        style={{
          padding: 'clamp(4rem,8vh,7rem) 0',
          backgroundColor: 'rgba(20,20,20,0.5)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="container-main">
          <div
            className="grid items-start gap-12"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
          >
            {/* Left sticky column */}
            <div className="lg:sticky lg:top-28 section-header" style={{ opacity: 0 }}>
              <span className="text-label block mb-4" style={{ color: 'var(--amber)' }}>Our Promise</span>
              <h2 className="text-h2 mb-5" style={{ color: 'var(--text-primary)' }}>
                What You Can Expect
              </h2>
              <p className="leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
                We believe buying a vehicle internationally should feel as confident as buying locally. That's why we've
                built a platform that prioritizes transparency, verification, and human support at every stage.
              </p>

              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <MessageCircle className="w-5 h-5" style={{ color: 'var(--amber)' }} />
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    Need clarification?
                  </span>
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Our export specialists are available across timezones to walk you through any step of the process.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:gap-3"
                  style={{ color: 'var(--amber)' }}
                >
                  Speak with an agent <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: expectation cards */}
            <div className="flex flex-col gap-4">
              {expectations.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="expect-card flex gap-5 p-6 rounded-2xl transition-all duration-400"
                    style={{
                      backgroundColor: 'rgba(20,20,20,0.6)',
                      border: '1px solid var(--border-subtle)',
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--surface)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(20,20,20,0.6)';
                    }}
                  >
                    <div
                      className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(212,168,83,0.1)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: 'var(--amber)' }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────────── */}
      <section
        className="relative z-10"
        style={{ padding: 'clamp(4rem,8vh,7rem) 0' }}
      >
        <div className="container-main" style={{ maxWidth: '760px' }}>
          <div className="section-header text-center mb-12" style={{ opacity: 0 }}>
            <span className="text-label block mb-3" style={{ color: 'var(--amber)' }}>Support</span>
            <h2 className="text-h2 mb-4" style={{ color: 'var(--text-primary)' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Everything you need to know about buying and exporting vehicles with SHK Global Auction.
            </p>
          </div>

          <div
            className="rounded-2xl px-6 md:px-8"
            style={{ backgroundColor: 'rgba(20,20,20,0.5)', border: '1px solid var(--border-subtle)' }}
          >
            {faqs.map((faq, i) => (
              <FAQItem key={i} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────────── */}
      <section
        className="relative z-10"
        style={{ padding: 'clamp(2rem,4vh,3rem) 0 clamp(4rem,8vh,7rem)' }}
      >
        <div className="container-main">
          <div
            className="cta-block relative overflow-hidden rounded-3xl text-center p-8 md:p-16"
            style={{
              background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-light) 100%)',
              border: '1px solid var(--border-subtle)',
              opacity: 0,
            }}
          >
            {/* Decorative glows */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '-80px', right: '-80px', width: '320px', height: '320px',
                background: 'radial-gradient(circle, rgba(212,168,83,0.07) 0%, transparent 70%)',
                borderRadius: '50%',
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '-80px', left: '-80px', width: '320px', height: '320px',
                background: 'radial-gradient(circle, rgba(212,168,83,0.07) 0%, transparent 70%)',
                borderRadius: '50%',
              }}
            />

            <div className="relative z-10">
              <h2
                className="text-h2 mx-auto mb-5"
                style={{ color: 'var(--text-primary)', maxWidth: '640px', fontSize: 'clamp(1.75rem,4vw,3rem)' }}
              >
                Ready to Find Your Next Vehicle?
              </h2>
              <p
                className="mx-auto mb-10"
                style={{ maxWidth: '480px', color: 'var(--text-secondary)', fontSize: '1.05rem' }}
              >
                Join 15,000+ buyers across 85 countries who trust SHK Global Auction for transparent, secure
                international vehicle purchases.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/inventory"
                  className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-lg transition-all duration-300 hover:-translate-y-0.5"
                  style={{ backgroundColor: 'var(--amber)', color: 'var(--bg)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(212,168,83,0.32)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  Explore Inventory <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/destinations"
                  className="inline-flex items-center gap-2 px-8 py-4 font-medium rounded-lg transition-all duration-300"
                  style={{ border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,168,83,0.5)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--amber)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  }}
                >
                  View Destinations
                </Link>
              </div>

              <div
                className="mt-10 pt-8 flex flex-wrap items-center justify-center gap-6 text-sm"
                style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" style={{ color: 'var(--amber)' }} />
                  Escrow Protected
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--amber)' }} />
                  Verified Listings
                </span>
                <span className="flex items-center gap-2">
                  <Headphones className="w-4 h-4" style={{ color: 'var(--amber)' }} />
                  24/7 Support
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}