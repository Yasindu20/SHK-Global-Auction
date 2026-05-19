import { useParams, Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Heart, Share2, ArrowLeft, FileText, MessageCircle } from 'lucide-react';
import gsap from 'gsap';
import { IListing as Vehicle } from '../../backend/src/models/Listing';
import Footer from '../sections/Footer';

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/listings/${id}`);
        const data = await response.json();
        setVehicle(data);
      } catch (error) {
        console.error("Failed to fetch vehicle details:", error);
      }
    };
    fetchVehicle();
  }, [id]);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    const sections = left.querySelectorAll('.detail-section');
    const ctx = gsap.context(() => {
      sections.forEach((section, i) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            delay: i * 0.12,
          }
        );
      });

      gsap.fromTo(
        right,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out', delay: 0.3 }
      );
    });

    return () => ctx.revert();
  }, []);

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>Vehicle not found</h2>
          <Link to="/inventory" className="mt-4 inline-block" style={{ color: 'var(--amber)' }}>
            ← Back to Inventory
          </Link>
        </div>
      </div>
    );
  }

  const shippingCost = Math.round(vehicle.price * 0.07);
  const insurance = Math.round(vehicle.price * 0.01);
  const inspection = 280;
  const total = vehicle.price + shippingCost + insurance + inspection;

  return (
    <div style={{ backgroundColor: 'var(--bg)' }}>
      {/* Hero image */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 60%)' }}
        />
        <div className="absolute top-4 left-4 z-10">
          <Link
            to="/inventory"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.6)',
              color: 'var(--text-primary)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <ArrowLeft size={14} /> Back to Inventory
          </Link>
        </div>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            className="p-2 rounded-md transition-colors"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.6)',
              color: 'var(--text-primary)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Heart size={18} />
          </button>
          <button
            className="p-2 rounded-md transition-colors"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.6)',
              color: 'var(--text-primary)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Share2 size={18} />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="container-main">
            <h1 className="text-display" style={{ color: 'var(--text-primary)', fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: 'var(--amber-dim)', color: 'var(--amber)' }}
              >
                {vehicle.auctionHouse}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                {vehicle.auctionDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-main py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column */}
          <div ref={leftRef} className="lg:w-[60%]">
            {/* Key specs grid */}
            <div className="detail-section grid grid-cols-2 md:grid-cols-3 gap-3 opacity-0">
              {[
                { label: 'Year', value: vehicle.year.toString() },
                { label: 'Mileage', value: `${vehicle.mileage.toLocaleString()} km` },
                { label: 'Engine', value: vehicle.engine },
                { label: 'Transmission', value: vehicle.transmission },
                { label: 'Grade', value: vehicle.grade },
                { label: 'Fuel', value: vehicle.fuel },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    className="block text-label"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {spec.label}
                  </span>
                  <span
                    className="block mt-1 font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="detail-section mt-8 opacity-0">
              <h3 className="text-h4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                Description
              </h3>
              <p className="mt-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {vehicle.description}
              </p>
            </div>

            {/* Auction sheet */}
            <div className="detail-section mt-8 opacity-0">
              <h3 className="text-h4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                Auction Sheet
              </h3>
              <div
                className="mt-3 relative rounded-lg overflow-hidden cursor-pointer group"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                <img
                  src="/images/auction-sheet.jpg"
                  alt="Auction sheet"
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: '300px', objectFit: 'cover' }}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ backgroundColor: 'rgba(10, 10, 10, 0.7)' }}
                >
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    View Full Report
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <span className="text-label" style={{ color: 'var(--text-secondary)' }}>Exterior</span>
                  <span className="block mt-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vehicle.exteriorGrade}
                  </span>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <span className="text-label" style={{ color: 'var(--text-secondary)' }}>Interior</span>
                  <span className="block mt-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vehicle.interiorGrade}
                  </span>
                </div>
                <div
                  className="p-3 rounded-lg text-center"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <span className="text-label" style={{ color: 'var(--text-secondary)' }}>Damage</span>
                  <span className="block mt-1 font-semibold" style={{ color: vehicle.damageCodes.length ? 'var(--alert)' : 'var(--success)' }}>
                    {vehicle.damageCodes.length ? vehicle.damageCodes.join(', ') : 'None'}
                  </span>
                </div>
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
                className="inline-flex items-center gap-1 mt-2 font-medium transition-all duration-200 group"
                style={{ color: 'var(--amber)', fontSize: '0.875rem' }}
              >
                Get exact quote →
              </a>
            </div>
          </div>

          {/* Right column - sticky price card */}
          <div className="lg:w-[40%]">
            <div
              ref={rightRef}
              className="lg:sticky lg:top-20 rounded-xl p-6 opacity-0"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
                  Starting Bid
                </span>
              </div>
              <span className="block mt-1 text-price" style={{ color: 'var(--amber)' }}>
                ${vehicle.price.toLocaleString()}
              </span>

              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
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
                    <div key={item.label} className="flex justify-between" style={{ fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ color: 'var(--text-primary)' }}>+ ${item.value.toLocaleString()}</span>
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

              <button
                className="w-full mt-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
                style={{
                  backgroundColor: 'var(--amber)',
                  color: 'var(--bg)',
                }}
              >
                Request Quote
              </button>
              <button
                className="w-full mt-3 py-3 rounded-lg font-semibold text-sm transition-all duration-200"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--amber)',
                  border: '1px solid var(--amber)',
                }}
              >
                Reserve with Deposit ($2,000)
              </button>

              <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
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
                className="flex items-center justify-center gap-2 mt-4 py-3 rounded-lg text-sm font-medium transition-colors"
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
