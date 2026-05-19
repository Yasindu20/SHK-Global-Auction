import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type Vehicle } from '../data/vehicles';
import Footer from '../sections/Footer';

gsap.registerPlugin(ScrollTrigger);

export default function Inventory() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    yearMin: '',
    yearMax: '',
    priceMin: '',
    priceMax: '',
    mileageMax: '',
    grade: '',
    transmission: '',
    fuel: '',
    auctionHouse: '',
  });
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const filteredVehicles = allVehicles.filter((v: Vehicle) => {
    const q = search.toLowerCase();
    if (search && !`${v.make} ${v.model} ${v.chassisNumber}`.toLowerCase().includes(q)) return false;
    if (filters.make && v.make !== filters.make) return false;
    if (filters.grade && !v.grade.startsWith(filters.grade)) return false;
    if (filters.transmission && v.transmission !== filters.transmission) return false;
    if (filters.fuel && v.fuel !== filters.fuel) return false;
    if (filters.auctionHouse && v.auctionHouse !== filters.auctionHouse) return false;
    if (filters.yearMin && v.year < parseInt(filters.yearMin)) return false;
    if (filters.yearMax && v.year > parseInt(filters.yearMax)) return false;
    if (filters.priceMin && v.price < parseInt(filters.priceMin)) return false;
    if (filters.priceMax && v.price > parseInt(filters.priceMax)) return false;
    if (filters.mileageMax && v.mileage > parseInt(filters.mileageMax)) return false;
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

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/listings');
        const data = await response.json();
        setAllVehicles(data.filter((v: Vehicle) => v.status === 'approved'));
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <div className="pt-24 pb-6">
        <div className="container-main">
          <h1 className="text-h2" style={{ color: 'var(--text-primary)' }}>
            Vehicle Inventory
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Browse {allVehicles.length}+ vehicles available from Japanese auctions.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-30" style={{ backgroundColor: 'rgba(10, 10, 10, 0.92)', backdropFilter: 'blur(12px)' }}>
        <div className="container-main py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-grow max-w-lg">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by make, model, or chassis code..."
                className="w-full pl-9 pr-4 py-2.5 rounded-md text-sm outline-none"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm transition-colors"
              style={{
                backgroundColor: activeFilterCount > 0 ? 'var(--amber-dim)' : 'var(--surface)',
                border: `1px solid ${activeFilterCount > 0 ? 'var(--amber)' : 'var(--border-subtle)'}`,
                color: activeFilterCount > 0 ? 'var(--amber)' : 'var(--text-secondary)',
              }}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--amber)', color: 'var(--bg)' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-3 p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
              <SelectFilter label="Make" value={filters.make} options={['Toyota', 'Honda', 'Nissan', 'Mazda']} onChange={(v) => setFilters((p) => ({ ...p, make: v }))} />
              <SelectFilter label="Grade" value={filters.grade} options={['5', '4.5', '4', '3.5']} onChange={(v) => setFilters((p) => ({ ...p, grade: v }))} />
              <SelectFilter label="Transmission" value={filters.transmission} options={['Automatic', 'CVT', 'Manual']} onChange={(v) => setFilters((p) => ({ ...p, transmission: v }))} />
              <SelectFilter label="Fuel" value={filters.fuel} options={['Petrol', 'Diesel', 'Hybrid']} onChange={(v) => setFilters((p) => ({ ...p, fuel: v }))} />
              <SelectFilter label="Auction House" value={filters.auctionHouse} options={['USS', 'TAA', 'CAA', 'AUCNET']} onChange={(v) => setFilters((p) => ({ ...p, auctionHouse: v }))} />
              <div>
                <span className="text-label block mb-1" style={{ color: 'var(--text-secondary)' }}>Year Min</span>
                <input
                  type="number"
                  value={filters.yearMin}
                  onChange={(e) => setFilters((p) => ({ ...p, yearMin: e.target.value }))}
                  placeholder="2018"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none"
                  style={{ backgroundColor: 'var(--surface-light)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <span className="text-label block mb-1" style={{ color: 'var(--text-secondary)' }}>Year Max</span>
                <input
                  type="number"
                  value={filters.yearMax}
                  onChange={(e) => setFilters((p) => ({ ...p, yearMax: e.target.value }))}
                  placeholder="2026"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none"
                  style={{ backgroundColor: 'var(--surface-light)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <span className="text-label block mb-1" style={{ color: 'var(--text-secondary)' }}>Max Price</span>
                <input
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => setFilters((p) => ({ ...p, priceMax: e.target.value }))}
                  placeholder="100000"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none"
                  style={{ backgroundColor: 'var(--surface-light)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="col-span-2 md:col-span-4 flex items-center justify-between pt-2">
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {filteredVehicles.length} results
                </span>
                <button
                  onClick={() => setFilters({ make: '', model: '', yearMin: '', yearMax: '', priceMin: '', priceMax: '', mileageMax: '', grade: '', transmission: '', fuel: '', auctionHouse: '' })}
                  className="text-sm transition-colors"
                  style={{ color: 'var(--amber)' }}
                >
                  Reset All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container-main py-8">
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle._id}
              className="group rounded-xl overflow-hidden transition-all duration-200"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                const img = e.currentTarget.querySelector('.card-image') as HTMLElement;
                if (img) img.style.transform = 'scale(1.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
                const img = e.currentTarget.querySelector('.card-image') as HTMLElement;
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: '16/10', backgroundColor: '#0F0F0F' }}>
                <img
                  src={vehicle.image}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="card-image w-full h-full object-cover transition-transform duration-300"
                  loading="lazy"
                />
                <span
                  className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)', color: 'var(--text-primary)', fontSize: '0.75rem', letterSpacing: '0.08em' }}
                >
                  {vehicle.auctionHouse}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm truncate pr-2" style={{ color: 'var(--text-primary)' }}>
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
                  <span>Grade {vehicle.grade}</span>
                  <span>·</span>
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
                    Auction: {vehicle.auctionDate}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
                    <span style={{ color: 'var(--success)', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                      Available
                    </span>
                  </div>
                </div>
                <Link
                  to={`/vehicle/${vehicle._id}`}
                  className="block mt-3 text-center py-2 rounded-md text-sm font-medium transition-all duration-150 hover:brightness-110"
                  style={{ backgroundColor: 'var(--amber-dim)', color: 'var(--amber)' }}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-h4" style={{ color: 'var(--text-secondary)' }}>
              No vehicles match your filters.
            </p>
            <button
              onClick={() => { setSearch(''); setFilters({ make: '', model: '', yearMin: '', yearMax: '', priceMin: '', priceMax: '', mileageMax: '', grade: '', transmission: '', fuel: '', auctionHouse: '' }); }}
              className="mt-4 inline-block font-medium"
              style={{ color: 'var(--amber)' }}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function SelectFilter({
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
  return (
    <div>
      <span className="text-label block mb-1" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md text-sm appearance-none outline-none cursor-pointer"
          style={{
            backgroundColor: 'var(--surface-light)',
            border: '1px solid var(--border-subtle)',
            color: value ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          <option value="">All</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
      </div>
    </div>
  );
}
