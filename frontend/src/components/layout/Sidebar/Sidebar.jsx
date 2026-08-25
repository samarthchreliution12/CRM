import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  FileText,
  MessageSquare,
  Settings,
  Building2,
} from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import "./Sidebar.css";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role?.name === "Admin";

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Calendar", path: "/calendar", icon: Calendar },
    { name: "Leads", path: "/leads", icon: Users },
    { name: "Clients", path: "/clients", icon: UserCheck },
    { name: "Documents", path: "/documents", icon: FileText },
    { name: "Communication", path: "/communication", icon: MessageSquare },
  ];

  return (
    <aside className={`sidebar-container ${isOpen ? "open" : ""}`}>
      {/* Top Branding Section */}
      <div className="sidebar-branding">
        <div className="sidebar-logo-icon">
          <Building2 size={22} />
        </div>
        <div className="sidebar-company-info">
          <span className="sidebar-company-name">company name</span>
          <span className="sidebar-company-subtitle">Description</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isImplemented = item.path === "/dashboard" || item.path === "/clients";
          return (
            <Link
              key={item.name}
              to={isImplemented ? item.path : "#"}
              className={`nav-link ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings Page - Visible ONLY to Admin users */}
      {isAdmin && (
        <div className="sidebar-footer">
          <Link
            to="/settings"
            className={`nav-link ${location.pathname === "/settings" ? "active" : ""}`}
            onClick={onClose}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
