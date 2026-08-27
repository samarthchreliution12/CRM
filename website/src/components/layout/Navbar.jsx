import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { NAV_LINKS } from '../../utils/constants';
import { Button } from '../common/Button';
import headerLogo from '../../assets/logo/header-logo.png';

export const Navbar = ({ onMobileToggle }) => {
  return (
    <nav className="website-navbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      {/* Brand Logo Container */}
      <Link to="/" className="website-logo-link" style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={headerLogo}
          alt="Parshwa Consultancy Logo"
          style={{
            height: '48px',
            width: 'auto',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </Link>

      {/* Desktop Navigation Links */}
      <ul className="website-nav-links hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {NAV_LINKS.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'website-nav-item active' : 'website-nav-item'
              }
              style={({ isActive }) => ({
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-dark)',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                paddingBottom: '4px',
                transition: 'all var(--transition-fast)',
              })}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Desktop Right CTA */}
      <div className="website-nav-cta hide-on-mobile">
        <Button to="/contact" variant="primary" size="md">
          Book a Consultation
        </Button>
      </div>

      {/* Mobile Hamburger Toggle Button */}
      <button
        type="button"
        className="website-mobile-toggle"
        onClick={onMobileToggle}
        aria-label="Toggle navigation menu"
        style={{
          display: 'none',
          fontSize: '1.5rem',
          padding: '8px',
          color: 'var(--color-dark)',
        }}
      >
        ☰
      </button>

      <style>{`
        @media (max-width: 768px) {
          .website-mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
};
