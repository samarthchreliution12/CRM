import React, { useState, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { NAV_LINKS, SERVICES_NAV_ITEMS } from '../../../utils/website/constants';
import { Button } from '../common/Button';
import headerLogo from '../../../assets/website/logo/header-logo.png';

export const Navbar = ({ onMobileToggle }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const timeoutRef = useRef(null);
  const location = useLocation();

  const col1Services = SERVICES_NAV_ITEMS.slice(0, 5);
  const col2Services = SERVICES_NAV_ITEMS.slice(5, 10);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150);
  };

  return (
    <nav className="website-navbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      {/* Brand Logo Container */}
      <Link to="/" className="website-logo-link" style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={headerLogo}
          alt="Parshwa Consultancy Logo"
          className="website-nav-logo"
        />
      </Link>

      {/* Desktop Navigation Links */}
      <ul className="website-nav-links hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {NAV_LINKS.map((item, index) => {
          if (item.label === 'Services') {
            const isServicesActive = location.pathname.startsWith('/services');

            return (
              <li
                key={item.path}
                className="nav-link-stagger nav-dropdown-container"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ animationDelay: `${0.1 + index * 0.08}s` }}
              >
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className={`website-nav-item ${isServicesActive ? 'active' : ''}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {item.label}
                    <span className={`dropdown-caret ${isDropdownOpen ? 'open' : ''}`}>▾</span>
                  </span>
                  <span className="nav-item-underline" />
                </button>

                {/* 2-Column Mega Dropdown */}
                <div className={`services-mega-dropdown ${isDropdownOpen ? 'show' : ''}`}>
                  <div className="services-dropdown-inner">
                    <div className="services-dropdown-col">
                      {col1Services.map((srv) => {
                        const isItemActive = location.pathname === srv.path;
                        return (
                          <Link
                            key={srv.slug}
                            to={srv.path}
                            onClick={() => setIsDropdownOpen(false)}
                            className={`services-dropdown-item ${isItemActive ? 'active' : ''}`}
                          >
                            <span className="dropdown-item-name">{srv.label}</span>
                            <span className="dropdown-item-arrow">→</span>
                          </Link>
                        );
                      })}
                    </div>

                    <div className="services-dropdown-col">
                      {col2Services.map((srv) => {
                        const isItemActive = location.pathname === srv.path;
                        return (
                          <Link
                            key={srv.slug}
                            to={srv.path}
                            onClick={() => setIsDropdownOpen(false)}
                            className={`services-dropdown-item ${isItemActive ? 'active' : ''}`}
                          >
                            <span className="dropdown-item-name">{srv.label}</span>
                            <span className="dropdown-item-arrow">→</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </li>
            );
          }

          return (
            <li key={item.path} className="nav-link-stagger" style={{ animationDelay: `${0.1 + index * 0.08}s` }}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? 'website-nav-item active' : 'website-nav-item'
                }
              >
                {item.label}
                <span className="nav-item-underline" />
              </NavLink>
            </li>
          );
        })}
      </ul>

      {/* Desktop Right Action Buttons */}
      <div className="website-nav-cta hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Button to="https://parshwa.investwell.app/app/#/login" variant="outline" size="sm" className="website-btn nav-action-btn" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
          Login Mutual Fund
        </Button>
        <Button to="https://eipo.parshwaconsultancy.in/User/Login" target="_blank" variant="outline" size="sm" className="website-btn nav-action-btn" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
          Apply For IPO
        </Button>
        <Button to="/login" variant="primary" size="sm" className="website-btn nav-action-btn" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
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
        .website-nav-logo {
          height: 48px;
          width: auto;
          max-height: 100%;
          object-fit: contain;
          display: block;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .website-logo-link:hover .website-nav-logo {
          transform: scale(1.04);
        }

        .website-nav-item {
          position: relative;
          font-weight: 500;
          color: var(--color-dark, #0F172A);
          padding-bottom: 4px;
          text-decoration: none;
          transition: color 0.25s ease;
          display: inline-flex;
          align-items: center;
        }

        .website-nav-item:hover,
        .website-nav-item.active {
          color: var(--color-primary, #9E241D);
          font-weight: 600;
        }

        .nav-item-underline {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--color-primary, #9E241D);
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .website-nav-item:hover .nav-item-underline,
        .website-nav-item.active .nav-item-underline {
          transform: scaleX(1);
          transform-origin: left;
        }

        /* Dropdown Styling */
        .nav-dropdown-container {
          position: relative;
        }

        .dropdown-caret {
          font-size: 0.7rem;
          margin-left: 2px;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .dropdown-caret.open {
          transform: rotate(180deg);
        }

        .services-mega-dropdown {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-6px);
          padding-top: 12px;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.2s;
          z-index: 1100;
        }

        .services-mega-dropdown.show {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateX(-50%) translateY(0);
        }

        .services-dropdown-inner {
          width: 440px;
          background-color: #ffffff;
          border-radius: var(--radius-lg, 12px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-top: 3px solid var(--color-primary, #9E241D);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12);
          padding: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .services-dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--color-dark, #0F172A);
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .services-dropdown-item:hover {
          background-color: rgba(158, 36, 29, 0.06);
          color: var(--color-primary, #9E241D);
        }

        .services-dropdown-item.active {
          background-color: rgba(158, 36, 29, 0.08);
          color: var(--color-primary, #9E241D);
          font-weight: 700;
        }

        .dropdown-item-arrow {
          font-size: 0.8rem;
          opacity: 0.35;
          transition: transform 0.2s ease, opacity 0.2s ease, color 0.2s ease;
        }

        .services-dropdown-item:hover .dropdown-item-arrow,
        .services-dropdown-item.active .dropdown-item-arrow {
          opacity: 1;
          transform: translateX(4px);
          color: var(--color-primary, #9E241D);
        }

        .nav-action-btn {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease !important;
        }

        .nav-action-btn:hover {
          transform: translateY(-2px);
        }

        @media (max-width: 992px) {
          .website-nav-links {
            gap: 16px !important;
          }
          .website-nav-cta {
            gap: 8px !important;
          }
          .services-dropdown-inner {
            width: 380px;
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

export default Navbar;
