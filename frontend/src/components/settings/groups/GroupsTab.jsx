import React, { useState, useEffect, useCallback } from "react";
import GroupService from "../../../services/group.service";
import useAuth from "../../../hooks/useAuth";
import CreateGroupModal from "./CreateGroupModal";
import ManageGroupModal from "./ManageGroupModal";
import DeleteGroupModal from "./DeleteGroupModal";
import { Plus, Users, Settings, Trash2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import "./GroupsTab.css";

const GroupsTab = () => {
  const { token } = useAuth();

  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isManageOpen, setIsManageOpen] = useState(false);

  const [deletingGroup, setDeletingGroup] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await GroupService.getGroups(token);
      if (res && res.data && res.data.groups) {
        setGroups(res.data.groups);
      } else {
        setGroups([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load custom groups from server.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Create Group
  const handleCreateSubmit = async (formData) => {
    setIsCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await GroupService.createGroup(formData, token);
      if (res && res.success) {
        setSuccessMessage(`Group "${formData.name}" created successfully.`);
        setIsCreateOpen(false);
        await fetchGroups();
      }
    } catch (err) {
      setError(err.message || "Failed to create group.");
    } finally {
      setIsCreating(false);
    }
  };

  // Manage Group
  const handleOpenManage = (groupId) => {
    setSelectedGroupId(groupId);
    setIsManageOpen(true);
    setError("");
    setSuccessMessage("");
  };

  // Delete Group
  const handleOpenDelete = (group) => {
    setDeletingGroup(group);
    setError("");
    setSuccessMessage("");
  };

  const handleConfirmDelete = async () => {
    if (!deletingGroup) return;

    setIsDeleting(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await GroupService.deleteGroup(deletingGroup.id, token);
      if (res && res.success) {
        setSuccessMessage(res.message || `Group "${deletingGroup.name}" deleted successfully.`);
        setDeletingGroup(null);
        await fetchGroups();
      }
    } catch (err) {
      setError(err.message || "Failed to delete group.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch (e) {
      return "—";
    }
  };

  return (
    <div className="user-access-card">
      {/* Global Error Banner */}
      {error && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: "16px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Global Success Banner */}
      {successMessage && (
        <div className="auth-alert auth-alert-success" style={{ marginBottom: "16px" }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="user-access-header">
        <div className="user-access-title-group">
          <h2 className="user-access-title">Groups</h2>
          <p className="user-access-subtitle">Manage staff groups and their permissions.</p>
        </div>

        <button type="button" className="btn-add-staff" onClick={() => setIsCreateOpen(true)}>
          <Plus size={18} />
          <span>+ Create Group</span>
        </button>
      </div>

      {/* Groups List Table View */}
      {isLoading ? (
        <div className="staff-loading-container">
          <RefreshCw size={24} className="animate-spin" color="#0284c7" />
          <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "#475569" }}>
            Loading custom groups...
          </span>
        </div>
      ) : groups.length === 0 ? (
        <div className="staff-empty-container">
          <div className="placeholder-icon-circle">
            <Users size={28} />
          </div>
          <h3 className="empty-title">No groups created yet</h3>
          <p className="empty-desc">Create a group to manage staff permissions together.</p>
          <button type="button" className="btn-add-staff" onClick={() => setIsCreateOpen(true)}>
            <Plus size={18} />
            <span>+ Create Group</span>
          </button>
        </div>
      ) : (
        <div className="staff-table-wrapper">
          <table className="staff-table">
            <thead>
              <tr>
                <th>GROUP NAME</th>
                <th>DESCRIPTION</th>
                <th>MEMBERS</th>
                <th>CREATED</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const count = parseInt(g.member_count || g.memberCount || 0, 10);
                return (
                  <tr key={g.id}>
                    <td>
                      <div className="staff-user-cell">
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            backgroundColor: "#eff6ff",
                            color: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "0.85rem",
                            flexShrink: 0,
                          }}
                        >
                          <Users size={18} />
                        </div>
                        <span className="staff-name-text" style={{ fontSize: "0.9rem" }}>
                          {g.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                      {g.description || "—"}
                    </td>
                    <td>
                      <span className="badge-role" style={{ backgroundColor: "#f1f5f9", color: "#334155" }}>
                        {count} Member{count === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                      {formatDate(g.created_at)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          type="button"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            backgroundColor: "#eff6ff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            borderRadius: "6px",
                            fontSize: "0.8125rem",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                          onClick={() => handleOpenManage(g.id)}
                        >
                          <Settings size={14} />
                          <span>Manage</span>
                        </button>

                        <button
                          type="button"
                          style={{
                            padding: "6px 8px",
                            backgroundColor: "transparent",
                            color: "#94a3b8",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          title="Delete Group"
                          onClick={() => handleOpenDelete(g)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isSubmitting={isCreating}
      />

      <ManageGroupModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        groupId={selectedGroupId}
        onGroupUpdated={fetchGroups}
      />

      <DeleteGroupModal
        isOpen={Boolean(deletingGroup)}
        onClose={() => setDeletingGroup(null)}
        onConfirm={handleConfirmDelete}
        group={deletingGroup}
        isSubmitting={isDeleting}
      />
    </div>
  );
};

export default GroupsTab;
