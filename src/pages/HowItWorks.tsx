import { useEffect, useRef, useState } from 'react';
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

      // Process step cards
      gsap.fromTo(
        '.step-card',
        { opacity: 0, y: 50, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: '.steps-section', start: 'top 82%', once: true },
        }
      );

      // Process connectors
      gsap.fromTo(
        '.step-connector',
        { opacity: 0, scaleX: 0 },
        {
          opacity: 1,
          scaleX: 1,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.12,
          delay: 0.4,
          scrollTrigger: { trigger: '.steps-section', start: 'top 82%', once: true },
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

      {/* ─── Process Steps ────────────────────────────────────────────────────── */}
      <section
        id="process"
        className="steps-section relative z-10"
        style={{ padding: 'clamp(4rem,8vh,7rem) 0' }}
      >
        <div className="container-main">
          {/* Section header */}
          <div className="section-header text-center mb-14" style={{ opacity: 0 }}>
            <span className="text-label block mb-3" style={{ color: 'var(--amber)' }}>The Process</span>
            <h2 className="text-h2 mb-4" style={{ color: 'var(--text-primary)' }}>
              Five Steps to Your Vehicle
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
              We've refined our process over a decade to eliminate friction and uncertainty from international vehicle purchasing.
            </p>
          </div>

          {/* ── Desktop layout: flex row with explicit connectors ── */}
          <div className="hidden lg:flex items-stretch gap-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-stretch" style={{ flex: 1 }}>
                  {/* Step card */}
                  <div
                    className="step-card flex flex-col flex-1 rounded-2xl p-6 transition-all duration-500 group"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = 'rgba(212,168,83,0.3)';
                      el.style.boxShadow = '0 0 40px rgba(212,168,83,0.07)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = 'var(--border-subtle)';
                      el.style.boxShadow = 'none';
                    }}
                  >
                    {/* Step number */}
                    <div
                      className="font-bold leading-none mb-3 select-none"
                      style={{ fontSize: '3.5rem', color: 'rgba(212,168,83,0.1)', letterSpacing: '-0.04em' }}
                    >
                      {step.id}
                    </div>

                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-500"
                      style={{ backgroundColor: 'rgba(212,168,83,0.1)', border: '1px solid rgba(212,168,83,0.2)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: 'var(--amber)' }} strokeWidth={1.5} />
                    </div>

                    {/* Title + description */}
                    <h3 className="text-h4 font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: 'var(--text-secondary)' }}>
                      {step.description}
                    </p>

                    {/* Details list */}
                    <ul className="space-y-1.5">
                      {step.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'rgba(212,168,83,0.7)' }} />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Connector arrow between cards (not after last) */}
                  {index < steps.length - 1 && (
                    <div
                      className="step-connector flex-shrink-0 flex flex-col items-center justify-center"
                      style={{ width: '40px', transformOrigin: '0% 50%', opacity: 0 }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <div
                          style={{ width: '24px', height: '1px', backgroundColor: 'rgba(212,168,83,0.35)' }}
                        />
                        <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                          <path d="M1 1L7 6L1 11" stroke="rgba(212,168,83,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Mobile layout: vertical timeline ── */}
          <div className="lg:hidden relative">
            {/* Vertical timeline line */}
            <div
              className="absolute top-0 bottom-0"
              style={{ left: '23px', width: '1px', backgroundColor: 'var(--border-subtle)' }}
            />

            <div className="flex flex-col gap-6">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="step-card flex gap-4 relative" style={{ opacity: 0 }}>
                    {/* Circle badge */}
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10 text-xs font-bold"
                      style={{
                        backgroundColor: 'var(--surface-light)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--amber)',
                      }}
                    >
                      {index + 1}
                    </div>

                    {/* Card */}
                    <div
                      className="flex-1 rounded-xl p-5"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'rgba(212,168,83,0.12)' }}
                        >
                          <Icon className="w-4 h-4" style={{ color: 'var(--amber)' }} strokeWidth={1.5} />
                        </div>
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {step.description}
                      </p>
                      <ul className="space-y-1">
                        {step.details.map((d, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(212,168,83,0.65)' }} />
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
        </div>
      </section>

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