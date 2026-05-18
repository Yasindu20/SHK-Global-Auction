import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { label: 'Inventory', path: '/inventory' },
    { label: 'How It Works', path: '/#how-it-works' },
    { label: 'Destinations', path: '/#destinations' },
    { label: 'Dashboard', path: '/dashboard' },
  ];

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          backgroundColor: scrolled ? 'rgba(10, 10, 10, 0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(245, 240, 235, 0.08)' : '1px solid transparent',
        }}
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="text-[1.25rem] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--text-primary)' }}
            >
              JDM EXPORT
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="transition-colors duration-200 hover:text-[var(--text-primary)]"
                  style={{
                    color: 'var(--text-secondary)',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    letterSpacing: '0.04em',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded-md border transition-colors duration-150"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                }}
              >
                USD <ChevronDown size={12} />
              </button>
              <Link
                to="/inventory"
                className="px-5 py-2.5 rounded-md font-semibold text-sm transition-all duration-150 hover:brightness-110 hover:scale-[1.02]"
                style={{
                  backgroundColor: 'var(--amber)',
                  color: 'var(--bg)',
                }}
              >
                Get Quote
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ color: 'var(--text-primary)' }}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8"
          style={{ backgroundColor: 'rgba(10, 10, 10, 0.98)' }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-h3 transition-colors duration-200"
              style={{ color: 'var(--text-primary)' }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/inventory"
            className="mt-4 px-8 py-3 rounded-md font-semibold text-base"
            style={{
              backgroundColor: 'var(--amber)',
              color: 'var(--bg)',
            }}
            onClick={() => setMobileOpen(false)}
          >
            Get Quote
          </Link>
        </div>
      )}
    </>
  );
}
