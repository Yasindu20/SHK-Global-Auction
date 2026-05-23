import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ClipboardList,
    PlusCircle,
    Radio,
    Settings,
    ChevronLeft,
    ChevronRight,
    Bell,
    Search,
    LogOut,
    Globe,
    Car,
    CheckCircle,
    Clock,
    Menu,
    X,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Stats {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string | number;
    badgeColor?: string;
}

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [crawlRunning, setCrawlRunning] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API}/api/stats`)
            .then(r => r.json())
            .then(setStats)
            .catch(() => { });

        fetch(`${API}/api/crawl-status`)
            .then(r => r.json())
            .then(d => setCrawlRunning(d.running))
            .catch(() => { });

        const interval = setInterval(() => {
            fetch(`${API}/api/crawl-status`)
                .then(r => r.json())
                .then(d => setCrawlRunning(d.running))
                .catch(() => { });
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const navItems: NavItem[] = [
        {
            label: 'Dashboard',
            href: '/admin',
            icon: LayoutDashboard,
        },
        {
            label: 'Review Queue',
            href: '/admin/review',
            icon: ClipboardList,
            badge: stats?.pending || undefined,
            badgeColor: stats?.pending ? '#ef4444' : undefined,
        },
        {
            label: 'Add Vehicle',
            href: '/admin/add-vehicle',
            icon: PlusCircle,
        },
        {
            label: 'Crawl Monitor',
            href: '/admin/crawl',
            icon: Radio,
            badge: crawlRunning ? 'Live' : undefined,
            badgeColor: crawlRunning ? '#22c55e' : undefined,
        },
    ];

    const bottomNavItems: NavItem[] = [
        {
            label: 'Settings',
            href: '/admin/settings',
            icon: Settings,
        },
    ];

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/admin') return 'Dashboard';
        if (path === '/admin/review') return 'Review Queue';
        if (path === '/admin/add-vehicle') return 'Add Vehicle';
        if (path === '/admin/crawl') return 'Crawl Monitor';
        if (path === '/admin/settings') return 'Settings';
        return 'Admin';
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div
                className="flex items-center gap-3 px-4 py-5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #D4A853 0%, #B8860B 100%)' }}
                >
                    <Globe size={16} className="text-black" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col min-w-0">
                        <span className="text-white font-semibold text-sm leading-tight tracking-tight">
                            SHK Global
                        </span>
                        <span style={{ color: '#6B7280', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                            Admin Console
                        </span>
                    </div>
                )}
            </div>

            {/* Compact stats strip */}
            {!collapsed && stats && (
                <div
                    className="grid grid-cols-3 gap-px mx-3 my-3 rounded-lg overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                    {[
                        { label: 'Total', value: stats.total, color: '#D4A853', Icon: Car },
                        { label: 'Pending', value: stats.pending, color: '#F59E0B', Icon: Clock },
                        { label: 'Live', value: stats.approved, color: '#22C55E', Icon: CheckCircle },
                    ].map(({ label, value, color, Icon }) => (
                        <div
                            key={label}
                            className="flex flex-col items-center py-2.5 px-1"
                            style={{ background: 'rgba(255,255,255,0.03)' }}
                        >
                            <span style={{ color, marginBottom: 3 }}>
                                <Icon size={14} />
                            </span>
                            <span className="font-bold text-sm text-white leading-none">{value}</span>
                            <span style={{ color: '#6B7280', fontSize: '0.6rem', marginTop: 2 }}>{label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Nav section label */}
            {!collapsed && (
                <div className="px-4 mb-1">
                    <span style={{ color: '#4B5563', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
                        Navigation
                    </span>
                </div>
            )}

            {/* Main nav */}
            <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
                {navItems.map((item) => {
                    const isExact = item.href === '/admin';
                    const isActive = isExact
                        ? location.pathname === '/admin'
                        : location.pathname.startsWith(item.href);

                    return (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            end={isExact}
                            onClick={() => setMobileSidebarOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative"
                            style={{
                                background: isActive ? 'rgba(212,168,83,0.12)' : 'transparent',
                                color: isActive ? '#D4A853' : '#9CA3AF',
                                textDecoration: 'none',
                            }}
                            onMouseEnter={e => {
                                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={e => {
                                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                                    style={{ background: '#D4A853' }}
                                />
                            )}
                            <span style={{ color: isActive ? '#D4A853' : '#6B7280' }} className="flex-shrink-0">
                                <item.icon size={17} />
                            </span>
                            {!collapsed && (
                                <>
                                    <span className="text-sm font-medium flex-1 whitespace-nowrap">{item.label}</span>
                                    {item.badge !== undefined && (
                                        <span
                                            className="px-1.5 py-0.5 rounded text-xs font-bold"
                                            style={{
                                                background: item.badgeColor ? `${item.badgeColor}22` : 'rgba(255,255,255,0.08)',
                                                color: item.badgeColor || '#9CA3AF',
                                                fontSize: '0.65rem',
                                                letterSpacing: '0.03em',
                                            }}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                            {collapsed && item.badge !== undefined && (
                                <div
                                    className="absolute top-1 right-1 w-2 h-2 rounded-full"
                                    style={{ background: item.badgeColor || '#9CA3AF' }}
                                />
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Divider */}
            <div className="mx-3 my-2" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

            {/* Bottom nav */}
            <div className="px-2 pb-2 space-y-0.5">
                {bottomNavItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    return (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileSidebarOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
                            style={{
                                background: isActive ? 'rgba(212,168,83,0.12)' : 'transparent',
                                color: isActive ? '#D4A853' : '#6B7280',
                                textDecoration: 'none',
                            }}
                            onMouseEnter={e => {
                                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={e => {
                                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                        >
                            <LogOut size={17} className="flex-shrink-0" />
                            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                        </NavLink>
                    );
                })}

                {/* Back to site */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-150"
                    style={{ color: '#6B7280' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                    <LogOut size={17} style={{ flexShrink: 0 }} />
                    {!collapsed && <span className="text-sm font-medium">Back to Site</span>}
                </button>
            </div>

            {/* User */}
            {!collapsed && (
                <div
                    className="mx-3 mb-3 p-3 rounded-lg flex items-center gap-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
                        style={{ background: 'rgba(212,168,83,0.2)', color: '#D4A853' }}
                    >
                        AD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white leading-tight truncate">Admin</p>
                        <p className="text-xs leading-tight truncate" style={{ color: '#6B7280' }}>admin@shkglobal.com</p>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen flex" style={{ background: '#0A0A0A' }}>
            {/* Desktop Sidebar */}
            <aside
                className="hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 transition-all duration-300"
                style={{
                    width: collapsed ? 64 : 240,
                    background: '#111111',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <SidebarContent />

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center z-50 transition-colors"
                    style={{
                        background: '#1F1F1F',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#6B7280',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#D4A853')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-50"
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                    onClick={() => setMobileSidebarOpen(false)}
                >
                    <aside
                        className="absolute left-0 top-0 h-full w-64 flex flex-col"
                        style={{ background: '#111111' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <SidebarContent />
                        <button
                            onClick={() => setMobileSidebarOpen(false)}
                            className="absolute top-4 right-4 p-1 rounded-md"
                            style={{ color: '#6B7280' }}
                        >
                            <X size={18} />
                        </button>
                    </aside>
                </div>
            )}

            {/* Main content */}
            <main
                className="flex-1 flex flex-col min-h-screen transition-all duration-300"
                style={{ marginLeft: collapsed ? 64 : 240 }}
            >
                {/* Top Header */}
                <header
                    className="sticky top-0 z-30 flex items-center justify-between px-6 h-14"
                    style={{
                        background: 'rgba(10,10,10,0.9)',
                        backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    {/* Left: Mobile menu + Breadcrumb */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="lg:hidden p-1.5 rounded-md"
                            style={{ color: '#6B7280' }}
                        >
                            <Menu size={18} />
                        </button>
                        <div className="flex items-center gap-2">
                            <span style={{ color: '#4B5563', fontSize: '0.8rem' }}>Admin</span>
                            <span style={{ color: '#374151' }}>/</span>
                            <span className="font-medium text-sm text-white">{getPageTitle()}</span>
                        </div>
                    </div>

                    {/* Right: Search + Notifications + Status */}
                    <div className="flex items-center gap-2">
                        {/* Crawl status pill */}
                        {crawlRunning && (
                            <div
                                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                                style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Crawl Active
                            </div>
                        )}

                        {/* Search */}
                        <button
                            onClick={() => setSearchOpen(!searchOpen)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#6B7280' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#D4A853')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                        >
                            <Search size={16} />
                        </button>

                        {/* Notifications */}
                        <button
                            className="relative p-2 rounded-lg transition-colors"
                            style={{ color: '#6B7280' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#D4A853')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                        >
                            <Bell size={16} />
                            {stats?.pending ? (
                                <span
                                    className="absolute top-1 right-1 w-2 h-2 rounded-full"
                                    style={{ background: '#EF4444' }}
                                />
                            ) : null}
                        </button>

                        {/* Avatar */}
                        <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
                            style={{ background: 'rgba(212,168,83,0.2)', color: '#D4A853' }}
                        >
                            AD
                        </div>
                    </div>
                </header>

                {/* Search bar */}
                {searchOpen && (
                    <div
                        className="px-6 py-3"
                        style={{ background: '#111111', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div className="relative max-w-lg">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
                            <input
                                autoFocus
                                placeholder="Search vehicles, stock IDs, suppliers…"
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#F9FAFB',
                                }}
                                onBlur={() => setSearchOpen(false)}
                            />
                        </div>
                    </div>
                )}

                {/* Page content */}
                <div className="flex-1 p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}