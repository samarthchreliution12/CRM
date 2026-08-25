import React, { useState, useEffect, useRef } from "react";
import { MoreVertical, Eye, Edit2, Trash2 } from "lucide-react";
import "./PermissionTable.css";

const PermissionTable = ({ permissionsList, onView, onEdit, onDelete }) => {
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

  return (
    <div ref={menuRef}>
      {/* Desktop Table View */}
      <div className="permission-table-wrapper">
        <table className="permission-table">
          <thead>
            <tr>
              <th>Permission Name</th>
              <th>Module</th>
              <th>Description</th>
              <th style={{ textAlign: "right", width: "60px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {permissionsList.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="permission-key-badge">{item.permission_key}</span>
                </td>
                <td>
                  <span className="module-badge">{item.module}</span>
                </td>
                <td>
                  <span className="permission-desc-text">{item.description}</span>
                </td>
                <td style={{ position: "relative" }}>
                  <div className="action-menu-container">
                    <button
                      type="button"
                      className="btn-action-trigger"
                      onClick={(e) => toggleMenu(e, item.id)}
                      aria-label="Actions menu"
                      title="Actions"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeMenuId === item.id && (
                      <div className="action-dropdown-menu">
                        <button
                          type="button"
                          className="action-menu-item"
                          onClick={() => {
                            setActiveMenuId(null);
                            onView(item);
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
                            onEdit(item);
                          }}
                        >
                          <Edit2 size={15} color="#475569" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="action-menu-item danger"
                          onClick={() => {
                            setActiveMenuId(null);
                            onDelete(item);
                          }}
                        >
                          <Trash2 size={15} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards List View */}
      <div className="permission-mobile-cards-list">
        {permissionsList.map((item) => (
          <div key={item.id} className="permission-mobile-card">
            <div className="mobile-card-top">
              <span className="permission-key-badge">{item.permission_key}</span>

              <div className="action-menu-container">
                <button
                  type="button"
                  className="btn-action-trigger"
                  onClick={(e) => toggleMenu(e, item.id)}
                >
                  <MoreVertical size={18} />
                </button>

                {activeMenuId === item.id && (
                  <div className="action-dropdown-menu">
                    <button
                      type="button"
                      className="action-menu-item"
                      onClick={() => {
                        setActiveMenuId(null);
                        onView(item);
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
                        onEdit(item);
                      }}
                    >
                      <Edit2 size={15} color="#475569" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className="action-menu-item danger"
                      onClick={() => {
                        setActiveMenuId(null);
                        onDelete(item);
                      }}
                    >
                      <Trash2 size={15} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <div>
                <span className="module-badge">{item.module}</span>
              </div>
              <p className="permission-desc-text">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PermissionTable;
