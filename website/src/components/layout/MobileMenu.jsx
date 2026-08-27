import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../../utils/constants';
import { Button } from '../common/Button';

export const MobileMenu = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="website-mobile-overlay slide-down"
      style={{
        position: 'fixed',
        top: 'var(--header-height)',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-white)',
        zIndex: 999,
        padding: 'var(--spacing-lg)',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {NAV_LINKS.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? 'mobile-nav-item active' : 'mobile-nav-item'
              }
              style={({ isActive }) => ({
                fontSize: '1.25rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-dark)',
                display: 'block',
              })}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-xl)' }}>
        <Button to="/contact" variant="primary" size="lg" onClick={onClose} style={{ width: '100%' }}>
          Book a Consultation
        </Button>
      </div>
    </div>
  );
};
