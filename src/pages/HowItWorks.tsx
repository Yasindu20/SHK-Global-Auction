import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
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
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

// ─── Ambient Three.js Background ───
function AmbientNetwork() {
  const mountRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 30;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    
    // Create ambient particle network
    const particleCount = 80;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.01
      ));
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xd4a853,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    
    // Connection lines
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xd4a853, 
      transparent: true, 
      opacity: 0.08 
    });
    
    const animate = () => {
      requestAnimationFrame(animate);
      const posArray = particles.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3] += velocities[i].x;
        posArray[i * 3 + 1] += velocities[i].y;
        posArray[i * 3 + 2] += velocities[i].z;
        
        // Boundary check
        if (Math.abs(posArray[i * 3]) > 30) velocities[i].x *= -1;
        if (Math.abs(posArray[i * 3 + 1]) > 20) velocities[i].y *= -1;
        if (Math.abs(posArray[i * 3 + 2]) > 10) velocities[i].z *= -1;
      }
      
      particles.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    
    animate();
    
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      particles.dispose();
      particleMaterial.dispose();
      lineMaterial.dispose();
    };
  }, []);
  
  return (
    <div 
      ref={mountRef} 
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  );
}

// ─── Step Data ───
const steps = [
  {
    id: '01',
    title: 'Browse & Select',
    description: 'Explore our curated inventory of verified vehicles from Japan, UAE, USA, and Europe. Filter by make, model, year, price, and destination port.',
    icon: Search,
    details: ['50,000+ verified listings', 'Real-time availability', 'HD photos & condition reports', 'VIN history included']
  },
  {
    id: '02',
    title: 'Place Your Bid or Buy',
    description: 'Participate in live auctions with transparent bidding or purchase instantly at fixed prices. No hidden fees, no surprises.',
    icon: DollarSign,
    details: ['Live auction tracking', 'Proxy bidding available', 'Instant Buy Now options', 'Secure escrow payments']
  },
  {
    id: '03',
    title: 'Documentation & Compliance',
    description: 'Our team handles all export paperwork, customs documentation, and compliance checks for your destination country.',
    icon: FileCheck,
    details: ['Export certificates', 'Customs clearance', 'Duties & taxes guidance', 'Legal compliance verified']
  },
  {
    id: '04',
    title: 'Global Shipping',
    description: 'Choose from container, RORO, or air freight. Track your vehicle in real-time from port to port with full insurance coverage.',
    icon: Ship,
    details: ['Real-time GPS tracking', 'Full marine insurance', 'Container/RORO/Air options', '120+ destination ports']
  },
  {
    id: '05',
    title: 'Delivery & Support',
    description: 'Receive your vehicle at the destination port with full inspection support. Our team remains available for after-sales assistance.',
    icon: Globe,
    details: ['Port pickup coordination', 'Local compliance check', 'After-sales support', 'Warranty options available']
  }
];

const trustIndicators = [
  { icon: ShieldCheck, value: '100%', label: 'Secure Transactions', desc: 'Escrow-protected payments' },
  { icon: Clock, value: '48h', label: 'Average Processing', desc: 'From bid to shipping docs' },
  { icon: MapPin, value: '120+', label: 'Global Ports', desc: 'Shipping destinations worldwide' },
  { icon: Users, value: '15K+', label: 'Happy Clients', desc: 'Across 85 countries' },
  { icon: Award, value: 'A+', label: 'BBB Rating', desc: 'Trusted since 2015' },
  { icon: BarChart3, value: '$2B+', label: 'Volume Traded', desc: 'In vehicle transactions' }
];

const expectations = [
  {
    title: 'Transparent Pricing',
    description: 'Every cost is itemized upfront. No hidden auction fees, no surprise shipping charges. You see exactly what you pay before you commit.',
    icon: DollarSign
  },
  {
    title: 'Vehicle Verification',
    description: 'Each listing includes a comprehensive condition report, auction sheet translation, and verified odometer reading by independent inspectors.',
    icon: CheckCircle2
  },
  {
    title: 'Dedicated Agent',
    description: 'From your first inquiry to final delivery, a dedicated export specialist manages your case with direct communication in your timezone.',
    icon: Headphones
  },
  {
    title: 'Regulatory Guidance',
    description: 'We navigate import regulations, emission standards, and homologation requirements so your vehicle clears customs without delays.',
    icon: FileCheck
  }
];

