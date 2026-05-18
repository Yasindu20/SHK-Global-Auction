import { Link } from 'react-router-dom';
import { Mail, MessageCircle } from 'lucide-react';

export default function Footer() {
  const serviceLinks = [
    'Vehicle Search',
    'Auction Bidding',
    'Shipping',
    'Inspection',
    'Documentation',
  ];

  const destLinks = [
    'East Africa',
    'Caribbean',
    'Southeast Asia',
    'Oceania',
    'South Asia',
  ];

  const companyLinks = [
    'About Us',
    'Contact',
    'Terms of Service',
    'Privacy Policy',
    'FAQ',
  ];

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg)',
      }}
    >
      <div className="container-main pt-12 pb-8">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo + tagline */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="text-[1.25rem] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--text-primary)' }}
            >
              JDM EXPORT
            </Link>
            <p className="mt-2" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Premium Japanese vehicle export since 2008.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-label mb-4" style={{ color: 'var(--text-primary)' }}>
              Services
            </h4>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="transition-colors duration-150 hover:text-[var(--text-primary)]"
                    style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="text-label mb-4" style={{ color: 'var(--text-primary)' }}>
              Destinations
            </h4>
            <ul className="space-y-2">
              {destLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="transition-colors duration-150 hover:text-[var(--text-primary)]"
                    style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-label mb-4" style={{ color: 'var(--text-primary)' }}>
              Company
            </h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="transition-colors duration-150 hover:text-[var(--text-primary)]"
                    style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <h4 className="text-label mb-2" style={{ color: 'var(--text-primary)' }}>
                Connect
              </h4>
              <a
                href="mailto:support@jdmexport.com"
                className="flex items-center gap-2 transition-colors duration-150"
                style={{ color: 'var(--amber)', fontSize: '0.875rem' }}
              >
                <Mail size={14} /> support@jdmexport.com
              </a>
              <div className="flex items-center gap-3 mt-3">
                <a href="#" style={{ color: 'var(--text-secondary)' }} className="hover:text-[var(--amber)] transition-colors">
                  <MessageCircle size={20} />
                </a>
                <a href="#" style={{ color: 'var(--text-secondary)' }} className="hover:text-[var(--amber)] transition-colors">
                  <Mail size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div
          className="flex flex-col md:flex-row items-center justify-between mt-8 pt-6"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            © 2025 JDM Export. All rights reserved.
          </span>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              English ▾
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
