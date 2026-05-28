import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Types ──────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'superadmin';
}

interface CustomerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer';
}

interface AdminAuthState {
  admin: AdminUser | null;
  adminToken: string | null;
  isAdminAuthenticated: boolean;
  isAdminLoading: boolean;
}

interface CustomerAuthState {
  user: CustomerUser | null;
  userToken: string | null;
  isUserAuthenticated: boolean;
  isUserLoading: boolean;
}

interface AuthContextType extends AdminAuthState, CustomerAuthState {
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; attemptsRemaining?: number }>;
  adminLogout: () => Promise<void>;
  userLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  userRegister: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  userLogout: () => Promise<void>;
  refreshAdminToken: () => Promise<boolean>;
  getAdminAuthHeader: () => Record<string, string>;
  getUserAuthHeader: () => Record<string, string>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country?: string;
  phone?: string;
}

// ── Context ────────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Access tokens stored in memory (not localStorage — prevents XSS theft)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // Refresh timer refs
  const adminRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Admin token refresh ──────────────────────────────────────────────────────
  const refreshAdminToken = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/api/auth/admin/refresh`, {
        method: 'POST',
        credentials: 'include', // sends HttpOnly cookie automatically
      });

      if (!res.ok) {
        setAdminToken(null);
        setAdmin(null);
        return false;
      }

      const data = await res.json();
      setAdminToken(data.accessToken);

      // Schedule next refresh 1 minute before expiry (access token = 15min)
      scheduleAdminRefresh(14 * 60 * 1000);
      return true;
    } catch {
      setAdminToken(null);
      setAdmin(null);
      return false;
    }
  }, []);

  const scheduleAdminRefresh = (delayMs: number) => {
    if (adminRefreshTimer.current) clearTimeout(adminRefreshTimer.current);
    adminRefreshTimer.current = setTimeout(async () => {
      await refreshAdminToken();
    }, delayMs);
  };

  // ── User token refresh ───────────────────────────────────────────────────────
  const refreshUserToken = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/api/auth/user/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        setUserToken(null);
        setUser(null);
        return false;
      }

      const data = await res.json();
      setUserToken(data.accessToken);

      // Schedule next refresh 5 minutes before expiry (user token = 30min)
      scheduleUserRefresh(25 * 60 * 1000);
      return true;
    } catch {
      setUserToken(null);
      setUser(null);
      return false;
    }
  }, []);

  const scheduleUserRefresh = (delayMs: number) => {
    if (userRefreshTimer.current) clearTimeout(userRefreshTimer.current);
    userRefreshTimer.current = setTimeout(async () => {
      await refreshUserToken();
    }, delayMs);
  };

  // ── On mount: attempt silent token refresh from cookies ───────────────────
  useEffect(() => {
    const initAdmin = async () => {
      setIsAdminLoading(true);
      const ok = await refreshAdminToken();
      if (ok) {
        // Fetch admin profile
        try {
          const res = await fetch(`${API}/api/auth/admin/me`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          });
          // Note: token may not be in state yet — use the flag
          if (res.ok) {
            const data = await res.json();
            setAdmin(data);
          }
        } catch (_) {}
      }
      setIsAdminLoading(false);
    };

    const initUser = async () => {
      setIsUserLoading(true);
      await refreshUserToken();
      setIsUserLoading(false);
    };

    initAdmin();
    initUser();

    return () => {
      if (adminRefreshTimer.current) clearTimeout(adminRefreshTimer.current);
      if (userRefreshTimer.current) clearTimeout(userRefreshTimer.current);
    };
  }, []);

  // Fetch admin profile once token is set
  useEffect(() => {
    if (!adminToken || admin) return;

    fetch(`${API}/api/auth/admin/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setAdmin(data);
      })
      .catch(() => {});
  }, [adminToken]);

  // ── Auth actions ──────────────────────────────────────────────────────────────

  const adminLogin = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // to receive HttpOnly cookie
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Login failed',
          attemptsRemaining: data.attemptsRemaining,
        };
      }

      setAdminToken(data.accessToken);
      setAdmin(data.admin);
      scheduleAdminRefresh(14 * 60 * 1000);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const adminLogout = async () => {
    if (adminRefreshTimer.current) clearTimeout(adminRefreshTimer.current);

    try {
      await fetch(`${API}/api/auth/admin/logout`, {
        method: 'POST',
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        credentials: 'include',
      });
    } catch (_) {}

    setAdminToken(null);
    setAdmin(null);
  };

  const userLogin = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API}/api/auth/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setUserToken(data.accessToken);
      setUser(data.user);
      scheduleUserRefresh(25 * 60 * 1000);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const userRegister = async (formData: RegisterData) => {
    try {
      const res = await fetch(`${API}/api/auth/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      setUserToken(data.accessToken);
      setUser(data.user);
      scheduleUserRefresh(25 * 60 * 1000);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const userLogout = async () => {
    if (userRefreshTimer.current) clearTimeout(userRefreshTimer.current);

    try {
      await fetch(`${API}/api/auth/user/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (_) {}

    setUserToken(null);
    setUser(null);
  };

  const getAdminAuthHeader = (): Record<string, string> => {
    return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
  };

  const getUserAuthHeader = (): Record<string, string> => {
    return userToken ? { Authorization: `Bearer ${userToken}` } : {};
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        adminToken,
        isAdminAuthenticated: !!admin && !!adminToken,
        isAdminLoading,
        user,
        userToken,
        isUserAuthenticated: !!user && !!userToken,
        isUserLoading,
        adminLogin,
        adminLogout,
        userLogin,
        userRegister,
        userLogout,
        refreshAdminToken,
        getAdminAuthHeader,
        getUserAuthHeader,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ── Convenience hooks ─────────────────────────────────────────────────────────
export const useAdminAuth = () => {
  const { admin, adminToken, isAdminAuthenticated, isAdminLoading, adminLogin, adminLogout, getAdminAuthHeader } = useAuth();
  return { admin, adminToken, isAdminAuthenticated, isAdminLoading, adminLogin, adminLogout, getAdminAuthHeader };
};

export const useCustomerAuth = () => {
  const { user, userToken, isUserAuthenticated, isUserLoading, userLogin, userRegister, userLogout, getUserAuthHeader } = useAuth();
  return { user, userToken, isUserAuthenticated, isUserLoading, userLogin, userRegister, userLogout, getUserAuthHeader };
};