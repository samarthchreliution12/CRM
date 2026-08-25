import React, { useState, useEffect, useRef } from "react";
import { MoreVertical, Eye, Edit2, UserCheck, UserX, Trash2 } from "lucide-react";
import "./StaffTable.css";

const StaffTable = ({ staffList, onView, onEdit, onToggleStatus, onDelete }) => {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenuId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return "S";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div ref={menuRef}>
      {/* Desktop Table View */}
      <div className="staff-table-wrapper">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th style={{ textAlignment: "right", width: "60px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((user) => {
              const isActive = user.status === "active";
              return (
                <tr key={user.id}>
                  <td>
                    <div className="staff-user-cell">
                      <div className="staff-avatar-circle">{getInitials(user.name)}</div>
                      <div className="staff-user-info">
                        <span className="staff-name-text">{user.name}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.mobile || "—"}</td>
                  <td>
                    <span className="badge-role">{user.role?.name || "Staff"}</span>
                  </td>
                  <td>
                    <span className={isActive ? "badge-status-active" : "badge-status-inactive"}>
                      <span className={`status-dot ${isActive ? "status-dot-active" : "status-dot-inactive"}`} />
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    {user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}
                  </td>
                  <td style={{ position: "relative" }}>
                    <div className="action-menu-container">
                      <button
                        type="button"
                        className="btn-action-trigger"
                        onClick={(e) => toggleMenu(e, user.id)}
                        aria-label="Actions menu"
                        title="Actions"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenuId === user.id && (
                        <div className="action-dropdown-menu">
                          <button
                            type="button"
                            className="action-menu-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              onView(user);
                            }}
                          >
                            <Eye size={15} color="#0284c7" />
                            <span>View Details</span>
                          </button>

                          <button
                            type="button"
                            className="action-menu-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              onEdit(user);
                            }}
                          >
                            <Edit2 size={15} color="#475569" />
                            <span>Edit Staff</span>
                          </button>

                          <button
                            type="button"
                            className="action-menu-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              onToggleStatus(user);
                            }}
                          >
                            {isActive ? (
                              <>
                                <UserX size={15} color="#d97706" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <UserCheck size={15} color="#16a34a" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            className="action-menu-item danger"
                            onClick={() => {
                              setActiveMenuId(null);
                              onDelete(user);
                            }}
                          >
                            <Trash2 size={15} />
                            <span>Delete Staff</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards List View */}
      <div className="staff-mobile-cards-list">
        {staffList.map((user) => {
          const isActive = user.status === "active";
          return (
            <div key={user.id} className="staff-mobile-card">
              <div className="mobile-card-top">
                <div className="staff-user-cell">
                  <div className="staff-avatar-circle">{getInitials(user.name)}</div>
                  <div className="staff-user-info">
                    <span className="staff-name-text">{user.name}</span>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{user.email}</span>
                  </div>
                </div>

                <div className="action-menu-container">
                  <button
                    type="button"
                    className="btn-action-trigger"
                    onClick={(e) => toggleMenu(e, user.id)}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {activeMenuId === user.id && (
                    <div className="action-dropdown-menu">
                      <button
                        type="button"
                        className="action-menu-item"
                        onClick={() => {
                          setActiveMenuId(null);
                          onView(user);
                        }}
                      >
                        <Eye size={15} color="#0284c7" />
                        <span>View Details</span>
                      </button>
                      <button
                        type="button"
                        className="action-menu-item"
                        onClick={() => {
                          setActiveMenuId(null);
                          onEdit(user);
                        }}
                      >
                        <Edit2 size={15} color="#475569" />
                        <span>Edit Staff</span>
                      </button>
                      <button
                        type="button"
                        className="action-menu-item"
                        onClick={() => {
                          setActiveMenuId(null);
                          onToggleStatus(user);
                        }}
                      >
                        {isActive ? <UserX size={15} color="#d97706" /> : <UserCheck size={15} color="#16a34a" />}
                        <span>{isActive ? "Deactivate" : "Activate"}</span>
                      </button>
                      <button
                        type="button"
                        className="action-menu-item danger"
                        onClick={() => {
                          setActiveMenuId(null);
                          onDelete(user);
                        }}
                      >
                        <Trash2 size={15} />
                        <span>Delete Staff</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                <div>
                  <span style={{ color: "#64748b" }}>Mobile: </span>
                  <strong>{user.mobile || "—"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Status: </span>
                  <span className={isActive ? "badge-status-active" : "badge-status-inactive"}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaffTable;
