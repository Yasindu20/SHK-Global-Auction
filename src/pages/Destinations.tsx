import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import anime from 'animejs';
import { 
  Globe, 
  MapPin, 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Clock, 
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Star,
  Building2,
  Car,
  Hammer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

// ─── REAL COUNTRY DATA ───
export interface CountryData {
  id: string;
  name: string;
  code: string;
  region: string;
  capital: string;
  currency: string;
  timezone: string;
  population: string;
  gdp: string;
  image: string;
  flag: string;
  description: string;
  highlights: string[];
  marketStats: {
    auctionsPerMonth: number;
    avgVehiclePrice: string;
    growthRate: string;
    activeBidders: number;
  };
  coordinates: { lat: number; lng: number };
  established: string;
  vehiclesAvailable: number;
}

const COUNTRIES: CountryData[] = [
  {
    id: 'uae',
    name: 'United Arab Emirates',
    code: 'AE',
    region: 'Middle East',
    capital: 'Abu Dhabi',
    currency: 'AED',
    timezone: 'GMT+4',
    population: '9.9M',
    gdp: '$507B',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80',
    flag: 'https://flagcdn.com/w640/ae.png',
    description: 'The UAE serves as our premium luxury vehicle auction hub, connecting high-net-worth collectors across the Gulf region. Our Dubai operations center handles exclusive supercar auctions, classic car collections, and bespoke automotive investments.',
    highlights: ['Luxury Supercar Auctions', 'Classic Car Collections', 'Off-Road Vehicle Specialists', 'Marine & Yacht Auctions'],
    marketStats: { auctionsPerMonth: 45, avgVehiclePrice: '$185,000', growthRate: '+28%', activeBidders: 3200 },
    coordinates: { lat: 23.4241, lng: 53.8478 },
    established: '2019',
    vehiclesAvailable: 1240
  },
  {
    id: 'usa',
    name: 'United States',
    code: 'US',
    region: 'North America',
    capital: 'Washington, D.C.',
    currency: 'USD',
    timezone: 'GMT-5 to GMT-8',
    population: '331M',
    gdp: '$25.5T',
    image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=1920&q=80',
    flag: 'https://flagcdn.com/w640/us.png',
    description: 'Our largest operational territory spans coast-to-coast with major auction centers in Los Angeles, Miami, Chicago, and New York. The US market drives our innovation in online bidding technology and nationwide logistics networks.',
    highlights: ['Nationwide Logistics Network', 'Muscle Car Specialists', 'Commercial Fleet Auctions', 'Electric Vehicle Pioneers'],
    marketStats: { auctionsPerMonth: 320, avgVehiclePrice: '$42,500', growthRate: '+15%', activeBidders: 18500 },
    coordinates: { lat: 37.0902, lng: -95.7129 },
    established: '2015',
    vehiclesAvailable: 8900
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    code: 'GB',
    region: 'Europe',
    capital: 'London',
    currency: 'GBP',
    timezone: 'GMT+0',
    population: '67M',
    gdp: '$3.1T',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80',
    flag: 'https://flagcdn.com/w640/gb.png',
    description: 'Operating from our London headquarters, the UK division specializes in heritage automobiles, right-hand drive exports, and European collector car auctions. We maintain strong partnerships with British marques and restoration houses.',
    highlights: ['Heritage Automobile Specialists', 'RHD Export Services', 'European Collector Network', 'Restoration Partnerships'],
    marketStats: { auctionsPerMonth: 85, avgVehiclePrice: '$67,000', growthRate: '+12%', activeBidders: 5600 },
    coordinates: { lat: 55.3781, lng: -3.4360 },
    established: '2016',
    vehiclesAvailable: 2100
  },
  {
    id: 'japan',
    name: 'Japan',
    code: 'JP',
    region: 'Asia Pacific',
    capital: 'Tokyo',
    currency: 'JPY',
    timezone: 'GMT+9',
    population: '125M',
    gdp: '$4.2T',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80',
    flag: 'https://flagcdn.com/w640/jp.png',
    description: 'Japan represents our gateway to the Asian market, focusing on JDM (Japanese Domestic Market) exports, kei car auctions, and hybrid technology vehicles. Our Tokyo facility handles precision-grade inspections and certification.',
    highlights: ['JDM Export Specialists', 'Kei Car Auctions', 'Hybrid Technology Hub', 'Precision Inspection Center'],
    marketStats: { auctionsPerMonth: 150, avgVehiclePrice: '$28,000', growthRate: '+22%', activeBidders: 7800 },
    coordinates: { lat: 36.2048, lng: 138.2529 },
    established: '2018',
    vehiclesAvailable: 4500
  },
  {
    id: 'germany',
    name: 'Germany',
    code: 'DE',
    region: 'Europe',
    capital: 'Berlin',
    currency: 'EUR',
    timezone: 'GMT+1',
    population: '83M',
    gdp: '$4.1T',
    image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1920&q=80',
    flag: 'https://flagcdn.com/w640/de.png',
    description: 'Germany anchors our European operations with specialized focus on premium German marques, industrial vehicle auctions, and engineering-grade commercial fleet sales. Stuttgart and Munich serve as our primary logistics nodes.',
    highlights: ['Premium German Marques', 'Industrial Vehicle Auctions', 'Engineering-Grade Fleet Sales', 'Autobahn-Tested Certification'],
    marketStats: { auctionsPerMonth: 110, avgVehiclePrice: '$58,000', growthRate: '+18%', activeBidders: 6200 },
    coordinates: { lat: 51.1657, lng: 10.4515 },
    established: '2017',
    vehiclesAvailable: 3100
  },
  {
    id: 'australia',
    name: 'Australia',
    code: 'AU',
    region: 'Oceania',
    capital: 'Canberra',
    currency: 'AUD',
    timezone: 'GMT+10',
    population: '26M',
    gdp: '$1.7T',
    image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1920&q=80',
    flag: 'https://flagcdn.com/w640/au.png',
    description: 'Our Australian division caters to the rugged demands of the Outback and coastal markets, offering specialized 4x4, caravan, and marine auctions. We operate the largest vehicle auction network across the Pacific region.',
    highlights: ['4x4 & Off-Road Specialists', 'Caravan & RV Auctions', 'Marine Vessel Sales', 'Pacific Network Hub'],
    marketStats: { auctionsPerMonth: 65, avgVehiclePrice: '$38,000', growthRate: '+14%', activeBidders: 4100 },
    coordinates: { lat: -25.2744, lng: 133.7751 },
    established: '2020',
    vehiclesAvailable: 1800
  },
  {
    id: 'saudi-arabia',
    name: 'Saudi Arabia',
    code: 'SA',
    region: 'Middle East',
    capital: 'Riyadh',
    currency: 'SAR',
    timezone: 'GMT+3',
    population: '35M',
    gdp: '$1.1T',
    image: 'https://images.unsplash.com/photo-1547234935-80c7142ee969?w=1920&q=80',
    flag: 'https://flagcdn.com/w640/sa.png',
    description: 'Saudi Arabia marks our fastest-growing market with Vision 2030 alignment, focusing on luxury imports, EV infrastructure auctions, and industrial equipment. Riyadh and Jeddah centers serve the Kingdom's transformative automotive sector.',
    highlights: ['Vision 2030 Aligned', 'Luxury Import Specialists', 'EV Infrastructure Auctions', 'Industrial Equipment Hub'],
    marketStats: { auctionsPerMonth: 38, avgVehiclePrice: '$95,000', growthRate: '+35%', activeBidders: 2800 },
    coordinates: { lat: 23.8859, lng: 45.0792 },
    established: '2021',
    vehiclesAvailable: 950
  },
  {
    id: 'singapore',
    name: 'Singapore',
    code: 'SG',
    region: 'Asia Pacific',
    capital: 'Singapore',
    currency: 'SGD',
    timezone: 'GMT+8',
    population: '5.9M',
    gdp: '$397B',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&q=80',
    flag: 'https://flagcdn.com/w640/sg.png',
    description: 'Singapore operates as our Southeast Asian financial and logistics command center, specializing in COE (Certificate of Entitlement) vehicle auctions, luxury imports, and regional cross-border trade facilitation.',
    highlights: ['COE Auction Specialists', 'Regional Trade Hub', 'Luxury Import Gateway', 'Financial Services Integration'],
    marketStats: { auctionsPerMonth: 25, avgVehiclePrice: '$125,000', growthRate: '+20%', activeBidders: 1900 },
    coordinates: { lat: 1.3521, lng: 103.8198 },
    established: '2020',
    vehiclesAvailable: 680
  }
];

// ─── THREE.JS GLOBE COMPONENT ───
function GlobeScene({ activeCountry, onCountryClick }: { 
  activeCountry: string | null; 
  onCountryClick: (id: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    globe: THREE.Group;
    markers: THREE.Mesh[];
    animationId: number;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
  } | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  const latLngToVector3 = useCallback((lat: number, lng: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 18;
    camera.position.y = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x6366f1, 3, 50);
    pointLight.position.set(0, 10, 10);
    scene.add(pointLight);

    const backLight = new THREE.PointLight(0xec4899, 2, 50);
    backLight.position.set(0, -10, -10);
    scene.add(backLight);

    // Globe Group
    const globe = new THREE.Group();
    scene.add(globe);

    // Main sphere (wireframe globe)
    const sphereGeometry = new THREE.IcosahedronGeometry(5, 4);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    globe.add(sphere);

    // Inner glow sphere
    const innerGeometry = new THREE.SphereGeometry(4.95, 64, 64);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.8,
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    globe.add(innerSphere);

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(5.3, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.4, 0.4, 0.9, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globe.add(atmosphere);

    // Particle stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const posArray = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Country markers
    const markers: THREE.Mesh[] = [];
    const markerGroup = new THREE.Group();
    globe.add(markerGroup);

    COUNTRIES.forEach((country) => {
      const position = latLngToVector3(country.coordinates.lat, country.coordinates.lng, 5.1);

      // Marker dot
      const dotGeometry = new THREE.SphereGeometry(0.12, 16, 16);
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: country.id === activeCountry ? 0x6366f1 : 0xec4899,
        transparent: true,
        opacity: 0.9,
      });
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.position.copy(position);
      dot.userData = { countryId: country.id, isMarker: true };
      markerGroup.add(dot);
      markers.push(dot);

      // Pulse ring
      const ringGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: country.id === activeCountry ? 0x6366f1 : 0xec4899,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(position);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      markerGroup.add(ring);

      // Animate ring
      gsap.to(ring.scale, {
        x: 3,
        y: 3,
        duration: 2,
        repeat: -1,
        ease: 'power1.out',
        opacity: 0,
      });
      gsap.to(ringMaterial, {
        opacity: 0,
        duration: 2,
        repeat: -1,
        ease: 'power1.out',
      });

      // Connection lines to center
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        position.clone().multiplyScalar(0.8),
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.1,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      markerGroup.add(line);
    });

    // Raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markers);

      if (intersects.length > 0) {
        const intersected = intersects[0].object as THREE.Mesh;
        const countryId = intersected.userData.countryId;
        setHoveredMarker(countryId);
        container.style.cursor = 'pointer';

        gsap.to(intersected.scale, {
          x: 1.5,
          y: 1.5,
          z: 1.5,
          duration: 0.3,
          ease: 'back.out(1.7)',
        });
      } else {
        setHoveredMarker(null);
        container.style.cursor = 'default';
        markers.forEach((marker) => {
          gsap.to(marker.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.3,
          });
        });
      }
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markers);
      if (intersects.length > 0) {
        const countryId = (intersects[0].object as THREE.Mesh).userData.countryId;
        onCountryClick(countryId);
      }
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      globe.rotation.y += 0.001;
      stars.rotation.y += 0.0002;
      stars.rotation.x += 0.0001;

      // Pulse active marker
      if (activeCountry) {
        const activeMarker = markers.find(m => m.userData.countryId === activeCountry);
        if (activeMarker) {
          const time = Date.now() * 0.003;
          activeMarker.position.y += Math.sin(time) * 0.002;
        }
      }

      renderer.render(scene, camera);
    };

    let animationId = requestAnimationFrame(animate);

    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      globe,
      markers,
      animationId,
      raycaster,
      mouse,
    };

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onClick);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeCountry, onCountryClick, latLngToVector3]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      {hoveredMarker && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-white/10 pointer-events-none">
          {COUNTRIES.find(c => c.id === hoveredMarker)?.name}
        </div>
      )}
    </div>
  );
}

