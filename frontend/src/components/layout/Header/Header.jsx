import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Bell, HelpCircle, Menu, FileText, BellOff, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import ClientService from "../../../services/client.service";
import UserMenu from "../UserMenu/UserMenu";
import "./Header.css";

const BLOCKED_SEARCH_ROUTES = ["/communication", "/clients", "/documents", "/settings"];

const Header = ({ title = "Dashboard", onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const permissions = user?.permissions || [];

  // Permission Check for Documents
  const canViewDocs =
    permissions.includes("document.view") ||
    permissions.includes("document.verify") ||
    permissions.includes("document.create") ||
    user?.role?.name === "Admin";

  const [pendingDocCount, setPendingDocCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifRef = useRef(null);

  const isSearchBlocked = BLOCKED_SEARCH_ROUTES.includes(location.pathname);

  // Fetch Pending Documents Count from Backend API
  const fetchPendingDocCount = useCallback(async () => {
    if (!canViewDocs || !token) {
      setPendingDocCount(0);
      return;
    }
    try {
      const res = await ClientService.getAdminDocuments({ status: "PENDING", limit: 1 }, token);
      const count = res?.data?.pagination?.total || 0;
      setPendingDocCount(count);
    } catch (e) {
      // Ignore fetch errors
    }
  }, [canViewDocs, token]);

  // Polling & Location Change Refresher
  useEffect(() => {
    fetchPendingDocCount();

    const interval = setInterval(fetchPendingDocCount, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingDocCount, location.pathname]);

  // Click Outside Listener to Close Notification Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleNotif = () => {
    setNotifDropdownOpen((prev) => !prev);
    if (!notifDropdownOpen) {
      fetchPendingDocCount();
    }
  };

  const handlePendingDocClick = () => {
    setNotifDropdownOpen(false);
    navigate("/documents?status=pending");
  };

  return (
    <header className="header-container">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar menu"
        >
          <Menu size={22} />
        </button>

        {/* Global CRM Search Bar vs Page Title Heading */}
        {!isSearchBlocked ? (
          <div className="header-search">
            <Search size={20} className="header-search-icon" />
            <input
              type="text"
              className="header-search-input"
              placeholder="Search clients, leads, tasks..."
            />
          </div>
        ) : (
          <h2 className="header-title">
            {location.pathname === "/communication"
              ? "Communicate with People"
              : location.pathname === "/clients"
              ? "Client Management"
              : location.pathname === "/documents"
              ? "Document Verification"
              : location.pathname === "/settings"
              ? "Admin Settings"
              : title}
          </h2>
        )}
      </div>

      <div className="header-right">
        {/* Notifications Icon with Unread Count Badge */}
        <div className="notif-wrapper" ref={notifRef}>
          <button
            type="button"
            className={`header-action-btn ${notifDropdownOpen ? "active" : ""}`}
            onClick={handleToggleNotif}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={18} />
            {canViewDocs && pendingDocCount > 0 && (
              <span className="notification-badge-count">
                {pendingDocCount > 99 ? "99+" : pendingDocCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifDropdownOpen && (
            <div className="header-notif-dropdown">
              <div className="notif-dropdown-header">
                <span className="notif-dropdown-title">Notifications</span>
                {canViewDocs && pendingDocCount > 0 && (
                  <span className="notif-badge-pill">{pendingDocCount} new</span>
                )}
              </div>

              <div className="notif-dropdown-body">
                {canViewDocs && pendingDocCount > 0 ? (
                  <div className="notif-item" onClick={handlePendingDocClick}>
                    <div className="notif-item-icon-wrapper pending">
                      <FileText size={18} />
                    </div>
                    <div className="notif-item-content">
                      <span className="notif-item-title">
                        {pendingDocCount} {pendingDocCount === 1 ? "Document" : "Documents"} Pending
                      </span>
                      <span className="notif-item-desc">
                        Documents require your review.
                      </span>
                    </div>
                    <ArrowRight size={14} className="notif-item-arrow" />
                  </div>
                ) : (
                  <div className="notif-empty-state">
                    <BellOff size={22} className="notif-empty-icon" />
                    <span>No new notifications</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help Icon */}
        <button
          type="button"
          className="header-action-btn"
          aria-label="Help"
          title="Help & Support"
        >
          <HelpCircle size={18} />
        </button>

        {/* User Profile Menu */}
        <UserMenu />
      </div>
    </header>
  );
};

export default Header;
