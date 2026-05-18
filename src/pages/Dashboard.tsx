import { useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { vehicles } from '../data/vehicles';

const navItems = [
  { icon: Package, label: 'My Orders', key: 'orders' },
  { icon: Heart, label: 'Saved Vehicles', key: 'saved' },
  { icon: FileText, label: 'Documents', key: 'documents' },
  { icon: Ship, label: 'Shipping', key: 'shipping' },
  { icon: MessageSquare, label: 'Messages', key: 'messages' },
  { icon: Settings, label: 'Settings', key: 'settings' },
];

const orders = [
  {
    id: 'JD-2025-0847',
    vehicle: vehicles[0],
    status: 'In Transit',
    statusColor: 'var(--amber)',
    steps: [
      { label: 'Purchased', done: true },
      { label: 'Shipped', done: true },
      { label: 'In Transit', done: true, active: true },
      { label: 'Delivered', done: false },
    ],
    vessel: 'MSC Tokyo',
    container: 'MSCU-4829137',
    eta: 'March 28, 2025',
  },
  {
    id: 'JD-2025-0801',
    vehicle: vehicles[1],
    status: 'Delivered',
    statusColor: 'var(--success)',
    steps: [
      { label: 'Purchased', done: true },
      { label: 'Shipped', done: true },
      { label: 'In Transit', done: true },
      { label: 'Delivered', done: true, active: true },
    ],
    vessel: 'ONE Continuity',
    container: 'ONEU-7753210',
    eta: 'Delivered March 10, 2025',
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              JM
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                John Mwangi
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Customer since 2023
              </p>
            </div>
          </div>
        </div>

        <nav className="px-3 pb-6">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
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
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
                My Orders
              </h2>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                Track your vehicles from auction to delivery.
              </p>

              <div className="mt-8 space-y-6">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl p-6"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-semibold" style={{ color: 'var(--amber)' }}>
                        #{order.id}
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: order.status === 'Delivered'
                            ? 'rgba(74, 222, 128, 0.15)'
                            : 'rgba(212, 168, 83, 0.15)',
                          color: order.statusColor,
                        }}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Vehicle */}
                    <div className="flex items-center gap-4 mt-4">
                      <img
                        src={order.vehicle.image}
                        alt={order.vehicle.model}
                        className="w-20 h-14 rounded-lg object-cover"
                      />
                      <div>
                        <p style={{ color: 'var(--text-primary)' }}>
                          {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          Grade {order.vehicle.grade}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-6">
                      <div className="relative h-1 rounded-full" style={{ backgroundColor: 'var(--surface-light)' }}>
                        <div
                          className="absolute top-0 left-0 h-full rounded-full transition-all"
                          style={{
                            width: `${(order.steps.filter((s) => s.done).length / order.steps.length) * 100}%`,
                            backgroundColor: 'var(--amber)',
                          }}
                        />
                        {order.steps.map((step, i) => (
                          <div
                            key={i}
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                            style={{
                              left: `${(i / (order.steps.length - 1)) * 100}%`,
                              transform: 'translate(-50%, -50%)',
                              backgroundColor: step.done ? 'var(--amber)' : 'var(--surface-light)',
                              border: `2px solid ${step.done ? 'var(--amber)' : 'var(--border-subtle)'}`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-2">
                        {order.steps.map((step, i) => (
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
                          Vessel: {order.vessel} · Container: {order.container} · {order.eta}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6 mt-4">
                      <a
                        href="#"
                        className="text-sm font-medium transition-colors"
                        style={{ color: 'var(--amber)' }}
                      >
                        Track Shipment
                      </a>
                      <a
                        href="#"
                        className="text-sm transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        View Documents
                      </a>
                      <a
                        href="#"
                        className="text-sm transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Contact Support
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div>
              <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
                Saved Vehicles
              </h2>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                Vehicles you've bookmarked for later.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.slice(0, 3).map((v) => (
                  <div
                    key={v.id}
                    className="rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <img
                      src={v.image}
                      alt={v.model}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-4">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="mt-1 text-price" style={{ color: 'var(--amber)', fontSize: '1.1rem' }}>
                        From ${v.startingBid.toLocaleString()}
                      </p>
                      <Link
                        to={`/vehicle/${v.id}`}
                        className="inline-flex items-center gap-1 mt-3 text-sm transition-colors"
                        style={{ color: 'var(--amber)' }}
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
                Documents
              </h2>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                Your export and shipping documents.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  { name: 'Bill of Lading - JD-2025-0847', type: 'PDF', date: 'Mar 15, 2025' },
                  { name: 'Export Certificate - JD-2025-0847', type: 'PDF', date: 'Mar 12, 2025' },
                  { name: 'Invoice - JD-2025-0847', type: 'PDF', date: 'Mar 10, 2025' },
                  { name: 'Insurance Certificate - JD-2025-0847', type: 'PDF', date: 'Mar 14, 2025' },
                ].map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} style={{ color: 'var(--amber)' }} />
                      <div>
                        <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{doc.name}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{doc.date}</p>
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: 'var(--amber-dim)', color: 'var(--amber)' }}
                    >
                      {doc.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {['shipping', 'messages', 'settings'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--surface-light)' }}
              >
                <CheckCircle size={24} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <h3 className="text-h3" style={{ color: 'var(--text-primary)' }}>
                Coming Soon
              </h3>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                This section is under development.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
