import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { NAV_LINKS, SERVICES_NAV_ITEMS } from '../../../utils/website/constants';
import { Button } from '../common/Button';

export const MobileMenu = ({ isOpen, onClose }) => {
  const [isServicesExpanded, setIsServicesExpanded] = useState(true);
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div
      className="website-mobile-overlay slide-down"
      style={{
        position: 'fixed',
        top: 'var(--header-height, 70px)',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-white)',
        zIndex: 999,
        padding: 'var(--spacing-md, 1rem)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-lg)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '14px', listStyle: 'none', padding: 0, margin: 0 }}>
        {NAV_LINKS.map((item) => {
          const isLinkActive = location.pathname === item.path;

          if (item.label === 'Services') {
            const isServicesActive = location.pathname.startsWith('/services');

            return (
              <li key={item.path} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsServicesExpanded((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '8px 0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minHeight: '44px',
                  }}
                >
                  <span
                    className={isServicesActive ? 'mobile-nav-item active' : 'mobile-nav-item'}
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: isServicesActive ? 700 : 600,
                      color: isServicesActive ? 'var(--color-primary)' : 'var(--color-dark)',
                    }}
                  >
                    Services
                  </span>
                  <span
                    style={{
                      fontSize: '0.9rem',
                      padding: '6px 12px',
                      color: 'var(--color-primary)',
                      fontWeight: '700',
                    }}
                  >
                    {isServicesExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {isServicesExpanded && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: '4px',
                      paddingLeft: '10px',
                      borderLeft: '2px solid rgba(158, 36, 29, 0.15)',
                      marginTop: '2px',
                    }}
                  >
                    {SERVICES_NAV_ITEMS.map((srv) => {
                      const isItemActive = location.pathname === srv.path;
                      return (
                        <Link
                          key={srv.slug}
                          to={srv.path}
                          onClick={onClose}
                          style={{
                            fontSize: '0.9rem',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            color: isItemActive ? 'var(--color-primary)' : 'var(--color-secondary)',
                            fontWeight: isItemActive ? 700 : 500,
                            backgroundColor: isItemActive ? 'rgba(158, 36, 29, 0.08)' : 'transparent',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '40px',
                          }}
                        >
                          <span>{srv.label}</span>
                          <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>→</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          }

          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={isLinkActive ? 'mobile-nav-item active' : 'mobile-nav-item'}
                style={{
                  fontSize: '1.15rem',
                  fontWeight: isLinkActive ? 700 : 600,
                  color: isLinkActive ? 'var(--color-primary)' : 'var(--color-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  minHeight: '44px',
                  padding: '4px 0',
                }}
              >
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-lg, 1.5rem)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Button to="https://parshwa.investwell.app/app/#/login" variant="outline" size="md" onClick={onClose} style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}>
          Login Mutual Fund
        </Button>
        <Button to="https://eipo.parshwaconsultancy.in/User/Login" target="_blank" variant="outline" size="md" onClick={onClose} style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}>
          Apply For IPO
        </Button>
        <Button to="/login" variant="primary" size="md" onClick={onClose} style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}>
          Login
        </Button>
      </div>
    </div>
  );
};

export default MobileMenu;
