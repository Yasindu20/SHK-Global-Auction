import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Heart,
  FileText,
  Ship,
  MessageSquare,
  Settings,
  ChevronRight,
  Truck,
  Download,
  Send,
  Loader,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useCustomerAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TrackingStep {
  label: string;
  done: boolean;
  active: boolean;
  timestamp?: string;
}

interface OrderDocument {
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

interface Vehicle {
  make: string;
  modelName: string;
  year: number;
  price: number;
  images: string[];
  grade: string;
}

interface Order {
  _id: string;
  orderId: string;
  status: 'purchased' | 'shipped' | 'in_transit' | 'customs_cleared' | 'delivered';
  trackingSteps: TrackingStep[];
  vessel?: string;
  container?: string;
  eta?: string;
  documents: OrderDocument[];
  vehicleId: Vehicle;
  createdAt: string;
}

interface SavedVehicle {
  _id: string;
  make: string;
  modelName: string;
  year: number;
  price: number;
  images: string[];
  grade: string;
}

interface Message {
  _id: string;
  threadId: string;
  sender: 'customer' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
  readByCustomer: boolean;
  readByAdmin: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const navItems = [
  { icon: Package, label: 'My Orders',      key: 'orders'    },
  { icon: Heart,   label: 'Saved Vehicles', key: 'saved'     },
  { icon: FileText,label: 'Documents',      key: 'documents' },
  { icon: MessageSquare, label: 'Messages', key: 'messages'  },
  { icon: Settings,label: 'Settings',       key: 'settings'  },
];

const STATUS_COLOR: Record<string, string> = {
  purchased:       'var(--amber)',
  shipped:         'var(--amber)',
  in_transit:      'var(--amber)',
  customs_cleared: 'var(--success)',
  delivered:       'var(--success)',
};

// ── Fallback image helper ──────────────────────────────────────────────────────
const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"%3E%3Crect width="320" height="200" fill="%231C1C1C"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%238A8279" font-size="14" font-family="Inter,sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';

function SafeImg({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  return (
    <img
      src={src || PLACEHOLDER}
      alt={alt}
      className={className}
      onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
    />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CustomerProfile() {
  const [activeTab, setActiveTab] = useState('orders');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const { user, userLogout, getUserAuthHeader } = useCustomerAuth();
  const navigate = useNavigate();

  // ── Redirect unauthenticated users (must be in useEffect, not render) ───────
  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  // ── Build auth headers with correct Bearer token ───────────────────────────
  const jsonHeaders = (): Record<string, string> => ({
    ...getUserAuthHeader(),
    'Content-Type': 'application/json',
  });

  const authHeaders = (): Record<string, string> => getUserAuthHeader();

  // ── Data fetchers ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/user/profile`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`${res.status}`);
        setUserProfile(await res.json());
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user || activeTab !== 'orders') return;
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/user/orders`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`${res.status}`);
        setOrders(await res.json());
      } catch (err) {
        console.error('Orders fetch error:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  useEffect(() => {
    if (!user || activeTab !== 'saved') return;
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/user/saved-vehicles`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`${res.status}`);
        setSavedVehicles(await res.json());
      } catch (err) {
        console.error('Saved vehicles fetch error:', err);
        setError('Failed to load saved vehicles');
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  useEffect(() => {
    if (!user || activeTab !== 'messages') return;
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/user/messages`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`${res.status}`);
        setMessages(await res.json());
      } catch (err) {
        console.error('Messages fetch error:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  useEffect(() => {
    if (!selectedThreadId) return;
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API}/api/user/messages/${selectedThreadId}`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`${res.status}`);
        setThreadMessages(await res.json());
      } catch (err) {
        console.error('Thread fetch error:', err);
      }
    };
    fetch_();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await userLogout();
    navigate('/');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const endpoint = selectedThreadId
        ? `${API}/api/user/messages/${selectedThreadId}/reply`
        : `${API}/api/user/messages`;
      const payload = selectedThreadId
        ? { message: newMessage }
        : { subject: messageSubject || 'Support request', message: newMessage };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${res.status}`);

      setNewMessage('');
      setMessageSubject('');

      // Refresh thread / message list
      if (selectedThreadId) {
        const tRes = await fetch(`${API}/api/user/messages/${selectedThreadId}`, { headers: authHeaders() });
        if (tRes.ok) setThreadMessages(await tRes.json());
      }
      const mRes = await fetch(`${API}/api/user/messages`, { headers: authHeaders() });
      if (mRes.ok) setMessages(await mRes.json());
    } catch (err) {
      console.error('Send message error:', err);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRemoveSavedVehicle = async (vehicleId: string) => {
    try {
      const res = await fetch(`${API}/api/user/saved-vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setSavedVehicles((prev) => prev.filter((v) => v._id !== vehicleId));
    } catch (err) {
      console.error('Remove vehicle error:', err);
      setError('Failed to remove vehicle');
    }
  };

