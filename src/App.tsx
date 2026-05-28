import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import VehicleDetail from './pages/VehicleDetail';
import CustomerProfile from './pages/CustomerProfile';
import Destinations from './pages/Destinations';
import HowItWorks from './pages/HowItWorks';
import CustomerAuth from './pages/CustomerAuth';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminReview from './pages/AdminReview';
import AdminAddVehicle from './pages/AdminAddVehicle';
import AdminCrawlMonitor from './pages/AdminCrawlMonitor';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ConditionalNavbar() {
  const { pathname } = useLocation();
  // Hide navbar on admin pages and auth pages
  if (pathname.startsWith('/admin') || pathname === '/auth') return null;
  return <Navbar />;
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <ConditionalNavbar />
      <Routes>
        {/* ── Public routes ──────────────────────────────────────────── */}
        <Route path="/" element={<Home />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/vehicle/:id" element={<VehicleDetail />} />
        <Route path="/dashboard" element={<CustomerProfile />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/how-it-works" element={<HowItWorks />} />

        {/* ── Customer auth ──────────────────────────────────────────── */}
        <Route path="/auth" element={<CustomerAuth />} />

        {/* ── Admin login (public, but hidden from nav) ──────────────── */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ── Protected admin routes ─────────────────────────────────── */}
        {/*
          All /admin/* routes are wrapped in ProtectedAdminRoute.
          If no valid admin JWT, the user is redirected to /admin/login.
          The admin panel URL is not linked anywhere in the public UI.
        */}
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="review" element={<AdminReview />} />
            <Route path="add-vehicle" element={<AdminAddVehicle />} />
            <Route path="crawl" element={<AdminCrawlMonitor />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}