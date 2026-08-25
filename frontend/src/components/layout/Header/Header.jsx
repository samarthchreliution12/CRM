import React from "react";
import { Search, Bell, HelpCircle, Menu } from "lucide-react";
import UserMenu from "../UserMenu/UserMenu";
import "./Header.css";

const Header = ({ title = "Dashboard", onToggleSidebar }) => {
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

        {/* Global CRM Search Bar */}
        <div className="header-search">
          <Search size={20} className="header-search-icon" />
          <input
            type="text"
            className="header-search-input"
            placeholder="Search clients, leads, tasks..."
          />
        </div>
      </div>

      <div className="header-right">
        {/* Notifications Icon with Unread Indicator Badge */}
        <button
          type="button"
          className="header-action-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="notification-badge" />
        </button>

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