  // ── Render guard — while redirecting show nothing ──────────────────────────
  if (!user) return null;

  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Sidebar (desktop) ───────────────────────────────────────────── */}
      <aside
        className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-64px)] w-[240px] overflow-y-auto"
        style={{ backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border-subtle)' }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: 'var(--amber-dim)', color: 'var(--amber)' }}
            >
              {userInitials}
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {user.firstName} {user.lastName}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Customer Profile</p>
            </div>
          </div>
        </div>

        <nav className="px-3 pb-6">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { setActiveTab(item.key); setSelectedThreadId(null); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-left"
              style={{
                backgroundColor: activeTab === item.key ? 'var(--surface-light)' : 'transparent',
                color: activeTab === item.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <item.icon size={18} />
              <span style={{ fontSize: '0.875rem' }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 pb-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-left"
            style={{ color: 'var(--text-secondary)' }}
          >
            <LogOut size={18} />
            <span style={{ fontSize: '0.875rem' }}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile menu ─────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-30">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full py-3 px-4 text-left text-sm font-medium flex items-center justify-between"
          style={{
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          {navItems.find((n) => n.key === activeTab)?.label}
          <ChevronRight size={16} className={`transition-transform ${mobileMenuOpen ? 'rotate-90' : ''}`} />
        </button>
        {mobileMenuOpen && (
          <nav style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border-subtle)' }}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); setMobileMenuOpen(false); setSelectedThreadId(null); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{
                  backgroundColor: activeTab === item.key ? 'var(--surface-light)' : 'transparent',
                  color: activeTab === item.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                <item.icon size={18} />
                <span style={{ fontSize: '0.875rem' }}>{item.label}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <LogOut size={18} />
              <span style={{ fontSize: '0.875rem' }}>Sign Out</span>
            </button>
          </nav>
        )}
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-[240px] pt-16 lg:pt-0">
        <div className="p-6 md:p-10 mt-12 lg:mt-0">

          {/* Global error banner */}
          {error && (
            <div
              className="mb-6 p-4 rounded-lg flex items-center gap-3"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
            >
              <AlertCircle size={20} />
              <span>{error}</span>
              <button className="ml-auto text-sm underline" onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          {/* ── ORDERS ──────────────────────────────────────────────────── */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>My Orders</h2>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                Track your vehicles from auction to delivery.
              </p>

              {loading ? (
                <div className="mt-8 flex justify-center">
                  <Loader size={32} className="animate-spin" style={{ color: 'var(--amber)' }} />
                </div>
              ) : orders.length === 0 ? (
                <div className="mt-8 p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--surface)' }}>
                  <Ship size={32} className="mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>No orders yet. Start browsing vehicles!</p>
                  <Link
                    to="/inventory"
                    className="inline-block mt-4 px-5 py-2 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'var(--amber-dim)', color: 'var(--amber)' }}
                  >
                    Browse Inventory
                  </Link>
                </div>
              ) : (
                <div className="mt-8 space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="rounded-xl p-6"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-semibold" style={{ color: 'var(--amber)' }}>
                          #{order.orderId}
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${STATUS_COLOR[order.status]}20`,
                            color: STATUS_COLOR[order.status],
                          }}
                        >
                          {order.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Vehicle */}
                      <div className="flex items-center gap-4 mt-4">
                        <SafeImg
                          src={order.vehicleId?.images?.[0]}
                          alt={order.vehicleId?.modelName || 'Vehicle'}
                          className="w-20 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <p style={{ color: 'var(--text-primary)' }}>
                            {order.vehicleId?.year} {order.vehicleId?.make} {order.vehicleId?.modelName}
                          </p>
                          {order.vehicleId?.grade && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                              Grade {order.vehicleId.grade}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Progress */}
                      {order.trackingSteps?.length > 0 && (
                        <div className="mt-6">
                          <div className="relative h-1 rounded-full" style={{ backgroundColor: 'var(--surface-light)' }}>
                            <div
                              className="absolute top-0 left-0 h-full rounded-full transition-all"
                              style={{
                                width: `${(order.trackingSteps.filter((s) => s.done).length / order.trackingSteps.length) * 100}%`,
                                backgroundColor: 'var(--amber)',
                              }}
                            />
                            {order.trackingSteps.map((step, i) => (
                              <div
                                key={i}
                                className="absolute"
                                style={{
                                  left: `${(i / (order.trackingSteps.length - 1)) * 100}%`,
                                  top: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  width: 12, height: 12, borderRadius: '50%',
                                  backgroundColor: step.done ? 'var(--amber)' : 'var(--surface-light)',
                                  border: `2px solid ${step.done ? 'var(--amber)' : 'var(--border-subtle)'}`,
                                }}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between mt-2">
                            {order.trackingSteps.map((step, i) => (
                              <span
                                key={i}
                                style={{
                                  color: step.done ? 'var(--amber)' : step.active ? 'var(--text-primary)' : 'var(--text-secondary)',
                                  fontSize: '0.65rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {step.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Shipment details */}
                      {(order.vessel || order.container || order.eta) && (
                        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            <Truck size={14} />
                            <span>
                              {[
                                order.vessel && `Vessel: ${order.vessel}`,
                                order.container && `Container: ${order.container}`,
                                order.eta && `ETA: ${order.eta}`,
                              ].filter(Boolean).join(' · ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {order.documents?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                            Documents ({order.documents.length})
                          </p>
                          <div className="space-y-2">
                            {order.documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded transition-colors"
                                style={{ backgroundColor: 'var(--surface-light)', color: 'var(--amber)' }}
                              >
                                <Download size={14} />
                                <span style={{ fontSize: '0.875rem' }}>{doc.name}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SAVED VEHICLES ──────────────────────────────────────────── */}
          {activeTab === 'saved' && (
            <div>
              <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>Saved Vehicles</h2>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Vehicles you've bookmarked for later.</p>

              {loading ? (
                <div className="mt-8 flex justify-center">
                  <Loader size={32} className="animate-spin" style={{ color: 'var(--amber)' }} />
                </div>
              ) : savedVehicles.length === 0 ? (
                <div className="mt-8 p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--surface)' }}>
                  <Heart size={32} className="mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>No saved vehicles yet.</p>
                  <Link
                    to="/inventory"
                    className="inline-block mt-4 px-5 py-2 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'var(--amber-dim)', color: 'var(--amber)' }}
                  >
                    Browse Inventory
                  </Link>
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedVehicles.map((v) => (
                    <div
                      key={v._id}
                      className="rounded-xl overflow-hidden"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                    >
                      <SafeImg
                        src={v.images?.[0]}
                        alt={v.modelName}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-4">
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {v.year} {v.make} {v.modelName}
                        </p>
                        <p className="mt-1" style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '1.1rem' }}>
                          From ${v.price.toLocaleString()}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Link
                            to={`/vehicle/${v._id}`}
                            className="flex-1 inline-flex items-center justify-center text-sm py-2 rounded transition-colors"
                            style={{ color: 'var(--amber)', backgroundColor: 'var(--amber-dim)' }}
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleRemoveSavedVehicle(v._id)}
                            className="flex-1 inline-flex items-center justify-center text-sm py-2 rounded transition-colors"
                            style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface-light)' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MESSAGES ────────────────────────────────────────────────── */}
          {activeTab === 'messages' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Thread list */}
              <div className="lg:col-span-1">
                <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>Messages</h2>
                <p className="mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>Contact support</p>

                {/* New thread form */}
                {!selectedThreadId && (
                  <form onSubmit={handleSendMessage} className="mb-4 space-y-2">
                    <input
                      type="text"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      placeholder="Subject"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Start a new conversation…"
                        className="flex-1 px-3 py-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="px-3 py-2 rounded-lg"
                        style={{ backgroundColor: 'var(--amber)', color: '#0A0A0A', opacity: sendingMessage ? 0.6 : 1 }}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </form>
                )}

                {loading ? (
                  <div className="flex justify-center">
                    <Loader size={24} className="animate-spin" style={{ color: 'var(--amber)' }} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No messages yet.</p>
                    ) : (
                      messages.map((msg) => (
                        <button
                          key={msg.threadId}
                          onClick={() => setSelectedThreadId(msg.threadId)}
                          className="w-full text-left p-3 rounded-lg transition-colors"
                          style={{
                            backgroundColor: selectedThreadId === msg.threadId ? 'var(--surface-light)' : 'var(--surface)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            {msg.senderName}
                          </p>
                          <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                            {msg.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Thread view */}
              <div className="lg:col-span-2">
                {selectedThreadId ? (
                  <div
                    className="rounded-xl p-6 flex flex-col"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                      minHeight: 400,
                    }}
                  >
                    <button
                      onClick={() => setSelectedThreadId(null)}
                      className="self-start text-xs mb-4"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      ← Back
                    </button>
                    <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                      {threadMessages.map((msg) => (
                        <div
                          key={msg._id}
                          className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className="max-w-xs p-3 rounded-lg"
                            style={{
                              backgroundColor: msg.sender === 'customer' ? 'var(--amber)' : 'var(--surface-light)',
                              color: msg.sender === 'customer' ? '#0A0A0A' : 'var(--text-primary)',
                            }}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p
                              className="text-xs mt-1"
                              style={{ color: msg.sender === 'customer' ? 'rgba(10,10,10,0.6)' : 'var(--text-secondary)' }}
                            >
                              {new Date(msg.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message…"
                        className="flex-1 px-4 py-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--bg)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="px-4 py-2 rounded-lg"
                        style={{ backgroundColor: 'var(--amber)', color: '#0A0A0A', opacity: sendingMessage ? 0.6 : 1 }}
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div
                    className="rounded-xl p-6 flex items-center justify-center"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)', minHeight: 400 }}
                  >
                    <p style={{ color: 'var(--text-secondary)' }}>Select a thread or start a new conversation.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DOCUMENTS ───────────────────────────────────────────────── */}
          {activeTab === 'documents' && (
            <div>
              <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>Documents</h2>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>All your order documents in one place.</p>

              {orders.flatMap((o) => o.documents).length === 0 ? (
                <div className="mt-8 p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--surface)' }}>
                  <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>No documents available yet.</p>
                </div>
              ) : (
                <div className="mt-8 space-y-4">
                  {orders.flatMap((order) =>
                    order.documents.map((doc, idx) => (
                      <div
                        key={`${order._id}-${idx}`}
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                      >
                        <div className="flex items-center gap-3">
                          <FileText size={18} style={{ color: 'var(--amber)' }} />
                          <div>
                            <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{doc.name}</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Order #{order.orderId}</p>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: 'var(--amber-dim)', color: 'var(--amber)' }}
                        >
                          Download
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ────────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>Account Settings</h2>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Manage your profile information.</p>

              <div className="mt-8 max-w-2xl space-y-6">
                <div
                  className="rounded-xl p-6"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Profile Information</h3>
                  {userProfile ? (
                    <dl className="space-y-4">
                      {[
                        { label: 'Email',   value: userProfile.email },
                        { label: 'Name',    value: `${userProfile.firstName} ${userProfile.lastName}` },
                        { label: 'Phone',   value: userProfile.phone   || 'Not provided' },
                        { label: 'Country', value: userProfile.country || 'Not provided' },
                        { label: 'Member since', value: new Date(userProfile.createdAt).toLocaleDateString() },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <dt className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</dt>
                          <dd className="mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <div className="flex justify-center">
                      <Loader size={24} className="animate-spin" style={{ color: 'var(--amber)' }} />
                    </div>
                  )}
                </div>

                <div
                  className="rounded-xl p-6"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Danger Zone</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Sign out from all sessions.</p>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}