const faqs = [
  {
    question: 'How long does shipping take?',
    answer: 'Shipping times vary by destination and method. RORO to East Africa typically takes 21-28 days, container shipping to Europe 14-21 days, and air freight 3-5 days. You receive a precise timeline before confirming your shipment.'
  },
  {
    question: 'Can I inspect the vehicle before buying?',
    answer: 'Absolutely. We provide detailed condition reports, auction sheets (translated), and high-resolution photos. For premium purchases, we can arrange third-party physical inspections at the source location.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept wire transfers, secure escrow services, and major credit cards for deposits. Full payment is typically required within 48 hours of winning a bid, with escrow protection until delivery confirmation.'
  },
  {
    question: 'Do you handle import duties and taxes?',
    answer: 'We provide accurate duty and tax estimates for your destination country before purchase. While you are responsible for paying these upon arrival, we handle all documentation to ensure smooth customs clearance.'
  },
  {
    question: 'What if the vehicle arrives damaged?',
    answer: 'All shipments include comprehensive marine insurance. In the rare event of transit damage, our claims team handles the entire process. We also offer pre-shipment video documentation for additional peace of mind.'
  },
  {
    question: 'Can you source specific vehicles not in inventory?',
    answer: 'Yes. Our procurement team can source specific makes, models, or specifications through our network of partner auctions and dealerships in Japan, UAE, USA, and Europe. Contact us with your requirements.'
  }
];

