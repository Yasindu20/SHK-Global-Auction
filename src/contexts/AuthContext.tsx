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

  // Keep a ref so callbacks always see the latest token without stale closures
  const adminTokenRef = useRef<string | null>(null);
  const userTokenRef = useRef<string | null>(null);

  // Refresh timer refs
  const adminRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync with state
  useEffect(() => { adminTokenRef.current = adminToken; }, [adminToken]);
  useEffect(() => { userTokenRef.current = userToken; }, [userToken]);

  // ── Admin token refresh ──────────────────────────────────────────────────────
  const refreshAdminToken = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/api/auth/admin/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        setAdminToken(null);
        setAdmin(null);
        adminTokenRef.current = null;
        return false;
      }

      const data = await res.json();
      const token: string = data.accessToken;
      setAdminToken(token);
      adminTokenRef.current = token;

      // Fetch admin profile with the freshly received token (no stale closure)
      try {
        const profileRes = await fetch(`${API}/api/auth/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setAdmin(profileData);
        }
      } catch {
        // Profile fetch failing doesn't invalidate the token
      }

      scheduleAdminRefresh(14 * 60 * 1000);
      return true;
    } catch {
      setAdminToken(null);
      setAdmin(null);
      adminTokenRef.current = null;
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        userTokenRef.current = null;
        return false;
      }

      const data = await res.json();
      const token: string = data.accessToken;
      setUserToken(token);
      userTokenRef.current = token;

      scheduleUserRefresh(25 * 60 * 1000);
      return true;
    } catch {
      setUserToken(null);
      setUser(null);
      userTokenRef.current = null;
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await refreshAdminToken(); // profile fetch is now inside refreshAdminToken
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth actions ──────────────────────────────────────────────────────────────

  const adminLogin = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

      const token: string = data.accessToken;
      setAdminToken(token);
      adminTokenRef.current = token;
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
      const token = adminTokenRef.current;
      await fetch(`${API}/api/auth/admin/logout`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
    } catch {
      // ignore
    }

    setAdminToken(null);
    setAdmin(null);
    adminTokenRef.current = null;
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

      const token: string = data.accessToken;
      setUserToken(token);
      userTokenRef.current = token;
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

      const token: string = data.accessToken;
      setUserToken(token);
      userTokenRef.current = token;
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
    } catch {
      // ignore
    }

    setUserToken(null);
    setUser(null);
    userTokenRef.current = null;
  };

  // Always read from ref so callers get the latest token synchronously
  const getAdminAuthHeader = (): Record<string, string> => {
    const token = adminTokenRef.current;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getUserAuthHeader = (): Record<string, string> => {
    const token = userTokenRef.current;
    return token ? { Authorization: `Bearer ${token}` } : {};
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