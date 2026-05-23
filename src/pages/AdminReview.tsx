import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink, Check, X, RefreshCw, Filter } from 'lucide-react';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Listing {
  _id: string;
  stockId: string;
  make: string;
  modelName?: string;
  model?: string;
  year: number;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  sourceUrl?: string;
  supplierName: string;
  timestamp: string;
  images?: string[];
}

const STATUS_CONFIG = {
  pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Pending' },
  approved: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', label: 'Approved' },
  rejected: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'Rejected' },
};

export default function AdminReview() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchListings = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch(`${API}/api/listings/all`);
      const data = await res.json();
      setListings(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to fetch listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/listings/approve/${id}`, { method: 'POST' });
      if (res.ok) { toast.success('Listing approved'); fetchListings(); }
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/listings/reject/${id}`, { method: 'POST' });
      if (res.ok) { toast.success('Listing rejected'); fetchListings(); }
    } catch { toast.error('Failed to reject'); }
  };

  const filtered = filter === 'all' ? listings : listings.filter(l => l.status === filter);
  const counts = {
    all: listings.length,
    pending: listings.filter(l => l.status === 'pending').length,
    approved: listings.filter(l => l.status === 'approved').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Review Queue</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: 4 }}>
            Approve or reject scraped vehicle listings before they go live
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchListings(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <Link
            to="/admin/add-vehicle"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#D4A853', color: '#0A0A0A' }}
          >
            <Plus size={15} /> Add Vehicle
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
          const isActive = filter === tab;
          const cfg = tab !== 'all' ? STATUS_CONFIG[tab] : null;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                background: isActive ? (cfg ? cfg.bg : 'rgba(255,255,255,0.08)') : 'transparent',
                color: isActive ? (cfg ? cfg.color : '#F9FAFB') : '#6B7280',
              }}
            >
              {tab}
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? (cfg ? cfg.color : '#F9FAFB') : '#6B7280',
                }}
              >
                {counts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#D4A853', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Filter size={28} style={{ color: '#374151' }} />
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>No listings found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Vehicle', 'Stock ID', 'Year', 'Price', 'Supplier', 'Status', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold"
                    style={{ color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((listing) => {
                const modelDisplay = listing.modelName || listing.model || '—';
                const cfg = STATUS_CONFIG[listing.status];
                return (
                  <tr
                    key={listing._id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Vehicle */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        >
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <span style={{ color: '#4B5563', fontSize: '1rem' }}>🚗</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {listing.make} {modelDisplay}
                          </p>
                          <p style={{ color: '#6B7280', fontSize: '0.72rem' }}>
                            {new Date(listing.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="font-mono text-xs px-2 py-1 rounded"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}
                      >
                        {listing.stockId}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm text-white">{listing.year}</td>

                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold" style={{ color: '#D4A853' }}>
                        {listing.price > 0 ? `$${listing.price.toLocaleString()}` : '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm" style={{ color: '#9CA3AF' }}>
                      {listing.supplierName}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {listing.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(listing._id)}
                              className="p-1.5 rounded-md transition-colors"
                              title="Approve"
                              style={{ color: '#22C55E', background: 'rgba(34,197,94,0.1)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.2)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.1)')}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(listing._id)}
                              className="p-1.5 rounded-md transition-colors"
                              title="Reject"
                              style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        {listing.status === 'approved' && (
                          <button
                            onClick={() => handleReject(listing._id)}
                            className="p-1.5 rounded-md transition-colors text-xs"
                            title="Revoke approval"
                            style={{ color: '#6B7280', background: 'rgba(255,255,255,0.05)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                          >
                            <X size={14} />
                          </button>
                        )}
                        {listing.status === 'rejected' && (
                          <button
                            onClick={() => handleApprove(listing._id)}
                            className="p-1.5 rounded-md transition-colors"
                            title="Re-approve"
                            style={{ color: '#6B7280', background: 'rgba(255,255,255,0.05)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#22C55E')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {listing.sourceUrl && (
                          <a
                            href={listing.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: '#6B7280', background: 'rgba(255,255,255,0.05)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#D4A853')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}