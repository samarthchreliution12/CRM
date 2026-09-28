import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../common/Container';
import { COMPANY_INFO, NAV_LINKS } from '../../../utils/website/constants';

export const Footer = () => {
  return (
    <footer className="website-footer">
      <Container>
        <div className="footer-grid">
          {/* Column 1: Brand Info */}
          <div className="footer-col">
            <h3 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-sm)' }}>
              {COMPANY_INFO.name}
            </h3>
            <p style={{ color: '#A0AAB0', fontSize: '0.9375rem', marginBottom: 'var(--spacing-md)' }}>
              {COMPANY_INFO.tagline}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-col">
            <h4 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-md)' }}>Quick Links</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {NAV_LINKS.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="footer-link-item" style={{ color: '#C0C8CE', fontSize: '0.9375rem' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div className="footer-col">
            <h4 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-md)' }}>Contact Us</h4>
            <p style={{ color: '#C0C8CE', fontSize: '0.9375rem', marginBottom: '8px', wordBreak: 'break-word' }}>
              📍 {COMPANY_INFO.address}
            </p>
            <p style={{ color: '#C0C8CE', fontSize: '0.9375rem', marginBottom: '8px' }}>
              📞 {COMPANY_INFO.phone}
            </p>
            <p style={{ color: '#C0C8CE', fontSize: '0.9375rem', marginBottom: '8px' }}>
              ✉️ {COMPANY_INFO.email}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <span>© {new Date().getFullYear()} {COMPANY_INFO.name}. All rights reserved.</span>
          <span>Designed & Developed for Parshwa Consultancy</span>
        </div>
      </Container>

      <style>{`
        .website-footer {
          background-color: var(--color-dark);
          color: var(--color-white);
          padding-top: var(--spacing-xxl);
          padding-bottom: var(--spacing-lg);
          border-top: 1px solid #333;
          margin-top: auto;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr 1fr;
          gap: var(--spacing-xl);
          margin-bottom: var(--spacing-xxl);
        }

        .footer-bottom-bar {
          border-top: 1px solid #343A40;
          padding-top: var(--spacing-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 0.875rem;
          color: #8A959E;
        }

        @media (max-width: 992px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-lg);
          }
        }

        @media (max-width: 600px) {
          .website-footer {
            padding-top: var(--spacing-xl);
            padding-bottom: var(--spacing-md);
          }

          .footer-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-lg);
          }

          .footer-bottom-bar {
            flex-direction: column;
            text-align: center;
            gap: 8px;
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </footer>
  );
};
