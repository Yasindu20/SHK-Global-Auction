import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomerAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Globe, AlertCircle, CheckCircle2, User, Mail, Lock, Phone, MapPin } from 'lucide-react';

type Tab = 'login' | 'register';

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#F5F0EB',
  caretColor: '#D4A853',
};

const INPUT_FOCUS_BORDER = 'rgba(212,168,83,0.4)';
const INPUT_BLUR_BORDER = 'rgba(255,255,255,0.08)';

function FloatingInput({
  id, label, type = 'text', value, onChange, placeholder, disabled, icon: Icon, rightSlot
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  disabled?: boolean; icon: React.ElementType; rightSlot?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-2"
        style={{ color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div className="relative">
        <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4B5563' }} />
        <input
          id={id} type={type} value={value} required disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
          style={{ ...INPUT_STYLE, paddingRight: rightSlot ? '3rem' : undefined }}
          onFocus={(e) => (e.target.style.borderColor = INPUT_FOCUS_BORDER)}
          onBlur={(e) => (e.target.style.borderColor = INPUT_BLUR_BORDER)}
        />
        {rightSlot && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="grid grid-cols-2 gap-1.5 mt-2">
      {checks.map(({ label, ok }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ background: ok ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${ok ? '#22C55E' : 'rgba(255,255,255,0.08)'}` }}>
            {ok && <span style={{ color: '#22C55E', fontSize: '8px' }}>✓</span>}
          </div>
          <span className="text-xs" style={{ color: ok ? '#22C55E' : '#4B5563' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function CustomerAuth() {
  const navigate = useNavigate();
  const { userLogin, userRegister, isUserAuthenticated } = useCustomerAuth();

  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (isUserAuthenticated) navigate('/inventory', { replace: true });
  }, [isUserAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await userLogin(loginEmail.trim().toLowerCase(), loginPassword);
    if (result.success) {
      navigate('/inventory', { replace: true });
    } else {
      setError(result.error || 'Login failed');
      setLoginPassword('');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(regPassword)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and a number.');
      setLoading(false);
      return;
    }

    const result = await userRegister({
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      country: country.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    if (result.success) {
      setSuccess('Account created! Redirecting to inventory…');
      setTimeout(() => navigate('/inventory', { replace: true }), 1500);
    } else {
      setError(result.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#070707' }}>
      {/* Left panel — decorative */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0F0D0A 0%, #1a1209 50%, #0A0A0A 100%)',
          borderRight: '1px solid rgba(212,168,83,0.1)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(212,168,83,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(212,168,83,0.07) 0%, transparent 70%)' }} />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(212,168,83,0.2), rgba(212,168,83,0.08))', border: '1px solid rgba(212,168,83,0.25)' }}>
            <Globe size={18} style={{ color: '#D4A853' }} />
          </div>
          <span className="text-lg font-bold" style={{ color: '#F5F0EB', letterSpacing: '-0.02em' }}>
            SHK <span style={{ color: '#D4A853' }}>Global</span>
          </span>
        </Link>

        {/* Value props */}
        <div className="relative z-10 space-y-6">
          {[
            { title: '150,000+ Vehicles', desc: 'Access Japan\'s largest auto auctions directly' },
            { title: '80+ Countries', desc: 'Shipping to your port with full documentation' },
            { title: 'Grade Verified', desc: 'Every vehicle inspected and auction-graded' },
          ].map(({ title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="w-1 h-10 rounded-full flex-shrink-0 mt-1" style={{ background: 'linear-gradient(to bottom, #D4A853, rgba(212,168,83,0.1))' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#F5F0EB' }}>{title}</p>
                <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs relative z-10" style={{ color: '#374151' }}>
          © {new Date().getFullYear()} SHK Global Export. All rights reserved.
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <Globe size={20} style={{ color: '#D4A853' }} />
          <span className="font-bold" style={{ color: '#F5F0EB' }}>SHK <span style={{ color: '#D4A853' }}>Global</span></span>
        </Link>

        <div className="w-full max-w-md">
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-xl mb-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['login', 'register'] as Tab[]).map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-all"
                style={{
                  background: tab === t ? 'rgba(212,168,83,0.12)' : 'transparent',
                  color: tab === t ? '#D4A853' : '#6B7280',
                  border: tab === t ? '1px solid rgba(212,168,83,0.2)' : '1px solid transparent',
                }}>
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: '#F5F0EB', letterSpacing: '-0.02em' }}>
              {tab === 'login' ? 'Welcome back' : 'Join SHK Global'}
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: '#6B7280' }}>
              {tab === 'login'
                ? 'Sign in to browse and track your vehicle orders.'
                : 'Create an account to access exclusive auction inventory.'}
            </p>
          </div>

          {/* Success */}
          {success && (
            <div className="flex items-center gap-3 p-4 rounded-xl mb-6"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle2 size={16} style={{ color: '#22C55E' }} />
              <p className="text-sm" style={{ color: '#86EFAC' }}>{success}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm" style={{ color: '#FCA5A5' }}>{error}</p>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <FloatingInput id="login-email" label="Email Address" type="email"
                value={loginEmail} onChange={setLoginEmail} placeholder="you@example.com"
                disabled={loading} icon={Mail} />

              <div>
                <label htmlFor="login-password" className="block text-xs font-medium mb-2"
                  style={{ color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4B5563' }} />
                  <input id="login-password" type={showPassword ? 'text' : 'password'}
                    value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    required disabled={loading} placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={INPUT_STYLE}
                    onFocus={(e) => (e.target.style.borderColor = INPUT_FOCUS_BORDER)}
                    onBlur={(e) => (e.target.style.borderColor = INPUT_BLUR_BORDER)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: showPassword ? '#D4A853' : '#4B5563' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: loading ? 'rgba(212,168,83,0.3)' : 'linear-gradient(135deg, #D4A853 0%, #B8860B 100%)',
                  color: '#0A0A0A',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(212,168,83,0.2)',
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: '#0A0A0A', borderTopColor: 'transparent' }} />
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>

              <p className="text-center text-sm" style={{ color: '#6B7280' }}>
                Don't have an account?{' '}
                <button type="button" onClick={() => { setTab('register'); setError(''); }}
                  className="font-medium transition-colors hover:opacity-80" style={{ color: '#D4A853' }}>
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-medium mb-2"
                    style={{ color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    First Name
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4B5563' }} />
                    <input id="firstName" type="text" value={firstName} required disabled={loading}
                      onChange={(e) => setFirstName(e.target.value)} placeholder="John"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                      style={INPUT_STYLE}
                      onFocus={(e) => (e.target.style.borderColor = INPUT_FOCUS_BORDER)}
                      onBlur={(e) => (e.target.style.borderColor = INPUT_BLUR_BORDER)} />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-medium mb-2"
                    style={{ color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Last Name
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4B5563' }} />
                    <input id="lastName" type="text" value={lastName} required disabled={loading}
                      onChange={(e) => setLastName(e.target.value)} placeholder="Smith"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                      style={INPUT_STYLE}
                      onFocus={(e) => (e.target.style.borderColor = INPUT_FOCUS_BORDER)}
                      onBlur={(e) => (e.target.style.borderColor = INPUT_BLUR_BORDER)} />
                  </div>
                </div>
              </div>

              <FloatingInput id="reg-email" label="Email Address" type="email"
                value={regEmail} onChange={setRegEmail} placeholder="you@example.com"
                disabled={loading} icon={Mail} />

              <div>
                <label htmlFor="reg-password" className="block text-xs font-medium mb-2"
                  style={{ color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4B5563' }} />
                  <input id="reg-password" type={showPassword ? 'text' : 'password'}
                    value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                    required disabled={loading} placeholder="Create a strong password"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={INPUT_STYLE}
                    onFocus={(e) => (e.target.style.borderColor = INPUT_FOCUS_BORDER)}
                    onBlur={(e) => (e.target.style.borderColor = INPUT_BLUR_BORDER)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: showPassword ? '#D4A853' : '#4B5563' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <PasswordStrength password={regPassword} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="country" className="block text-xs font-medium mb-2"
                    style={{ color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Country <span style={{ color: '#4B5563' }}>(optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4B5563' }} />
                    <input id="country" type="text" value={country} disabled={loading}
                      onChange={(e) => setCountry(e.target.value)} placeholder="Kenya"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                      style={INPUT_STYLE}
                      onFocus={(e) => (e.target.style.borderColor = INPUT_FOCUS_BORDER)}
                      onBlur={(e) => (e.target.style.borderColor = INPUT_BLUR_BORDER)} />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-medium mb-2"
                    style={{ color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Phone <span style={{ color: '#4B5563' }}>(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4B5563' }} />
                    <input id="phone" type="tel" value={phone} disabled={loading}
                      onChange={(e) => setPhone(e.target.value)} placeholder="+254 7xx"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                      style={INPUT_STYLE}
                      onFocus={(e) => (e.target.style.borderColor = INPUT_FOCUS_BORDER)}
                      onBlur={(e) => (e.target.style.borderColor = INPUT_BLUR_BORDER)} />
                  </div>
                </div>
              </div>

              <p className="text-xs" style={{ color: '#4B5563' }}>
                By creating an account, you agree to our{' '}
                <span className="cursor-pointer" style={{ color: '#D4A853' }}>Terms of Service</span>{' '}
                and{' '}
                <span className="cursor-pointer" style={{ color: '#D4A853' }}>Privacy Policy</span>.
              </p>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: loading ? 'rgba(212,168,83,0.3)' : 'linear-gradient(135deg, #D4A853 0%, #B8860B 100%)',
                  color: '#0A0A0A',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(212,168,83,0.2)',
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: '#0A0A0A', borderTopColor: 'transparent' }} />
                    Creating account…
                  </span>
                ) : 'Create Account'}
              </button>

              <p className="text-center text-sm" style={{ color: '#6B7280' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => { setTab('login'); setError(''); }}
                  className="font-medium" style={{ color: '#D4A853' }}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}