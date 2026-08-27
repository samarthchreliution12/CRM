import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";

const AddGroupMembersModal = ({ isOpen, onClose, onSubmit, staffList = [], currentMemberIds = [], isSubmitting }) => {
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedUserIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMemberSet = new Set(currentMemberIds.map((id) => Number(id)));

  const filteredStaff = staffList.filter((st) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      st.name.toLowerCase().includes(q) ||
      (st.email && st.email.toLowerCase().includes(q))
    );
  });

  const handleToggleUser = (userId) => {
    if (currentMemberSet.has(userId)) return;
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;
    onSubmit(selectedUserIds);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add People to Group</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Search Input */}
            <div className="search-input-wrapper" style={{ width: "100%", marginBottom: "14px" }}>
              <Search size={16} className="search-icon-inside" />
              <input
                type="text"
                className="staff-search-input"
                style={{ width: "100%", height: "38px" }}
                placeholder="Search staff by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Staff Checklist */}
            <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {filteredStaff.length === 0 ? (
                <p style={{ textAlign: "center", color: "#64748b", fontSize: "0.85rem", padding: "20px" }}>
                  No active staff members found.
                </p>
              ) : (
                filteredStaff.map((st) => {
                  const isAlreadyMember = currentMemberSet.has(st.id);
                  const isChecked = isAlreadyMember || selectedUserIds.includes(st.id);

                  return (
                    <label
                      key={st.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #f1f5f9",
                        backgroundColor: isAlreadyMember ? "#f8fafc" : "#ffffff",
                        opacity: isAlreadyMember ? 0.65 : 1,
                        cursor: isAlreadyMember ? "not-allowed" : "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isAlreadyMember}
                        onChange={() => handleToggleUser(st.id)}
                        style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: isAlreadyMember ? "not-allowed" : "pointer" }}
                      />
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor: "#eff6ff",
                          color: "#2563eb",
                          fontSize: "0.6875rem",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(st.name)}
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#0f172a" }}>{st.name}</span>
                        <span style={{ fontSize: "0.725rem", color: "#64748b" }}>{st.email}</span>
                      </div>
                      <span style={{ fontSize: "0.6875rem", fontWeight: "600", backgroundColor: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: "4px" }}>
                        {isAlreadyMember ? "Member" : st.role?.name || "Staff"}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel-profile"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-edit-profile"
              disabled={isSubmitting || selectedUserIds.length === 0}
            >
              {isSubmitting ? "Adding..." : `Add People (${selectedUserIds.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGroupMembersModal;
