import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  Share2,
  ArrowLeft,
  FileText,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import gsap from 'gsap';
import { type Vehicle } from '../data/vehicles';
import Footer from '../sections/Footer';

const API = 'http://localhost:5000';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1280&h=800&q=80&auto=format&fit=crop';

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`${API}/api/listings/${id}`);
        const data = await res.json();
        setVehicle(data);
      } catch (e) {
        console.error('Failed to fetch vehicle details:', e);
      }
    };
    fetchVehicle();
  }, [id]);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right || !vehicle) return;

    const sections = left.querySelectorAll('.detail-section');
    const ctx = gsap.context(() => {
      sections.forEach((section, i) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: i * 0.12 }
        );
      });
      gsap.fromTo(right, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out', delay: 0.3 });
    });

    return () => ctx.revert();
  }, [vehicle]);

  if (!vehicle) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--amber)', borderTopColor: 'transparent' }}
          />
          <Link to="/inventory" className="mt-4 inline-block" style={{ color: 'var(--amber)' }}>
            ← Back to Inventory
          </Link>
        </div>
      </div>
    );
  }

  const images =
    vehicle.images && vehicle.images.length > 0 ? vehicle.images : [FALLBACK_IMG];

  const shippingCost = Math.round((vehicle.price || 0) * 0.07) || 2800;
  const insurance = Math.round((vehicle.price || 0) * 0.01) || 400;
  const inspection = 280;
  const total = (vehicle.price || 0) + shippingCost + insurance + inspection;

  return (
    <div style={{ backgroundColor: 'var(--bg)' }}>
      {/* ── Hero image + gallery ─────────────────────────────────────────────── */}
      <div className="relative" style={{ height: '55vh', minHeight: 320 }}>
        {/* Main image */}
        <div className="w-full h-full overflow-hidden">
          <img
            src={images[activeImg] || FALLBACK_IMG}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMG;
            }}
          />
        </div>

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 55%)',
          }}
        />

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActiveImg((p) => (p - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition-all"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setActiveImg((p) => (p + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition-all"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div
            className="absolute top-4 right-16 z-10 px-2 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
          >
            {activeImg + 1} / {images.length}
          </div>
        )}

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Link
            to="/inventory"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
            style={{
              backgroundColor: 'rgba(10,10,10,0.6)',
              color: 'var(--text-primary)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <ArrowLeft size={14} /> Back to Inventory
          </Link>
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            className="p-2 rounded-md"
            style={{ backgroundColor: 'rgba(10,10,10,0.6)', color: 'var(--text-primary)', backdropFilter: 'blur(8px)' }}
          >
            <Heart size={18} />
          </button>
          <button
            className="p-2 rounded-md"
            style={{ backgroundColor: 'rgba(10,10,10,0.6)', color: 'var(--text-primary)', backdropFilter: 'blur(8px)' }}
            onClick={() => navigator.share?.({ title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, url: window.location.href })}
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="container-main">
            <h1
              className="text-display"
              style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              }}
            >
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                {vehicle.supplierName}
              </span>
              {vehicle.stockId && (
                <>
                  <span style={{ color: 'var(--text-secondary)' }}>·</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Stock #{vehicle.stockId}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Thumbnail strip ──────────────────────────────────────────────────── */}
      {images.length > 1 && (
        <div
          className="overflow-x-auto scrollbar-hide"
          style={{ backgroundColor: '#0A0A0A', borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex gap-2 p-3 container-main">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className="shrink-0 rounded-md overflow-hidden transition-all"
                style={{
                  width: 80,
                  height: 52,
                  border: `2px solid ${i === activeImg ? 'var(--amber)' : 'transparent'}`,
                  opacity: i === activeImg ? 1 : 0.55,
                }}
              >
                <img
                  src={src}
                  alt={`view ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMG;
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="container-main py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div ref={leftRef} className="lg:w-[60%]">
            {/* Key specs */}
            <div className="detail-section grid grid-cols-2 md:grid-cols-3 gap-3 opacity-0">
              {[
                { label: 'Year', value: vehicle.year?.toString() || 'N/A' },
                { label: 'Mileage', value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A' },
                { label: 'Transmission', value: vehicle.transmission || 'N/A' },
                { label: 'Grade', value: vehicle.grade || 'N/A' },
                { label: 'Fuel', value: vehicle.fuel || 'N/A' },
                { label: 'Color', value: vehicle.color || 'N/A' },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span className="block text-label" style={{ color: 'var(--text-secondary)' }}>
                    {spec.label}
                  </span>
                  <span className="block mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Vehicle details */}
            <div className="detail-section mt-8 opacity-0">
              <h3 className="text-h4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                Vehicle Details
              </h3>
              <div className="mt-3 space-y-0">
                {[
                  vehicle.chassisNumber && { label: 'Chassis Number', value: vehicle.chassisNumber, mono: true },
                  { label: 'Stock ID', value: vehicle.stockId },
                  { label: 'Location', value: vehicle.location || 'Japan' },
                  { label: 'Supplier', value: vehicle.supplierName },
                  vehicle.sourceUrl && { label: 'Source', value: vehicle.sourceUrl, link: true },
                ]
                  .filter(Boolean)
                  .map((row: any, i) => (
                    <div
                      key={i}
                      className="flex justify-between py-2.5"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {row.label}
                      </span>
                      {row.link ? (
                        <a
                          href={row.value}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate max-w-[60%] text-right"
                          style={{ color: 'var(--amber)', fontSize: '0.875rem' }}
                        >
                          View Source ↗
                        </a>
                      ) : (
                        <span
                          style={{
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            fontFamily: row.mono ? 'monospace' : undefined,
                          }}
                        >
                          {row.value}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Shipping estimate */}
            <div className="detail-section mt-8 opacity-0">
              <h3 className="text-h4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                Shipping Estimate
              </h3>
              <p className="mt-3" style={{ color: 'var(--amber)' }}>
                Estimated to Mombasa: ${shippingCost.toLocaleString()}–${(shippingCost + 600).toLocaleString()} (21–28 days)
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-1 mt-2 font-medium"
                style={{ color: 'var(--amber)', fontSize: '0.875rem' }}
              >
                Get exact quote →
              </a>
            </div>
          </div>

          {/* ── Right column — price card ───────────────────────────────────── */}
          <div className="lg:w-[40%]">
            <div
              ref={rightRef}
              className="lg:sticky lg:top-20 rounded-xl p-6 opacity-0"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
                Starting Bid
              </span>
              <span className="block mt-1 text-price" style={{ color: 'var(--amber)' }}>
                {vehicle.price > 0 ? `$${vehicle.price.toLocaleString()}` : 'Price on Request'}
              </span>

              {vehicle.price > 0 && (
                <div
                  className="mt-4 pt-4"
                  style={{ borderTop: '1px solid var(--border-subtle)' }}
                >
                  <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
                    Estimated CIF Mombasa
                  </span>
                  <div className="mt-3 space-y-2">
                    {[
                      { label: 'Vehicle', value: vehicle.price },
                      { label: 'Shipping', value: shippingCost },
                      { label: 'Insurance', value: insurance },
                      { label: 'Inspection', value: inspection },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between"
                        style={{ fontSize: '0.875rem' }}
                      >
                        <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          + ${item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="flex justify-between mt-4 pt-4"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Total
                    </span>
                    <span className="text-h2" style={{ color: 'var(--amber)', fontSize: '1.5rem' }}>
                      ${total.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <button
                className="w-full mt-6 py-3 rounded-lg font-semibold text-sm transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--amber)', color: 'var(--bg)' }}
              >
                Request Quote
              </button>
              <button
                className="w-full mt-3 py-3 rounded-lg font-semibold text-sm"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--amber)',
                  border: '1px solid var(--amber)',
                }}
              >
                Reserve with Deposit ($2,000)
              </button>

              <div
                className="mt-6 pt-4"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--surface-light)' }}
                  >
                    <FileText size={18} style={{ color: 'var(--amber)' }} />
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      JDM Export Co. Ltd.
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      15 years · 4,200+ sales
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="#"
                className="flex items-center justify-center gap-2 mt-4 py-3 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(74, 222, 128, 0.1)',
                  color: 'var(--success)',
                }}
              >
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}