import React, { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
} from "lucide-react";
import useClientAuth from "../../hooks/useClientAuth";
import headerLogo from "../../assets/website/logo/header-logo.png";
import "./ClientPortalLayout.css";

const ClientPortalLayout = ({ children }) => {
  const { client, logout } = useClientAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/client-login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/client-login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    {
      to: "/client-portal",
      label: "Dashboard",
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: "/client-portal/profile",
      label: "My Profile",
      icon: User,
    },
    {
      to: "/client-portal/documents",
      label: "My Documents",
      icon: FileText,
    },
  ];

  const getInitials = (name) => {
    if (!name) return "CL";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="client-layout-container">
      {/* Top Header */}
      <header className="client-layout-header">
        <div className="client-header-inner">
          {/* Logo & Portal Badge */}
          <div className="client-header-brand">
            <Link to="/client-portal" className="client-logo-link" title="Client Portal">
              <img src={headerLogo} alt="Parshwa Consultancy" className="client-header-logo" />
            </Link>
            <div className="client-portal-tag">
              <span className="portal-tag-dot" />
              <span>Client Portal</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="client-desktop-nav" aria-label="Client Portal Navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `client-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile & Logout (Desktop) */}
          <div className="client-header-actions">
            <div className="client-user-summary">
              <div className="client-avatar" title={client?.name || "Client"}>
                {getInitials(client?.name)}
              </div>
              <div className="client-user-meta">
                <span className="client-meta-name">{client?.name || "Client Account"}</span>
                {client?.ucc_no && (
                  <span className="client-meta-ucc">UCC: {client.ucc_no}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="client-logout-btn"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>{isLoggingOut ? "Signing out..." : "Logout"}</span>
            </button>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            className="client-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="client-mobile-drawer">
            {/* Mobile User Card */}
            <div className="client-mobile-user-card">
              <div className="client-avatar lg">{getInitials(client?.name)}</div>
              <div className="client-mobile-user-info">
                <strong>{client?.name || "Client Account"}</strong>
                <span>{client?.mobile_no || ""}</span>
                {client?.ucc_no && <span className="mobile-ucc-tag">UCC: {client.ucc_no}</span>}
              </div>
            </div>

            {/* Mobile Nav Links */}
            <div className="client-mobile-links">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`client-mobile-nav-link ${isActive ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="mobile-link-left">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="mobile-link-chevron" />
                  </Link>
                );
              })}
            </div>

            {/* Mobile Logout Button */}
            <div className="client-mobile-footer-action">
              <button
                type="button"
                className="client-mobile-logout-btn"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut size={16} />
                <span>{isLoggingOut ? "Signing out..." : "Logout from Portal"}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="client-layout-main">
        <div className="client-layout-content">{children}</div>
      </main>

      {/* Security & Copyright Footer */}
      <footer className="client-layout-footer">
        <div className="client-footer-inner">
          <div className="client-footer-security">
            <Shield size={14} className="shield-icon" />
            <span>Bank-grade 256-bit AES Encryption • All uploaded documents are stored securely</span>
          </div>
          <div className="client-footer-links">
            <span>© {new Date().getFullYear()} Parshwa Consultancy. All rights reserved.</span>
            <Link to="/about" className="footer-aux-link">About Us</Link>
            <Link to="/contact" className="footer-aux-link">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientPortalLayout;
