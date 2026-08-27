import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../common/Container';
import { COMPANY_INFO, NAV_LINKS } from '../../utils/constants';

export const Footer = () => {
  return (
    <footer
      className="website-footer"
      style={{
        backgroundColor: 'var(--color-dark)',
        color: 'var(--color-white)',
        paddingTop: 'var(--spacing-xxl)',
        paddingBottom: 'var(--spacing-lg)',
        borderTop: '1px solid #333',
        marginTop: 'auto',
      }}
    >
      <Container>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-xxl)',
          }}
        >
          {/* Column 1: Brand Info */}
          <div>
            <h3 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-sm)' }}>
              {COMPANY_INFO.name}
            </h3>
            <p style={{ color: '#A0AAB0', fontSize: '0.9375rem', marginBottom: 'var(--spacing-md)' }}>
              {COMPANY_INFO.tagline}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-md)' }}>Quick Links</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {NAV_LINKS.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} style={{ color: '#C0C8CE', fontSize: '0.9375rem' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-md)' }}>Contact Us</h4>
            <p style={{ color: '#C0C8CE', fontSize: '0.9375rem', marginBottom: '6px' }}>
              📍 {COMPANY_INFO.address}
            </p>
            <p style={{ color: '#C0C8CE', fontSize: '0.9375rem', marginBottom: '6px' }}>
              📞 {COMPANY_INFO.phone}
            </p>
            <p style={{ color: '#C0C8CE', fontSize: '0.9375rem', marginBottom: '6px' }}>
              ✉️ {COMPANY_INFO.email}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid #343A40',
            paddingTop: 'var(--spacing-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.875rem',
            color: '#8A959E',
          }}
        >
          <span>© {new Date().getFullYear()} {COMPANY_INFO.name}. All rights reserved.</span>
          <span>Designed & Developed for Parshwa Consultancy</span>
        </div>
      </Container>
    </footer>
  );
};
