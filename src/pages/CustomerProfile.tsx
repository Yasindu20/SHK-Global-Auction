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
  CheckCircle,
  Download,
  Send,
  Loader,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useCustomerAuth } from '../contexts/AuthContext';

interface Order {
  _id: string;
  orderId: string;
  status: 'purchased' | 'shipped' | 'in_transit' | 'customs_cleared' | 'delivered';
  trackingSteps: Array<{ label: string; done: boolean; active: boolean; timestamp?: string }>;
  vessel?: string;
  container?: string;
  eta?: string;
  documents: Array<{ name: string; url: string; type: string; uploadedAt: string }>;
  vehicleId: {
    make: string;
    modelName: string;
    year: number;
    price: number;
    images: string[];
    grade: string;
  };
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

const navItems = [
  { icon: Package, label: 'My Orders', key: 'orders' },
  { icon: Heart, label: 'Saved Vehicles', key: 'saved' },
  { icon: FileText, label: 'Documents', key: 'documents' },
  { icon: MessageSquare, label: 'Messages', key: 'messages' },
  { icon: Settings, label: 'Settings', key: 'settings' },
];

const statusColorMap: Record<string, string> = {
  purchased: 'var(--amber)',
  shipped: 'var(--amber)',
  in_transit: 'var(--amber)',
  customs_cleared: 'var(--success)',
  delivered: 'var(--success)',
};

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

  const { user, userLogout } = useCustomerAuth();
  const navigate = useNavigate();

