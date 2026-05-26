import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Shield, AlertCircle, Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminLogin, isAdminAuthenticated } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Redirect if already authenticated
  const from = (location.state as any)?.from?.pathname || '/admin';
  useEffect(() => {
    if (isAdminAuthenticated) navigate(from, { replace: true });
  }, [isAdminAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isLocked) return;

    setLoading(true);
    setError('');

    const result = await adminLogin(email.trim().toLowerCase(), password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      if (result.error?.toLowerCase().includes('locked')) {
        setIsLocked(true);
        setError(result.error || 'Account locked.');
      } else {
        setError(result.error || 'Invalid credentials');
        if (typeof result.attemptsRemaining === 'number') {
          setAttemptsRemaining(result.attemptsRemaining);
        }
      }
      setPassword('');
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #070707 0%, #0F0D0A 50%, #070707 100%)' }}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(212,168,83,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,168,83,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Login card */}
      <div
        className="relative w-full max-w-md mx-4"
        style={{
          background: 'rgba(16, 14, 10, 0.95)',
          border: '1px solid rgba(212,168,83,0.15)',
          borderRadius: '16px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,168,83,0.1)',
        }}
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px"
          style={{
            width: '60%',
            background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.6), transparent)',
          }}
        />

        <div className="p-10">
          {/* Shield icon + branding */}
          <div className="flex flex-col items-center mb-10">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,83,0.15) 0%, rgba(212,168,83,0.05) 100%)',
                border: '1px solid rgba(212,168,83,0.2)',
              }}
            >
              <Shield size={26} style={{ color: '#D4A853' }} />
            </div>

            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: '#F5F0EB', letterSpacing: '-0.02em' }}
            >
              Admin Console
            </h1>
            <p
              className="text-sm mt-1.5"
              style={{ color: '#6B7280' }}
            >
              SHK Global · Secure Access
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl mb-6"
              style={{
                background: isLocked
                  ? 'rgba(239,68,68,0.08)'
                  : 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <AlertCircle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-sm" style={{ color: '#FCA5A5' }}>
                  {error}
                </p>
                {attemptsRemaining !== null && !isLocked && (
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                    {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lockout
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium mb-2"
                style={{ color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#4B5563' }}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLocked || loading}
                  autoComplete="email"
                  placeholder="admin@yourdomain.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#F5F0EB',
                    caretColor: '#D4A853',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(212,168,83,0.4)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium mb-2"
                style={{ color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#4B5563' }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLocked || loading}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#F5F0EB',
                    caretColor: '#D4A853',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(212,168,83,0.4)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: showPassword ? '#D4A853' : '#4B5563' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || isLocked || !email || !password}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all mt-2"
              style={{
                background: loading || isLocked
                  ? 'rgba(212,168,83,0.3)'
                  : 'linear-gradient(135deg, #D4A853 0%, #B8860B 100%)',
                color: '#0A0A0A',
                cursor: loading || isLocked ? 'not-allowed' : 'pointer',
                boxShadow: loading || isLocked ? 'none' : '0 4px 20px rgba(212,168,83,0.25)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: '#0A0A0A', borderTopColor: 'transparent' }}
                  />
                  Verifying…
                </span>
              ) : isLocked ? (
                'Account Locked'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-center text-xs" style={{ color: '#374151' }}>
              🔒 This session is monitored for security. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>

      {/* Invisible security: no "forgot password" link, no signup link, no hints */}
    </div>
  );
}