// ─── Components ───

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = step.icon;
  
  useGSAP(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 60, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        delay: index * 0.1
      }
    );
  }, { scope: cardRef });
  
  return (
    <div ref={cardRef} className="relative group">
      {/* Connector line for desktop */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-12 left-full w-full h-[2px] z-0">
          <div className="h-full bg-gradient-to-r from-[var(--amber)]/30 to-transparent w-full" />
        </div>
      )}
      
      <div className="relative z-10 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 md:p-8 hover:border-[var(--amber)]/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,168,83,0.08)]">
        <div className="flex items-start gap-4 md:gap-6">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-[var(--amber)]/10 border border-[var(--amber)]/20 flex items-center justify-center group-hover:bg-[var(--amber)]/20 transition-colors duration-500">
              <Icon className="w-6 h-6 md:w-7 md:h-7 text-[var(--amber)]" strokeWidth={1.5} />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-label text-[var(--amber)]/60">{step.id}</span>
              <h3 className="text-h3 text-[var(--text-primary)]">{step.title}</h3>
            </div>
            <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed mb-4">
              {step.description}
            </p>
            
            <ul className="space-y-2">
              {step.details.map((detail, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle2 className="w-4 h-4 text-[var(--amber)]/70 flex-shrink-0" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustCard({ indicator, index }: { indicator: typeof trustIndicators[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = indicator.icon;
  
  useGSAP(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 90%',
          toggleActions: 'play none none none'
        },
        delay: index * 0.08
      }
    );
  }, { scope: cardRef });
  
  return (
    <div ref={cardRef} className="text-center p-6 md:p-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--amber)]/10 mb-4">
        <Icon className="w-5 h-5 text-[var(--amber)]" strokeWidth={1.5} />
      </div>
      <div className="text-display text-[var(--amber)] mb-1" style={{ fontSize: '2.5rem' }}>
        {indicator.value}
      </div>
      <div className="text-h4 text-[var(--text-primary)] mb-1">{indicator.label}</div>
      <div className="text-sm text-[var(--text-secondary)]">{indicator.desc}</div>
    </div>
  );
}

function ExpectationCard({ item, index }: { item: typeof expectations[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = item.icon;
  
  useGSAP(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0, x: index % 2 === 0 ? -40 : 40 },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  }, { scope: cardRef });
  
  return (
    <div ref={cardRef} className="flex gap-5 md:gap-6 p-6 md:p-8 rounded-2xl bg-[var(--surface)]/50 border border-[var(--border-subtle)] hover:bg-[var(--surface)] transition-all duration-500">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-lg bg-[var(--amber)]/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[var(--amber)]" strokeWidth={1.5} />
        </div>
      </div>
      <div>
        <h3 className="text-h4 text-[var(--text-primary)] mb-2">{item.title}</h3>
        <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
          {item.description}
        </p>
      </div>
    </div>
  );
}

function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    if (!itemRef.current) return;
    gsap.fromTo(itemRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: itemRef.current,
          start: 'top 90%',
          toggleActions: 'play none none none'
        },
        delay: index * 0.05
      }
    );
  }, { scope: itemRef });
  
  useEffect(() => {
    if (!contentRef.current) return;
    if (isOpen) {
      gsap.to(contentRef.current, {
        height: 'auto',
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out'
      });
    } else {
      gsap.to(contentRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in'
      });
    }
  }, [isOpen]);
  
  return (
    <div ref={itemRef} className="border-b border-[var(--border-subtle)] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between gap-4 text-left group"
      >
        <span className="text-base md:text-lg font-medium text-[var(--text-primary)] group-hover:text-[var(--amber)] transition-colors duration-300">
          {faq.question}
        </span>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full border border-[var(--border-subtle)] flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-[var(--amber)] border-[var(--amber)] rotate-180' : 'group-hover:border-[var(--amber)]/50'}`}>
          <ChevronDown className={`w-4 h-4 transition-colors duration-300 ${isOpen ? 'text-[var(--bg)]' : 'text-[var(--text-secondary)]'}`} />
        </div>
      </button>
      <div ref={contentRef} className="overflow-hidden h-0 opacity-0">
        <p className="pb-6 text-[var(--text-secondary)] leading-relaxed pr-12">
          {faq.answer}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function HowItWorks() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const expectRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    // Hero animations
    const tl = gsap.timeline();
    tl.fromTo(titleRef.current,
      { opacity: 0, y: 50, skewY: 2 },
      { opacity: 1, y: 0, skewY: 0, duration: 1, ease: 'power3.out' }
    )
    .fromTo(subtitleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.6'
    );
    
    // Parallax for sections
    gsap.utils.toArray<HTMLElement>('.parallax-section').forEach((section) => {
      gsap.fromTo(section,
        { y: 50 },
        {
          y: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
          }
        }
      );
    });
    
    // CTA reveal
    gsap.fromTo(ctaRef.current,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );
    
  }, { scope: heroRef });
  
  return (
    <div className="min-h-screen bg-[var(--bg)] relative overflow-hidden">
      <AmbientNetwork />
      
      {/* ─── Hero Section ─── */}
      <section ref={heroRef} className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--amber)]/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="container-main relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--amber)]/10 border border-[var(--amber)]/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--amber)] animate-pulse" />
            <span className="text-label text-[var(--amber)]">Global Vehicle Export Platform</span>
          </div>
          
          <h1 ref={titleRef} className="text-display text-[var(--text-primary)] max-w-4xl mx-auto mb-6">
            How SHK Global Auction <span className="text-[var(--amber)]">Works</span>
          </h1>
          
          <p ref={subtitleRef} className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed mb-10">
            From auction floor to your driveway. A transparent, five-step process trusted by buyers in 85 countries.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--amber)] text-[var(--bg)] font-semibold rounded-lg hover:bg-[var(--amber)]/90 transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,168,83,0.3)]"
            >
              Browse Inventory
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#process"
              className="inline-flex items-center gap-2 px-8 py-4 border border-[var(--border-strong)] text-[var(--text-primary)] font-medium rounded-lg hover:border-[var(--amber)]/50 hover:text-[var(--amber)] transition-all duration-300"
            >
              See the Process
            </a>
          </div>
        </div>
      </section>
      
      {/* ─── Trust Indicators ─── */}
      <section ref={trustRef} className="section-padding border-y border-[var(--border-subtle)] relative z-10 bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="container-main">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {trustIndicators.map((indicator, index) => (
              <TrustCard key={indicator.label} indicator={indicator} index={index} />
            ))}
          </div>
        </div>
      </section>
      
      {/* ─── Process Steps ─── */}
      <section id="process" ref={stepsRef} className="section-padding relative z-10">
        <div className="container-main">
          <div className="text-center mb-16 md:mb-20">
            <span className="text-label text-[var(--amber)] mb-4 block">The Process</span>
            <h2 className="text-h2 text-[var(--text-primary)] mb-4">Five Steps to Your Vehicle</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              We've refined our process over a decade to eliminate friction and uncertainty from international vehicle purchasing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 relative">
            {steps.map((step, index) => (
              <StepCard key={step.id} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>
      
      {/* ─── What You Can Expect ─── */}
      <section ref={expectRef} className="section-padding relative z-10 bg-[var(--surface)]/30">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div className="lg:sticky lg:top-32">
              <span className="text-label text-[var(--amber)] mb-4 block">Our Promise</span>
              <h2 className="text-h2 text-[var(--text-primary)] mb-6">What You Can Expect</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-8">
                We believe buying a vehicle internationally should feel as confident as buying locally. That's why we've built a platform that prioritizes transparency, verification, and human support at every stage.
              </p>
              
              <div className="hidden lg:block">
                <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageCircle className="w-5 h-5 text-[var(--amber)]" />
                    <span className="text-h4 text-[var(--text-primary)]">Need clarification?</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Our export specialists are available across timezones to walk you through any step of the process.
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--amber)] hover:gap-3 transition-all duration-300"
                  >
                    Speak with an agent
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {expectations.map((item, index) => (
                <ExpectationCard key={item.title} item={item} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* ─── FAQ Section ─── */}
      <section ref={faqRef} className="section-padding relative z-10">
        <div className="container-main max-w-3xl">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-label text-[var(--amber)] mb-4 block">Support</span>
            <h2 className="text-h2 text-[var(--text-primary)] mb-4">Frequently Asked Questions</h2>
            <p className="text-[var(--text-secondary)]">
              Everything you need to know about buying and exporting vehicles with SHK Global Auction.
            </p>
          </div>
          
          <div className="bg-[var(--surface)]/50 rounded-2xl border border-[var(--border-subtle)] px-6 md:px-8">
            {faqs.map((faq, index) => (
              <FAQItem key={index} faq={faq} index={index} />
            ))}
          </div>
        </div>
      </section>
      
      {/* ─── Final CTA ─── */}
      <section ref={ctaRef} className="section-padding relative z-10">
        <div className="container-main">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-light)] border border-[var(--border-subtle)] p-8 md:p-16 lg:p-20 text-center">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--amber)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--amber)]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-h2 md:text-display text-[var(--text-primary)] mb-6 max-w-3xl mx-auto" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
                Ready to Find Your Next Vehicle?
              </h2>
              <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-10">
                Join 15,000+ buyers across 85 countries who trust SHK Global Auction for transparent, secure international vehicle purchases.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/inventory"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--amber)] text-[var(--bg)] font-semibold rounded-lg hover:bg-[var(--amber)]/90 transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,168,83,0.3)] hover:-translate-y-0.5"
                >
                  Explore Inventory
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/destinations"
                  className="inline-flex items-center gap-2 px-8 py-4 border border-[var(--border-strong)] text-[var(--text-primary)] font-medium rounded-lg hover:border-[var(--amber)]/50 hover:text-[var(--amber)] transition-all duration-300"
                >
                  View Destinations
                </Link>
              </div>
              
              <div className="mt-10 pt-10 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--amber)]" />
                  Escrow Protected
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--amber)]" />
                  Verified Listings
                </span>
                <span className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[var(--amber)]" />
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