// ─── HERO SECTION ───
function HeroSection({ onExplore }: { onExplore: () => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { y: 100, opacity: 0, rotateX: 45 },
        { 
          y: 0, 
          opacity: 1, 
          rotateX: 0,
          duration: 1.5, 
          ease: 'power4.out',
          delay: 0.3,
        }
      );

      // Subtitle animation
      gsap.fromTo(
        subtitleRef.current,
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 1.2, 
          ease: 'power3.out',
          delay: 0.8,
        }
      );

      // Stats counter animation
      const statElements = statsRef.current?.querySelectorAll('.stat-number');
      if (statElements) {
        gsap.fromTo(
          statElements,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power2.out',
            delay: 1.2,
          }
        );
      }

      // Background parallax
      gsap.to('.hero-bg-gradient', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505]"
    >
      {/* Animated background */}
      <div className="hero-bg-gradient absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span className="text-sm text-gray-300">Global Operations Network</span>
        </div>

        <h1 
          ref={titleRef}
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight perspective-1000"
          style={{ perspective: '1000px' }}
        >
          <span className="block">Our Global</span>
          <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Destinations
          </span>
        </h1>

        <p 
          ref={subtitleRef}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Operating across 8 strategic markets worldwide, SHK Global Auction connects 
          buyers and sellers through premium vehicle auction experiences in every major continent.
        </p>

        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 max-w-3xl mx-auto mb-12">
          {[
            { value: '8', label: 'Countries', suffix: '+' },
            { value: '50K', label: 'Annual Auctions', suffix: '+' },
            { value: '50K', label: 'Active Bidders', suffix: '+' },
            { value: '$2.5', label: 'GMV Processed', suffix: 'B' },
          ].map((stat, i) => (
            <div key={i} className="stat-number text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {stat.value}<span className="text-indigo-400">{stat.suffix}</span>
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <Button
          onClick={onExplore}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-6 text-lg rounded-full group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
        >
          Explore Destinations
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll</span>
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
        </div>
      </div>
    </section>
  );
}

// ─── COUNTRY CARD COMPONENT ───
function CountryCard({ 
  country, 
  index, 
  isActive, 
  onClick 
}: { 
  country: CountryData; 
  index: number; 
  isActive: boolean;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { 
          y: 80, 
          opacity: 0,
          scale: 0.95,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          delay: index * 0.1,
        }
      );
    }, cardRef);

    return () => ctx.revert();
  }, [index]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(imageRef.current, {
      rotateY: x * 10,
      rotateX: -y * 10,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    if (!imageRef.current) return;
    gsap.to(imageRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.5,
      ease: 'power2.out',
    });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative cursor-pointer rounded-2xl overflow-hidden bg-[#0a0a0f] border transition-all duration-500",
        isActive 
          ? "border-indigo-500/50 shadow-lg shadow-indigo-500/10 scale-[1.02]" 
          : "border-white/5 hover:border-white/20 hover:scale-[1.01]"
      )}
      style={{ perspective: '1000px' }}
    >
      {/* Image container with 3D tilt */}
      <div 
        ref={imageRef}
        className="relative h-64 overflow-hidden"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <img
          src={country.image}
          alt={country.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />

        {/* Flag overlay */}
        <div className="absolute top-4 right-4 w-12 h-8 rounded overflow-hidden shadow-lg border border-white/20">
          <img src={country.flag} alt={`${country.name} flag`} className="w-full h-full object-cover" />
        </div>

        {/* Region badge */}
        <Badge className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white border-white/10">
          {country.region}
        </Badge>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute inset-0 border-2 border-indigo-500 rounded-2xl pointer-events-none" />
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
            {country.name}
          </h3>
          <div className="flex items-center gap-1 text-emerald-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            {country.marketStats.growthRate}
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
          {country.description}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-white/5">
            <div className="text-lg font-bold text-white">{country.marketStats.auctionsPerMonth}</div>
            <div className="text-xs text-gray-500">Monthly</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <div className="text-lg font-bold text-white">{country.vehiclesAvailable}</div>
            <div className="text-xs text-gray-500">Vehicles</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <div className="text-lg font-bold text-white">{(country.marketStats.activeBidders / 1000).toFixed(1)}K</div>
            <div className="text-xs text-gray-500">Bidders</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            {country.capital}
          </div>
          <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 group/btn">
            View Details
            <ArrowRight className="ml-1 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── COUNTRY DETAIL MODAL ───
function CountryDetail({ country, onClose }: { country: CountryData; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modalRef.current || !contentRef.current) return;

    // Animate in
    gsap.fromTo(
      modalRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );

    gsap.fromTo(
      contentRef.current,
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', delay: 0.1 }
    );

    // Animate stats with anime.js
    anime({
      targets: '.stat-animate',
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(100, { start: 300 }),
      easing: 'easeOutExpo',
    });

    // Animate highlights
    anime({
      targets: '.highlight-item',
      translateX: [-20, 0],
      opacity: [0, 1],
      delay: anime.stagger(80, { start: 500 }),
      easing: 'easeOutQuad',
    });
  }, [country]);

  const handleClose = () => {
    if (!modalRef.current || !contentRef.current) return;

    gsap.to(contentRef.current, {
      y: 50,
      opacity: 0,
      scale: 0.95,
      duration: 0.3,
      ease: 'power3.in',
    });
    gsap.to(modalRef.current, {
      opacity: 0,
      duration: 0.3,
      delay: 0.1,
      onComplete: onClose,
    });
  };

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div 
        ref={contentRef}
        className="relative w-full max-w-4xl bg-[#0a0a0f] border border-white/10 rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero image */}
        <div className="relative h-72 md:h-96">
          <img
            src={country.image}
            alt={country.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />

          <div className="absolute bottom-6 left-6 md:left-10 flex items-end gap-4">
            <img 
              src={country.flag} 
              alt={`${country.name} flag`} 
              className="w-16 h-10 rounded-lg shadow-lg border border-white/20 object-cover"
            />
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">{country.name}</h2>
              <div className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {country.capital}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-500" />
                <span>{country.region}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Hammer, label: 'Monthly Auctions', value: country.marketStats.auctionsPerMonth.toString() },
              { icon: Car, label: 'Avg. Price', value: country.marketStats.avgVehiclePrice },
              { icon: Users, label: 'Active Bidders', value: country.marketStats.activeBidders.toLocaleString() },
              { icon: TrendingUp, label: 'Growth', value: country.marketStats.growthRate },
            ].map((stat, i) => (
              <div 
                key={i} 
                className="stat-animate p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <stat.icon className="w-5 h-5 text-indigo-400 mb-2" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">About This Market</h3>
            <p className="text-gray-400 leading-relaxed">{country.description}</p>
          </div>

          {/* Highlights */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">Key Highlights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {country.highlights.map((highlight, i) => (
                <div 
                  key={i} 
                  className="highlight-item flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Star className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-sm text-gray-300">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-white/5">
              <div className="text-xs text-gray-500 mb-1">Currency</div>
              <div className="text-white font-medium">{country.currency}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <div className="text-xs text-gray-500 mb-1">Timezone</div>
              <div className="text-white font-medium">{country.timezone}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <div className="text-xs text-gray-500 mb-1">Population</div>
              <div className="text-white font-medium">{country.population}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <div className="text-xs text-gray-500 mb-1">GDP</div>
              <div className="text-white font-medium">{country.gdp}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <div className="text-xs text-gray-500 mb-1">Established</div>
              <div className="text-white font-medium">{country.established}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <div className="text-xs text-gray-500 mb-1">Vehicles Available</div>
              <div className="text-white font-medium">{country.vehiclesAvailable.toLocaleString()}</div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
            >
              <ExternalLink className="mr-2 w-4 h-4" />
              View Live Auctions
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-white/10 text-white hover:bg-white/5"
            >
              <Building2 className="mr-2 w-4 h-4" />
              Contact Local Team
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INTERACTIVE MAP SECTION ───
function MapSection({ 
  activeCountry, 
  onCountrySelect 
}: { 
  activeCountry: string | null; 
  onCountrySelect: (id: string) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.map-title',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-20 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="map-title text-3xl md:text-5xl font-bold text-white mb-4">
            Interactive <span className="text-indigo-400">Global Network</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Click on any marker to explore our operations in that region. 
            Each node represents a fully operational auction center.
          </p>
        </div>

        <div className="relative h-[600px] md:h-[700px] rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0f]">
          <GlobeScene activeCountry={activeCountry} onCountryClick={onCountrySelect} />

          {/* Country list overlay */}
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-64 flex flex-wrap md:flex-col gap-2">
            {COUNTRIES.map((country) => (
              <button
                key={country.id}
                onClick={() => onCountrySelect(country.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-300 backdrop-blur-md",
                  activeCountry === country.id
                    ? "bg-indigo-500/30 text-white border border-indigo-500/50"
                    : "bg-black/50 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white"
                )}
              >
                <img src={country.flag} alt="" className="w-5 h-3 rounded object-cover" />
                <span className="truncate">{country.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── COUNTRIES GRID SECTION ───
function CountriesGrid({ 
  activeCountry, 
  onCountrySelect 
}: { 
  activeCountry: string | null; 
  onCountrySelect: (id: string) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.grid-title',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 70%',
          },
        }
      );
    }, gridRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={gridRef} className="relative py-20 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="grid-title text-3xl md:text-5xl font-bold text-white mb-4">
            Operational <span className="text-purple-400">Markets</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            From luxury supercars in Dubai to JDM classics in Tokyo, 
            each market is tailored to regional demands and specialties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {COUNTRIES.map((country, index) => (
            <CountryCard
              key={country.id}
              country={country}
              index={index}
              isActive={activeCountry === country.id}
              onClick={() => onCountrySelect(country.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES SECTION ───
function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.feature-card',
        { y: 60, opacity: 0, rotateY: -15 },
        {
          y: 0,
          opacity: 1,
          rotateY: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: Shield,
      title: 'Verified & Inspected',
      description: 'Every vehicle undergoes rigorous 200-point inspection by certified engineers before listing.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Clock,
      title: 'Real-Time Bidding',
      description: 'Our proprietary platform handles 50,000+ concurrent bids with sub-100ms latency globally.',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      icon: Globe,
      title: 'Global Logistics',
      description: 'End-to-end shipping, customs clearance, and delivery to any destination worldwide.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Users,
      title: 'Expert Support',
      description: 'Dedicated auction specialists available 24/7 across all time zones and languages.',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <section ref={sectionRef} className="relative py-20 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Why Choose <span className="text-pink-400">SHK Global</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Enterprise-grade infrastructure trusted by collectors, dealers, and fleet operators worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: '1000px' }}>
          {features.map((feature, i) => (
            <div
              key={i}
              className="feature-card group relative p-8 rounded-2xl bg-[#0a0a0f] border border-white/5 hover:border-white/20 transition-all duration-500 hover:scale-[1.02]"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-full h-full text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>

              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA SECTION ───
function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cta-content',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 bg-[#050505] overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="cta-content relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Ready to Go <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Global?</span>
        </h2>
        <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
          Join 50,000+ active bidders across 8 countries. Whether you're buying your first 
          import or expanding your collection, SHK Global Auction is your trusted partner.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate('/inventory')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-6 text-lg rounded-full group"
          >
            Browse Global Inventory
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/5 px-8 py-6 text-lg rounded-full"
          >
            Schedule Consultation
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── MAIN DESTINATIONS PAGE ───
export default function Destinations() {
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const navigate = useNavigate();

  const handleCountrySelect = useCallback((id: string) => {
    setActiveCountry(id);
    const country = COUNTRIES.find(c => c.id === id);
    if (country) {
      setSelectedCountry(country);
    }
  }, []);

  const scrollToMap = () => {
    const mapSection = document.getElementById('map-section');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <main>
        <HeroSection onExplore={scrollToMap} />

        <div id="map-section">
          <MapSection 
            activeCountry={activeCountry} 
            onCountrySelect={handleCountrySelect} 
          />
        </div>

        <CountriesGrid 
          activeCountry={activeCountry} 
          onCountrySelect={handleCountrySelect} 
        />

        <FeaturesSection />

        <CTASection />
      </main>

      <Footer />

      {/* Country Detail Modal */}
      {selectedCountry && (
        <CountryDetail 
          country={selectedCountry} 
          onClose={() => {
            setSelectedCountry(null);
            setActiveCountry(null);
          }} 
        />
      )}
    </div>
  );
}