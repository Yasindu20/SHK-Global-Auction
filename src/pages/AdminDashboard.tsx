import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Car, CheckCircle, Clock, XCircle, Plus, ClipboardList,
  Radio, ArrowUpRight, RefreshCw, Activity,
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Stats { total: number; approved: number; pending: number; rejected: number; }
interface Listing {
  _id: string; stockId: string; make: string; modelName?: string; model?: string;
  year: number; price: number; status: 'pending' | 'approved' | 'rejected';
  supplierName: string; timestamp: string; images?: string[];
}
interface CrawlStatus {
  running: boolean; phase: string; added: number; skipped: number;
  failed: number; totalLinks: number; startedAt?: string; finishedAt?: string;
}

export default function AdminDashboard() {
  const { getAdminAuthHeader } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Listing[]>([]);
  const [crawlStatus, setCrawlStatus] = useState<CrawlStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    const headers = getAdminAuthHeader();
    try {
      const [statsRes, listingsRes, crawlRes] = await Promise.all([
        fetch(`${API}/api/stats`, { headers }),
        fetch(`${API}/api/listings/all`, { headers }),
        fetch(`${API}/api/crawl-status`, { headers }),
      ]);
      const [s, l, c] = await Promise.all([statsRes.json(), listingsRes.json(), crawlRes.json()]);
      setStats(s);
      setRecent(Array.isArray(l) ? l.slice(0, 8) : []);
      setCrawlStatus(c);
    } catch { /* silently handle */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(() => loadData(), 15000);
    return () => clearInterval(iv);
  }, []);

  const statusConfig: Record<string, { color: string; bg: string; label: string; icon: typeof CheckCircle }> = {
    approved: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', label: 'Approved', icon: CheckCircle },
    pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Pending', icon: Clock },
    rejected: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'Rejected', icon: XCircle },
  };

  const statCards = stats ? [
    { label: 'Total Listings', value: stats.total, delta: '+12%', positive: true, Icon: Car, accent: '#D4A853', bg: 'rgba(212,168,83,0.08)' },
    { label: 'Approved', value: stats.approved, delta: stats.total ? `${Math.round((stats.approved / stats.total) * 100)}%` : '0%', positive: true, Icon: CheckCircle, accent: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
    { label: 'Pending Review', value: stats.pending, delta: stats.pending > 0 ? 'Needs attention' : 'All clear', positive: stats.pending === 0, Icon: Clock, accent: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    { label: 'Rejected', value: stats.rejected, delta: stats.total ? `${Math.round((stats.rejected / stats.total) * 100)}%` : '0%', positive: false, Icon: XCircle, accent: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  ] : [];

  const quickActions = [
    { label: 'Add Vehicle', desc: 'Manually create a listing', href: '/admin/add-vehicle', Icon: Plus, accent: '#D4A853' },
    { label: 'Review Queue', desc: `${stats?.pending || 0} vehicles waiting`, href: '/admin/review', Icon: ClipboardList, accent: '#F59E0B' },
    { label: 'Crawl Monitor', desc: crawlStatus?.running ? 'Crawl in progress' : 'Start new crawl', href: '/admin/crawl', Icon: Radio, accent: '#22C55E' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#D4A853', borderTopColor: 'transparent' }} />
          <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Loading dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadData(true)} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF' }}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link to="/admin/add-vehicle"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: '#D4A853', color: '#0A0A0A' }}>
            <Plus size={15} />Add Vehicle
          </Link>
        </div>
      </div>

      {crawlStatus?.running && (
        <div className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.15)' }}>
              <Activity size={15} style={{ color: '#22C55E' }} />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Crawl in progress</p>
              <p style={{ color: '#22C55E', fontSize: '0.75rem' }}>
                Phase: {crawlStatus.phase} · {crawlStatus.added} saved · {crawlStatus.totalLinks} links found
              </p>
            </div>
          </div>
          <Link to="/admin/crawl"
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
            View Monitor <ArrowUpRight size={13} />
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, delta, positive, Icon, accent, bg }) => (
          <div key={label} className="rounded-xl p-5 flex flex-col gap-4"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon size={17} style={{ color: accent }} />
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: positive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: positive ? '#22C55E' : '#EF4444' }}>
                {delta}
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
              <p style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: 2 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="rounded-xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map(({ label, desc, href, Icon, accent }) => (
              <Link key={href} to={href}
                className="flex items-center gap-3 p-3 rounded-lg transition-all group"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${accent}40`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)')}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${accent}18` }}>
                  <Icon size={16} style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p style={{ color: '#6B7280', fontSize: '0.75rem' }}>{desc}</p>
                </div>
                <ArrowUpRight size={14} style={{ color: '#4B5563' }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Listings */}
        <div className="lg:col-span-2 rounded-xl" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 className="text-sm font-semibold text-white">Recent Listings</h2>
            <Link to="/admin/review" className="text-xs font-medium flex items-center gap-1"
              style={{ color: '#D4A853' }}>
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Car size={28} style={{ color: '#374151' }} />
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>No listings yet</p>
              </div>
            ) : (
              recent.map((listing) => {
                const cfg = statusConfig[listing.status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                const modelDisplay = listing.modelName || listing.model || '—';
                return (
                  <div key={listing._id} className="flex items-center gap-3 px-5 py-3 transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {listing.images?.[0] ? (
                        <img src={listing.images[0]} alt="" className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <Car size={16} style={{ color: '#4B5563' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {listing.year} {listing.make} {modelDisplay}
                      </p>
                      <p style={{ color: '#6B7280', fontSize: '0.72rem' }}>
                        #{listing.stockId} · {listing.supplierName}
                      </p>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-sm font-semibold" style={{ color: '#D4A853' }}>
                        {listing.price > 0 ? `$${listing.price.toLocaleString()}` : 'TBD'}
                      </p>
                      <p style={{ color: '#4B5563', fontSize: '0.7rem' }}>
                        {new Date(listing.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: cfg.bg }}>
                      <StatusIcon size={11} style={{ color: cfg.color }} />
                      <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {stats && stats.total > 0 && (
        <div className="rounded-xl p-5" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Inventory Health</h2>
            <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>{stats.total} total vehicles</span>
          </div>
          <div className="flex rounded-full overflow-hidden h-3">
            {[
              { value: stats.approved, color: '#22C55E' },
              { value: stats.pending, color: '#F59E0B' },
              { value: stats.rejected, color: '#EF4444' },
            ].map(({ value, color }, i) => (
              <div key={i} style={{ width: `${(value / stats.total) * 100}%`, background: color, minWidth: value > 0 ? 4 : 0 }} />
            ))}
          </div>
          <div className="flex gap-5 mt-3">
            {[
              { label: 'Approved', value: stats.approved, color: '#22C55E' },
              { label: 'Pending', value: stats.pending, color: '#F59E0B' },
              { label: 'Rejected', value: stats.rejected, color: '#EF4444' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                  {label}: <span className="text-white font-medium">{value}</span>
                  <span style={{ color: '#6B7280' }}> ({Math.round((value / stats.total) * 100)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}