  // Get auth header for API calls
  const getAuthHeader = () => {
    const token = localStorage.getItem('accessToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/profile', {
          headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        setUserProfile(data);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/orders', {
          headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error('Orders fetch error:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'orders' && user) {
      fetchOrders();
    }
  }, [activeTab, user]);

  // Fetch saved vehicles
  useEffect(() => {
    const fetchSavedVehicles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/saved-vehicles', {
          headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error('Failed to fetch saved vehicles');
        const data = await response.json();
        setSavedVehicles(data);
      } catch (err) {
        console.error('Saved vehicles fetch error:', err);
        setError('Failed to load saved vehicles');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'saved' && user) {
      fetchSavedVehicles();
    }
  }, [activeTab, user]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/messages', {
          headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        console.error('Messages fetch error:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'messages' && user) {
      fetchMessages();
    }
  }, [activeTab, user]);

  // Fetch thread messages
  useEffect(() => {
    const fetchThreadMessages = async () => {
      if (!selectedThreadId) return;
      try {
        const response = await fetch(`/api/user/messages/${selectedThreadId}`, {
          headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error('Failed to fetch thread');
        const data = await response.json();
        setThreadMessages(data);
      } catch (err) {
        console.error('Thread fetch error:', err);
      }
    };

    if (selectedThreadId) {
      fetchThreadMessages();
    }
  }, [selectedThreadId]);

  // Handle logout
  const handleLogout = () => {
    userLogout();
    navigate('/');
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const endpoint = selectedThreadId
        ? `/api/user/messages/${selectedThreadId}/reply`
        : '/api/user/messages';

      const payload = selectedThreadId
        ? { message: newMessage }
        : { subject: messageSubject, message: newMessage };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setNewMessage('');
      setMessageSubject('');

      // Refresh messages
      const messagesResponse = await fetch('/api/user/messages', {
        headers: getAuthHeader(),
      });
      const data = await messagesResponse.json();
      setMessages(data);
    } catch (err) {
      console.error('Send message error:', err);
      setError('Failed to send message');
    }
  };

  // Handle remove saved vehicle
  const handleRemoveSavedVehicle = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/user/saved-vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!response.ok) throw new Error('Failed to remove vehicle');

      setSavedVehicles(savedVehicles.filter((v) => v._id !== vehicleId));
    } catch (err) {
      console.error('Remove vehicle error:', err);
      setError('Failed to remove vehicle');
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Sidebar - Desktop */}
      <aside
        className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-64px)] w-[240px] overflow-y-auto"
        style={{
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--border-subtle)',
        }}
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Customer Profile
              </p>
            </div>
          </div>
        </div>

        <nav className="px-3 pb-6">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                setSelectedThreadId(null);
              }}
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

      {/* Mobile menu */}
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
          <ChevronRight
            size={16}
            className={`transition-transform ${mobileMenuOpen ? 'rotate-90' : ''}`}
          />
        </button>
        {mobileMenuOpen && (
          <nav
            style={{
              backgroundColor: 'var(--surface)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setActiveTab(item.key);
                  setMobileMenuOpen(false);
                  setSelectedThreadId(null);
                }}
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
          </nav>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-[240px] pt-16 lg:pt-0">
        <div className="p-6 md:p-10 mt-12 lg:mt-0">
          {error && (
            <div
              className="mb-6 p-4 rounded-lg flex items-center gap-3"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}
            >
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
                My Orders
              </h2>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                Track your vehicles from auction to delivery.
              </p>

              {loading ? (
                <div className="mt-8 flex justify-center">
                  <Loader size={32} className="animate-spin" style={{ color: 'var(--amber)' }} />
                </div>
              ) : orders.length === 0 ? (
                <div className="mt-8 p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--surface)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No orders yet. Start browsing vehicles!</p>
                </div>
              ) : (
                <div className="mt-8 space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="rounded-xl p-6"
                      style={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-semibold" style={{ color: 'var(--amber)' }}>
                          #{order.orderId}
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${statusColorMap[order.status]}20`,
                            color: statusColorMap[order.status],
                          }}
                        >
                          {order.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Vehicle */}
                      <div className="flex items-center gap-4 mt-4">
                        <img
                          src={order.vehicleId.images[0]}
                          alt={order.vehicleId.modelName}
                          className="w-20 h-14 rounded-lg object-cover"
                        />
                        <div>
                          <p style={{ color: 'var(--text-primary)' }}>
                            {order.vehicleId.year} {order.vehicleId.make} {order.vehicleId.modelName}
                          </p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Grade {order.vehicleId.grade}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
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
                              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                              style={{
                                left: `${(i / (order.trackingSteps.length - 1)) * 100}%`,
                                transform: 'translate(-50%, -50%)',
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
                              className="text-label"
                              style={{
                                color: step.done ? 'var(--amber)' : step.active ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontSize: '0.65rem',
                              }}
                            >
                              {step.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Shipment details */}
                      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          <Truck size={14} />
                          <span>
                            {order.vessel && `Vessel: ${order.vessel}`}
                            {order.vessel && order.container && ' · '}
                            {order.container && `Container: ${order.container}`}
                            {(order.vessel || order.container) && order.eta && ' · '}
                            {order.eta && order.eta}
                          </span>
                        </div>
                      </div>

                      {/* Documents */}
                      {order.documents.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            Documents ({order.documents.length})
                          </p>
                          <div className="mt-2 space-y-2">
                            {order.documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded transition-colors"
                                style={{
                                  backgroundColor: 'var(--surface-light)',
                                  color: 'var(--amber)',
                                }}
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

          {/* Saved Vehicles Tab */}
          {activeTab === 'saved' && (
            <div>
              <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
                Saved Vehicles
              </h2>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                Vehicles you've bookmarked for later.
              </p>
              {loading ? (
                <div className="mt-8 flex justify-center">
                  <Loader size={32} className="animate-spin" style={{ color: 'var(--amber)' }} />
                </div>
              ) : savedVehicles.length === 0 ? (
                <div className="mt-8 p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--surface)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No saved vehicles yet.</p>
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedVehicles.map((v) => (
                    <div
                      key={v._id}
                      className="rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <img
                        src={v.images[0]}
                        alt={v.modelName}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-4">
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {v.year} {v.make} {v.modelName}
                        </p>
                        <p className="mt-1 text-price" style={{ color: 'var(--amber)', fontSize: '1.1rem' }}>
                          From ${v.price.toLocaleString()}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Link
                            to={`/vehicle/${v._id}`}
                            className="flex-1 inline-flex items-center justify-center gap-1 text-sm transition-colors py-2 rounded"
                            style={{ color: 'var(--amber)', backgroundColor: 'var(--amber-dim)' }}
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleRemoveSavedVehicle(v._id)}
                            className="flex-1 inline-flex items-center justify-center gap-1 text-sm transition-colors py-2 rounded"
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

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
                  Messages
                </h2>
                <p className="mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Contact support
                </p>

                {loading ? (
                  <div className="flex justify-center">
                    <Loader size={24} className="animate-spin" style={{ color: 'var(--amber)' }} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        No messages yet.
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <button
                          key={msg.threadId}
                          onClick={() => setSelectedThreadId(msg.threadId)}
                          className="w-full text-left p-3 rounded-lg transition-colors"
                          style={{
                            backgroundColor:
                              selectedThreadId === msg.threadId ? 'var(--surface-light)' : 'var(--surface)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            {msg.senderName}
                          </p>
                          <p
                            className="text-xs mt-1 truncate"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {msg.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2">
                {selectedThreadId ? (
                  <div
                    className="rounded-xl p-6 h-full flex flex-col"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                      {threadMessages.map((msg) => (
                        <div
                          key={msg._id}
                          className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className="max-w-xs p-3 rounded-lg"
                            style={{
                              backgroundColor:
                                msg.sender === 'customer' ? 'var(--amber)' : 'var(--surface-light)',
                              color:
                                msg.sender === 'customer' ? 'white' : 'var(--text-primary)',
                            }}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p
                              className="text-xs mt-1"
                              style={{
                                color:
                                  msg.sender === 'customer' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                              }}
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
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: 'var(--bg)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg flex items-center gap-2"
                        style={{ backgroundColor: 'var(--amber)', color: 'white' }}
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div
                    className="rounded-xl p-6 h-full flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Select a message thread or start a new one
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
                Account Settings
              </h2>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                Manage your profile information
              </p>

              {userProfile && (
                <div className="mt-8 max-w-2xl space-y-6">
                  <div
                    className="rounded-xl p-6"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Profile Information
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Email
                        </label>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                          {userProfile.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Name
                        </label>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                          {userProfile.firstName} {userProfile.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Phone
                        </label>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                          {userProfile.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Country
                        </label>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                          {userProfile.country || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
                Documents
              </h2>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                All your order documents in one place
              </p>

              {orders.length === 0 ? (
                <div className="mt-8 p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--surface)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No documents available yet.</p>
                </div>
              ) : (
                <div className="mt-8 space-y-4">
                  {orders.flatMap((order) =>
                    order.documents.map((doc, idx) => (
                      <div
                        key={`${order._id}-${idx}`}
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <FileText size={18} style={{ color: 'var(--amber)' }} />
                          <div>
                            <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                              {doc.name}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                              Order #{order.orderId}
                            </p>
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
        </div>
      </main>
    </div>
  );
}
