import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Filter, ChevronDown, Search } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { vehicles, type Vehicle } from '../data/vehicles';

gsap.registerPlugin(ScrollTrigger);

export default function VehicleGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    make: '',
    year: '',
    grade: '',
    fuel: '',
  });

  const filteredVehicles = vehicles.filter((v: Vehicle) => {
    if (filters.make && v.make !== filters.make) return false;
    if (filters.year && v.year !== parseInt(filters.year)) return false;
    if (filters.grade && !v.grade?.startsWith(filters.grade)) return false;
    if (filters.fuel && v.fuel !== filters.fuel) return false;
    return true;
  });

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    if (cards.length === 0) return;

    const ctx = gsap.context(() => {
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: 'power2.out',
            delay: (index % 3) * 0.08,
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, gridRef);

    return () => ctx.revert();
  }, [filteredVehicles]);

  return (
    <section className="section-padding" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="container-main">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
              Available Inventory
            </h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Direct from auction. Inspected, graded, ready to ship.
            </p>
          </div>
          <Link
            to="/inventory"
            className="hidden md:inline-flex items-center gap-1 font-medium transition-all duration-200 group"
            style={{ color: 'var(--amber)', fontSize: '1rem' }}
          >
            View All
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Filter bar */}
        <div
          className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg sticky top-16 z-30"
          style={{
            backgroundColor: 'rgba(10, 10, 10, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="relative flex-grow max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              placeholder="Search by make, model, or chassis code..."
              className="w-full pl-9 pr-4 py-2 rounded-md text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {(['make', 'year', 'grade', 'fuel'] as const).map((key) => (
            <FilterDropdown
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              value={filters[key]}
              options={getFilterOptions(key)}
              onChange={(val) => setFilters((prev) => ({ ...prev, [key]: val }))}
            />
          ))}

          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm md:hidden"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <Filter size={14} /> Filters
          </button>
        </div>

        {/* Active filters */}
        {Object.values(filters).some(Boolean) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(filters)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium cursor-pointer"
                  style={{
                    backgroundColor: 'var(--amber-dim)',
                    color: 'var(--amber)',
                  }}
                  onClick={() => setFilters((prev) => ({ ...prev, [k]: '' }))}
                >
                  {k}: {v} ×
                </span>
              ))}
            <button
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setFilters({ make: '', year: '', grade: '', fuel: '' })}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Sort + count */}
        <div className="flex items-center justify-between mb-6">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {filteredVehicles.length} vehicles found
          </span>
          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sort: Latest <ChevronDown size={14} />
          </div>
        </div>

        {/* Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{ gap: '1.5rem' }}
        >
          {filteredVehicles.map((vehicle, index) => (
            <div
              key={vehicle._id}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="group rounded-xl overflow-hidden transition-all duration-200"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--border-strong)';
                el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                const img = el.querySelector('.card-image') as HTMLElement;
                if (img) img.style.transform = 'scale(1.04)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--border-subtle)';
                el.style.boxShadow = 'none';
                const img = el.querySelector('.card-image') as HTMLElement;
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              {/* Image area */}
              <div className="relative overflow-hidden" style={{ aspectRatio: '16/10', backgroundColor: '#0F0F0F' }}>
                <img
                  src={vehicle.images[0]}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="card-image w-full h-full object-cover transition-transform duration-300"
                  loading="lazy"
                />
                <span
                  className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                  }}
                >
                  {vehicle.supplierName}
                </span>
              </div>

              {/* Card content */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <h3
                    className="font-semibold text-sm truncate pr-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <button
                    onClick={() => toggleSave(vehicle._id)}
                    className="shrink-0 transition-colors duration-150"
                    style={{ color: savedIds.has(vehicle._id) ? 'var(--amber)' : 'var(--text-secondary)' }}
                  >
                    <Heart size={18} fill={savedIds.has(vehicle._id) ? 'var(--amber)' : 'none'} />
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-2" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {vehicle.grade && <span>Grade {vehicle.grade}</span>}
                  {vehicle.grade && <span>·</span>}
                  <span>{vehicle.mileage.toLocaleString()} km</span>
                  <span>·</span>
                  <span>{vehicle.fuel}</span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-price" style={{ color: 'var(--amber)' }}>
                    From ${vehicle.price.toLocaleString()}
                  </span>
                  <span className="text-label" style={{ color: 'var(--text-secondary)' }}>
                    CIF Mombasa
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                    {vehicle.supplierName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--success)' }}
                    />
                    <span style={{ color: 'var(--success)', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                      Available
                    </span>
                  </div>
                </div>

                <Link
                  to={`/vehicle/${vehicle._id}`}
                  className="block mt-3 text-center py-2 rounded-md text-sm font-medium transition-all duration-150 hover:brightness-110"
                  style={{
                    backgroundColor: 'var(--amber-dim)',
                    color: 'var(--amber)',
                  }}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-2 rounded-md text-sm transition-colors"
        style={{
          backgroundColor: 'var(--surface)',
          border: `1px solid ${value ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
          color: value ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        {value || label} <ChevronDown size={12} />
      </button>
      {open && (
        <div
          className="absolute top-full mt-1 left-0 rounded-lg overflow-hidden z-40 min-w-[140px]"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="px-3 py-2 text-sm cursor-pointer transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => { onChange(''); setOpen(false); }}
          >
            All {label}s
          </div>
          {options.map((opt) => (
            <div
              key={opt}
              className="px-3 py-2 text-sm cursor-pointer transition-colors"
              style={{
                color: value === opt ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: value === opt ? 'var(--surface-light)' : 'transparent',
              }}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getFilterOptions(key: string): string[] {
  const map: Record<string, string[]> = {
    make: ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru'],
    year: ['2023', '2022', '2021', '2020', '2019'],
    grade: ['5', '4.5', '4', '3.5'],
    fuel: ['Petrol', 'Diesel', 'Hybrid'],
  };
  return map[key] || [];
}