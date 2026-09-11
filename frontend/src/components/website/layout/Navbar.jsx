import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { NAV_LINKS } from '../../../utils/website/constants';
import { Button } from '../common/Button';
import headerLogo from '../../../assets/website/logo/header-logo.png';

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
        {NAV_LINKS.map((item, index) => (
          <li key={item.path} className="nav-link-stagger" style={{ animationDelay: `${0.1 + index * 0.08}s` }}>
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

      {/* Desktop Right Action Buttons */}
      <div className="website-nav-cta hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Button to="https://parshwa.investwell.app/app/#/login" variant="outline" size="sm" className="website-btn" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
          Login Mutual Fund
        </Button>
        <Button to="https://eipo.parshwaconsultancy.in/User/Login" target="_blank" variant="outline" size="sm" className="website-btn" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
          Apply For IPO
        </Button>
        <Button to="/login" variant="primary" size="sm" className="website-btn" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
          Login
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
        @media (max-width: 992px) {
          .website-nav-links {
            gap: 16px !important;
          }
          .website-nav-cta {
            gap: 8px !important;
          }
        }
        @media (max-width: 860px) {
          .hide-on-mobile {
            display: none !important;
          }
          .website-mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
};
