import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import AdminReview from './pages/AdminReview';
import AdminAddVehicle from './pages/AdminAddVehicle';
import VehicleDetail from './pages/VehicleDetail';
import Dashboard from './pages/Dashboard';
import Destinations from './pages/Destinations';
import HowItWorks from './pages/HowItWorks';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
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
  if (pathname.startsWith('/admin')) return null;
  return <Navbar />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <ConditionalNavbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/vehicle/:id" element={<VehicleDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/how-it-works" element={<HowItWorks />} />

        {/* Admin routes — nested under AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="review" element={<AdminReview />} />
          <Route path="add-vehicle" element={<AdminAddVehicle />} />
          <Route path="crawl" element={<AdminCrawlMonitor />} />
        </Route>
      </Routes>
    </>
  );
}