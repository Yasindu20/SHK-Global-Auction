import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AuthContext';

/**
 * Wraps admin routes. Redirects to /admin/login if not authenticated.
 * Shows a loading state while checking auth to prevent flash of unauthorized content.
 */
export default function ProtectedAdminRoute() {
  const { isAdminAuthenticated, isAdminLoading } = useAdminAuth();
  const location = useLocation();

  if (isAdminLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0A0A0A' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#D4A853', borderTopColor: 'transparent' }}
          />
          <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            Verifying session…
          </span>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    // Pass the attempted location so we can redirect back after login
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}