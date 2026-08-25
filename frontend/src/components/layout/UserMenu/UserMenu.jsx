import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown } from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import "./UserMenu.css";

const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate("/profile");
  };

  const handleLogoutClick = async () => {
    setIsOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <div className="user-menu-container" ref={menuRef}>
      {/* Trigger Button with Hover Indication */}
      <button
        type="button"
        className="user-menu-trigger"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label="User account menu"
      >
        <div className="user-avatar">{getInitials(user?.name)}</div>
        <div className="user-trigger-info">
          <span className="user-trigger-name">{user?.name || "User"}</span>
          <span className="user-trigger-role">{user?.role?.name || "Member"}</span>
        </div>
        <ChevronDown size={14} style={{ color: "var(--text-secondary)", transition: "transform 0.15s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-dropdown-header">
            <div className="user-dropdown-name">{user?.name || "User Name"}</div>
            <div className="user-dropdown-email">{user?.email || "user@example.com"}</div>
            <div className="user-dropdown-badges">
              <span className="badge-role">{user?.role?.name || "Staff"}</span>
              <span className="badge-status">{user?.status || "Active"}</span>
            </div>
          </div>

          <button type="button" className="user-dropdown-item" onClick={handleProfileClick}>
            <User size={16} />
            <span>My Profile</span>
          </button>

          <button type="button" className="user-dropdown-item logout-item" onClick={handleLogoutClick}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
