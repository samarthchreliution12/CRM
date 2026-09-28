import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { NAV_LINKS, SERVICES_NAV_ITEMS } from '../../../utils/website/constants';
import { Button } from '../common/Button';

export const MobileMenu = ({ isOpen, onClose }) => {
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const location = useLocation();

  if (!isOpen) return null;

  return createPortal(
    <div className="website-mobile-overlay slide-down">
      <div className="mobile-menu-inner">
        {/* Main Navigation Links List */}
        <ul className="mobile-nav-list">
          {NAV_LINKS.map((item) => {
            if (item.label === 'Services') {
              const isServicesActive = location.pathname.startsWith('/services');

              return (
                <li key={item.path} className="mobile-nav-item-wrapper">
                  <button
                    type="button"
                    onClick={() => setIsServicesExpanded((prev) => !prev)}
                    className="mobile-services-toggle-btn"
                  >
                    <span
                      className={`mobile-nav-link ${isServicesActive ? 'active' : ''}`}
                    >
                      Services
                    </span>
                    <span className="mobile-chevron-badge">
                      {isServicesExpanded ? '▲' : '▼'}
                    </span>
                  </button>

                  {isServicesExpanded && (
                    <div className="mobile-services-sublist">
                      {SERVICES_NAV_ITEMS.map((srv) => {
                        const isItemActive = location.pathname === srv.path;
                        return (
                          <Link
                            key={srv.slug}
                            to={srv.path}
                            onClick={onClose}
                            className={`mobile-service-subitem ${isItemActive ? 'active' : ''}`}
                          >
                            <span>{srv.label}</span>
                            <span className="subitem-arrow">→</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            }

            return (
              <li key={item.path} className="mobile-nav-item-wrapper">
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `mobile-nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Action Buttons / Portals Section */}
        <div className="mobile-menu-actions-panel">
          <span className="mobile-actions-label">Quick Access & Portals</span>
          <div className="mobile-actions-btns">
            <Button
              to="https://parshwa.investwell.app/app/#/login"
              variant="outline"
              size="md"
              onClick={onClose}
              className="mobile-action-btn mobile-btn-mf"
            >
              <span>📈 Login Mutual Fund</span>
              <span className="btn-ext-icon">↗</span>
            </Button>
            <Button
              to="https://eipo.parshwaconsultancy.in/User/Login"
              target="_blank"
              variant="outline"
              size="md"
              onClick={onClose}
              className="mobile-action-btn mobile-btn-ipo"
            >
              <span>🚀 Apply For IPO</span>
              <span className="btn-ext-icon">↗</span>
            </Button>
            <Button
              to="/login"
              variant="primary"
              size="md"
              onClick={onClose}
              className="mobile-action-btn mobile-btn-login"
            >
              <span>🔐 Login</span>
              <span>→</span>
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .website-mobile-overlay {
          position: fixed;
          top: var(--header-height, 70px);
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #FFFFFF;
          z-index: 999;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12);
        }

        .mobile-menu-inner {
          padding: 1.25rem 1rem 3rem 1rem;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          max-width: 480px;
          margin: 0 auto;
        }

        .mobile-nav-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem 0;
        }

        .mobile-nav-item-wrapper {
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding-bottom: 4px;
        }

        .mobile-nav-link {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--color-dark, #0F172A);
          display: flex;
          align-items: center;
          text-decoration: none;
          min-height: 44px;
          padding: 6px 4px;
          transition: color 0.2s ease, padding-left 0.2s ease;
        }

        .mobile-nav-link.active {
          color: var(--color-primary, #9E241D);
          font-weight: 800;
        }

        .mobile-services-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: none;
          border: none;
          padding: 6px 4px;
          cursor: pointer;
          text-align: left;
          min-height: 44px;
        }

        .mobile-chevron-badge {
          font-size: 0.8rem;
          padding: 4px 10px;
          color: var(--color-primary, #9E241D);
          background-color: rgba(158, 36, 29, 0.08);
          border-radius: 6px;
          font-weight: 700;
        }

        .mobile-services-sublist {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4px;
          padding-left: 12px;
          border-left: 2px solid rgba(158, 36, 29, 0.2);
          margin: 6px 0 10px 6px;
        }

        .mobile-service-subitem {
          font-size: 0.925rem;
          padding: 8px 12px;
          border-radius: 6px;
          color: var(--color-secondary, #475569);
          font-weight: 500;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 38px;
          background-color: #F8F9FA;
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
        }

        .mobile-service-subitem.active {
          color: var(--color-primary, #9E241D);
          font-weight: 700;
          background-color: rgba(158, 36, 29, 0.08);
          border-color: rgba(158, 36, 29, 0.15);
        }

        .subitem-arrow {
          font-size: 0.8rem;
          opacity: 0.5;
        }

        /* Action Buttons Panel */
        .mobile-menu-actions-panel {
          background-color: #F8F9FA;
          border: 1px solid var(--color-border, #E2E2DF);
          border-radius: 12px;
          padding: 1.25rem 1rem;
          margin-top: 1rem;
        }

        .mobile-actions-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-muted, #64748B);
          margin-bottom: 12px;
        }

        .mobile-actions-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mobile-action-btn {
          width: 100% !important;
          min-height: 46px !important;
          font-size: 0.95rem !important;
          font-weight: 600 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 10px 16px !important;
          border-radius: 8px !important;
          box-sizing: border-box !important;
        }

        .mobile-btn-mf {
          background-color: #FFFFFF !important;
          color: var(--color-dark, #0F172A) !important;
          border: 1px solid var(--color-border, #E2E2DF) !important;
        }

        .mobile-btn-ipo {
          background-color: #FFFFFF !important;
          color: var(--color-dark, #0F172A) !important;
          border: 1px solid var(--color-border, #E2E2DF) !important;
        }

        .mobile-btn-login {
          background-color: var(--color-primary, #9E241D) !important;
          color: #FFFFFF !important;
          box-shadow: 0 4px 14px rgba(158, 36, 29, 0.35) !important;
        }

        .btn-ext-icon {
          font-size: 1rem;
          opacity: 0.6;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default MobileMenu;
