import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Search,
  ChevronDown,
  SlidersHorizontal,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronUp,
  Database,
  Zap,
} from 'lucide-react';
import { type Vehicle } from '../data/vehicles';
import Footer from '../sections/Footer';

const API = 'http://localhost:5000';

interface CrawlStatus {
  running: boolean;
  phase: 'idle' | 'collecting' | 'scraping' | 'done';
  added: number;
  skipped: number;
  failed: number;
  totalLinks: number;
  startedAt?: string;
  finishedAt?: string;
  recentLogs: string[];
}

export default function Inventory() {
  const gridRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCrawlPanel, setShowCrawlPanel] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState<CrawlStatus | null>(null);
  const [scrapeMsg, setScrapeMsg] = useState('');

  const [filters, setFilters] = useState({
    make: '',
    yearMin: '',
    yearMax: '',
    priceMin: '',
    priceMax: '',
    mileageMax: '',
    transmission: '',
    fuel: '',
  });
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filteredVehicles = allVehicles.filter((v) => {
    const q = search.toLowerCase();
    if (search && !`${v.make} ${v.model} ${v.chassisNumber ?? ''}`.toLowerCase().includes(q))
      return false;
    if (filters.make && v.make !== filters.make) return false;
    if (filters.transmission && v.transmission !== filters.transmission) return false;
    if (filters.fuel && v.fuel !== filters.fuel) return false;
    if (filters.yearMin && v.year < parseInt(filters.yearMin)) return false;
    if (filters.yearMax && v.year > parseInt(filters.yearMax)) return false;
    if (filters.priceMin && v.price < parseInt(filters.priceMin)) return false;
    if (filters.priceMax && v.price > parseInt(filters.priceMax)) return false;
    if (filters.mileageMax && v.mileage > parseInt(filters.mileageMax)) return false;
    return true;
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ── Fetch vehicles ────────────────────────────────────────────────────────────
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/listings`);
      const data = await res.json();
      setAllVehicles(data);
    } catch (e) {
      console.error('Failed to fetch vehicles:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch crawl status ────────────────────────────────────────────────────────
  const fetchCrawlStatus = async () => {
    try {
      const res = await fetch(`${API}/api/crawl-status`);
      const data = await res.json();
      setCrawlStatus(data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchCrawlStatus();
    window.scrollTo(0, 0);
  }, []);

  // Poll while running
  useEffect(() => {
    if (!crawlStatus?.running) return;
    const interval = setInterval(fetchCrawlStatus, 3000);
    return () => clearInterval(interval);
  }, [crawlStatus?.running]);

  // Re-fetch vehicles when crawl finishes
  const prevRunning = useRef(false);
  useEffect(() => {
    if (prevRunning.current && !crawlStatus?.running) {
      fetchVehicles();
    }
    prevRunning.current = crawlStatus?.running ?? false;
  }, [crawlStatus?.running]);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [crawlStatus?.recentLogs]);

  // ── Start scrape ──────────────────────────────────────────────────────────────
  const startScrape = async () => {
    setScrapeMsg('');
    try {
      const res = await fetch(`${API}/api/crawl-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier: 'STC Japan', minYear: 2024, concurrency: 4 }),
      });
      const data = await res.json();
      if (res.ok) {
        setScrapeMsg(data.message);
        setShowCrawlPanel(true);
        fetchCrawlStatus();
      } else {
        setScrapeMsg(data.error || 'Failed to start scraping');
      }
    } catch {
      setScrapeMsg('Could not connect to backend.');
    }
  };

  // ── Stop scrape ───────────────────────────────────────────────────────────────
  const stopScrape = async () => {
    await fetch(`${API}/api/crawl-stop`, { method: 'POST' });
    fetchCrawlStatus();
  };

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Image fallback ────────────────────────────────────────────────────────────
  const getImageSrc = (vehicle: Vehicle) => {
    if (vehicle.images && vehicle.images.length > 0) return vehicle.images[0];
    return `https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=500&q=80&auto=format&fit=crop`;
  };

  // ── Phase label helper ────────────────────────────────────────────────────────
  const phaseLabel = (phase: CrawlStatus['phase']) => {
    if (phase === 'collecting') return '📡 Phase 1 — Collecting links…';
    if (phase === 'scraping')   return '⚡ Phase 2 — Scraping details…';
    if (phase === 'done')       return '✅ Complete';
    return 'Idle';
  };

  const phaseColor = (phase: CrawlStatus['phase']) => {
    if (phase === 'collecting') return 'var(--amber)';
    if (phase === 'scraping')   return '#60a5fa';
    if (phase === 'done')       return 'var(--success)';
    return 'var(--text-secondary)';
  };

  return (
    <div style={{ backgroundColor: 'var(--bg)' }}>
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="pt-24 pb-6">
        <div className="container-main">
          <div className="flex flex-wrap justify-between items-end gap-4">
            <div>
              <h1 className="text-h2" style={{ color: 'var(--text-primary)' }}>
                Vehicle Inventory
              </h1>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                {loading
                  ? 'Loading…'
                  : `${allVehicles.length} approved vehicles from Japanese auctions.`}
              </p>
            </div>

            {/* Scrape controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {crawlStatus?.running && (
                <button
                  onClick={stopScrape}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.3)',
                  }}
                >
                  <AlertCircle size={14} /> Stop Crawl
                </button>
              )}
              <button
                onClick={() => setShowCrawlPanel(!showCrawlPanel)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                {showCrawlPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Crawl Monitor
              </button>
              <button
                onClick={fetchVehicles}
                className="p-2 rounded-md transition-all"
                title="Refresh inventory"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={startScrape}
                disabled={crawlStatus?.running}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--amber)', color: 'var(--bg)' }}
              >
                {crawlStatus?.running ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {crawlStatus.phase === 'collecting' ? 'Collecting links…' : 'Scraping…'}
                  </>
                ) : (
                  <>
                    <Zap size={14} /> Scrape STC Japan (2024+)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Crawl monitor panel ─────────────────────────────────────────────── */}
          {showCrawlPanel && (
            <div
              className="mt-4 rounded-xl p-4"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Crawl Monitor
                </span>
                {crawlStatus && (
                  <span
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: `${phaseColor(crawlStatus.phase)}22`,
                      color: phaseColor(crawlStatus.phase),
                      border: `1px solid ${phaseColor(crawlStatus.phase)}44`,
                    }}
                  >
                    {crawlStatus.running && (
                      <Loader2 size={10} className="animate-spin" />
                    )}
                    {phaseLabel(crawlStatus.phase)}
                  </span>
                )}
              </div>

              {/* Two-phase visual */}
              {crawlStatus && (
                <div className="flex gap-3 mb-4">
                  {/* Phase 1 card */}
                  <div
                    className="flex-1 rounded-lg p-3"
                    style={{
                      backgroundColor: crawlStatus.phase === 'collecting'
                        ? 'rgba(212,168,83,0.08)'
                        : 'var(--surface-light)',
                      border: `1px solid ${crawlStatus.phase === 'collecting'
                        ? 'rgba(212,168,83,0.3)'
                        : 'var(--border-subtle)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Database size={13} style={{ color: 'var(--amber)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--amber)' }}>
                        Phase 1 — Link Collection
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Uses STC Japan year-filter URL — no detail pages visited
                    </p>
                    {crawlStatus.totalLinks > 0 && (
                      <p className="mt-1 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {crawlStatus.totalLinks} listings found
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center" style={{ color: 'var(--text-secondary)' }}>
                    →
                  </div>

                  {/* Phase 2 card */}
                  <div
                    className="flex-1 rounded-lg p-3"
                    style={{
                      backgroundColor: crawlStatus.phase === 'scraping'
                        ? 'rgba(96,165,250,0.08)'
                        : 'var(--surface-light)',
                      border: `1px solid ${crawlStatus.phase === 'scraping'
                        ? 'rgba(96,165,250,0.3)'
                        : 'var(--border-subtle)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={13} style={{ color: '#60a5fa' }} />
                      <span className="text-xs font-medium" style={{ color: '#60a5fa' }}>
                        Phase 2 — Parallel Scrape
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      4 concurrent scrapers — detail pages only
                    </p>
                    {crawlStatus.phase === 'scraping' && (
                      <p className="mt-1 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {crawlStatus.added} saved so far
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Stats row */}
              {crawlStatus && (
                <div className="flex gap-6 mb-3">
                  {[
                    { label: 'Added', value: crawlStatus.added, color: 'var(--success)' },
                    { label: 'Links found', value: crawlStatus.totalLinks, color: 'var(--amber)' },
                    { label: 'Duplicates', value: crawlStatus.skipped, color: 'var(--text-secondary)' },
                    { label: 'Failed', value: crawlStatus.failed, color: '#ef4444' },
                  ].map((s) => (
                    <div key={s.label}>
                      <span className="text-xl font-bold" style={{ color: s.color }}>
                        {s.value}
                      </span>
                      <span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress bar (Phase 2 only) */}
              {crawlStatus && crawlStatus.totalLinks > 0 && crawlStatus.phase === 'scraping' && (
                <div className="mb-3">
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--surface-light)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          ((crawlStatus.added + crawlStatus.skipped + crawlStatus.failed) /
                            crawlStatus.totalLinks) * 100,
                          100
                        )}%`,
                        backgroundColor: '#60a5fa',
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {crawlStatus.added + crawlStatus.skipped + crawlStatus.failed} / {crawlStatus.totalLinks} processed
                  </p>
                </div>
              )}

              {/* Log output */}
              <div
                ref={logRef}
                className="rounded-lg p-3 font-mono text-xs overflow-y-auto"
                style={{
                  backgroundColor: '#0A0A0A',
                  border: '1px solid var(--border-subtle)',
                  maxHeight: '240px',
                  color: '#8A8279',
                }}
              >
                {!crawlStatus?.recentLogs?.length ? (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    No logs yet. Start a crawl to see output here.
                  </span>
                ) : (
                  crawlStatus.recentLogs.map((line, i) => (
                    <div
                      key={i}
                      style={{
                        color: line.includes('✅')
                          ? '#4ade80'
                          : line.includes('❌') || line.includes('💥')
                          ? '#ef4444'
                          : line.includes('⏭') || line.includes('🔁')
                          ? '#6b7280'
                          : line.includes('Phase 2') || line.includes('⚡')
                          ? '#60a5fa'
                          : line.includes('🚀') || line.includes('📄') || line.includes('Phase 1') || line.includes('🔍')
                          ? 'var(--amber)'
                          : '#8A8279',
                      }}
                    >
                      {line}
                    </div>
                  ))
                )}
              </div>

              {scrapeMsg && (
                <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {scrapeMsg}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-16 z-30"
        style={{
          backgroundColor: 'rgba(10, 10, 10, 0.92)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="container-main py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-grow max-w-lg">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-secondary)' }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by make, model, or chassis code…"
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
                backgroundColor:
                  activeFilterCount > 0 ? 'var(--amber-dim)' : 'var(--surface)',
                border: `1px solid ${
                  activeFilterCount > 0 ? 'var(--amber)' : 'var(--border-subtle)'
                }`,
                color:
                  activeFilterCount > 0 ? 'var(--amber)' : 'var(--text-secondary)',
              }}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                  style={{ backgroundColor: 'var(--amber)', color: 'var(--bg)' }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div
              className="mt-3 p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-3"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <SelectFilter
                label="Make"
                value={filters.make}
                options={['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Lexus']}
                onChange={(v) => setFilters((p) => ({ ...p, make: v }))}
              />
              <SelectFilter
                label="Transmission"
                value={filters.transmission}
                options={['Automatic', 'CVT', 'Manual']}
                onChange={(v) => setFilters((p) => ({ ...p, transmission: v }))}
              />
              <SelectFilter
                label="Fuel"
                value={filters.fuel}
                options={['Petrol', 'Diesel', 'Hybrid', 'Electric']}
                onChange={(v) => setFilters((p) => ({ ...p, fuel: v }))}
              />
              <div>
                <span className="text-label block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Year Min
                </span>
                <input
                  type="number"
                  value={filters.yearMin}
                  onChange={(e) => setFilters((p) => ({ ...p, yearMin: e.target.value }))}
                  placeholder="2024"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--surface-light)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <span className="text-label block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Year Max
                </span>
                <input
                  type="number"
                  value={filters.yearMax}
                  onChange={(e) => setFilters((p) => ({ ...p, yearMax: e.target.value }))}
                  placeholder="2026"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--surface-light)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <span className="text-label block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Max Price ($)
                </span>
                <input
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => setFilters((p) => ({ ...p, priceMax: e.target.value }))}
                  placeholder="100000"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--surface-light)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <span className="text-label block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Max Mileage (km)
                </span>
                <input
                  type="number"
                  value={filters.mileageMax}
                  onChange={(e) => setFilters((p) => ({ ...p, mileageMax: e.target.value }))}
                  placeholder="100000"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--surface-light)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div
                className="col-span-2 md:col-span-4 flex items-center justify-between pt-2"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {filteredVehicles.length} results
                </span>
                <button
                  onClick={() =>
                    setFilters({
                      make: '',
                      yearMin: '',
                      yearMax: '',
                      priceMin: '',
                      priceMax: '',
                      mileageMax: '',
                      transmission: '',
                      fuel: '',
                    })
                  }
                  className="text-sm"
                  style={{ color: 'var(--amber)' }}
                >
                  Reset All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Results grid ───────────────────────────────────────────────────────── */}
      <div className="container-main py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--amber)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading inventory…</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div
              ref={gridRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle._id}
                  vehicle={vehicle}
                  saved={savedIds.has(vehicle._id)}
                  onToggleSave={() => toggleSave(vehicle._id)}
                  imageSrc={getImageSrc(vehicle)}
                />
              ))}
            </div>

            {filteredVehicles.length === 0 && (
              <div className="text-center py-20">
                <p className="text-h4" style={{ color: 'var(--text-secondary)' }}>
                  {allVehicles.length === 0
                    ? 'No vehicles yet. Click "Scrape STC Japan (2024+)" to import data.'
                    : 'No vehicles match your filters.'}
                </p>
                {allVehicles.length > 0 && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setFilters({
                        make: '',
                        yearMin: '',
                        yearMax: '',
                        priceMin: '',
                        priceMax: '',
                        mileageMax: '',
                        transmission: '',
                        fuel: '',
                      });
                    }}
                    className="mt-4 inline-block font-medium"
                    style={{ color: 'var(--amber)' }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ── Vehicle Card ────────────────────────────────────────────────────────────────
function VehicleCard({
  vehicle,
  saved,
  onToggleSave,
  imageSrc,
}: {
  vehicle: Vehicle;
  saved: boolean;
  onToggleSave: () => void;
  imageSrc: string;
}) {
  const [imgError, setImgError] = useState(false);

  const fallback =
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=500&q=80&auto=format&fit=crop';

  return (
    <div
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
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '16/10', backgroundColor: '#0F0F0F' }}
      >
        <img
          src={imgError ? fallback : imageSrc}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="card-image w-full h-full object-cover transition-transform duration-300"
          loading="lazy"
          onError={() => setImgError(true)}
          crossOrigin="anonymous"
        />
        {vehicle.images && vehicle.images.length > 1 && (
          <span
            className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'var(--text-primary)',
            }}
          >
            +{vehicle.images.length - 1} photos
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3
            className="font-semibold text-sm truncate pr-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <button
            onClick={onToggleSave}
            className="shrink-0 transition-colors duration-150"
            style={{ color: saved ? 'var(--amber)' : 'var(--text-secondary)' }}
          >
            <Heart size={18} fill={saved ? 'var(--amber)' : 'none'} />
          </button>
        </div>

        <div
          className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2"
          style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}
        >
          {vehicle.grade && <span>Grade {vehicle.grade}</span>}
          {vehicle.grade && <span>·</span>}
          <span>{vehicle.mileage.toLocaleString()} km</span>
          <span>·</span>
          <span>{vehicle.fuel}</span>
          <span>·</span>
          <span>{vehicle.transmission}</span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-price" style={{ color: 'var(--amber)' }}>
            {vehicle.price > 0
              ? `From $${vehicle.price.toLocaleString()}`
              : 'Price on Request'}
          </span>
          <span
            className="text-label"
            style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}
          >
            CIF Mombasa
          </span>
        </div>

        <div
          className="flex items-center justify-between mt-3 pt-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            {vehicle.supplierName}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--success)' }}
            />
            <span
              style={{
                color: 'var(--success)',
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
              }}
            >
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
  );
}

// ── SelectFilter ────────────────────────────────────────────────────────────────
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
      <span
        className="text-label block mb-1"
        style={{ color: 'var(--text-secondary)' }}
      >
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
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>
    </div>
  );
}