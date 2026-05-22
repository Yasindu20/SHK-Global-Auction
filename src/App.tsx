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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/vehicle/:id" element={<VehicleDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/review" element={<AdminReview />} />
        <Route path="/admin/add-vehicle" element={<AdminAddVehicle />} />
      </Routes>
    </>
  );
}