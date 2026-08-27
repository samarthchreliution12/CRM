import React, { useState, useEffect, useCallback } from "react";
import PermissionMatrix from "../permissions/PermissionMatrix/PermissionMatrix";
import GroupService from "../../../services/group.service";
import PermissionService from "../../../services/permission.service";
import StaffService from "../../../services/staff.service";
import AddGroupMembersModal from "./AddGroupMembersModal";
import useAuth from "../../../hooks/useAuth";
import { X, UserPlus, Save, CheckCircle2, AlertCircle, Loader2, Users } from "lucide-react";

const ManageGroupModal = ({ isOpen, onClose, groupId, onGroupUpdated }) => {
  const { token } = useAuth();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [allStaffList, setAllStaffList] = useState([]);

  // Active sub-tab inside Manage modal: 'members' or 'permissions'
  const [activeTab, setActiveTab] = useState("members");

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [isAddPeopleOpen, setIsAddPeopleOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadGroupDetails = useCallback(async () => {
    if (!groupId || !token) return;
    setIsLoading(true);
    setError("");

    try {
      // 1. Fetch group details (info, permissions, members)
      const res = await GroupService.getGroupDetails(groupId, token);
      if (res && res.data) {
        setGroup(res.data.group);
        setMembers(res.data.members || []);
        const assignedIds = (res.data.permissions || []).map((p) => p.id);
        setSelectedPermissionIds(assignedIds);
      }

      // 2. Fetch all system permissions if not loaded
      const sysPermsRes = await PermissionService.getAllPermissions(token);
      if (sysPermsRes && sysPermsRes.data) {
        setAllPermissions(sysPermsRes.data.permissions || []);
      }

      // 3. Fetch staff list for Add People dropdown
      const staffRes = await StaffService.getStaffUsers({ limit: 100 }, token);
      if (staffRes && staffRes.data) {
        setAllStaffList(staffRes.data.staff || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load group details.");
    } finally {
      setIsLoading(false);
    }
  }, [groupId, token]);

  useEffect(() => {
    if (isOpen && groupId) {
      loadGroupDetails();
      setSuccessMessage("");
      setError("");
    }
  }, [isOpen, groupId, loadGroupDetails]);

  if (!isOpen) return null;

  // Add Selected People
  const handleAddPeopleSubmit = async (userIds) => {
    setIsSubmittingAdd(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await GroupService.addMembers(groupId, userIds, token);
      if (res && res.success) {
        setSuccessMessage(res.message || "Members added successfully.");
        setIsAddPeopleOpen(false);
        await loadGroupDetails();
        if (onGroupUpdated) onGroupUpdated();
      }
    } catch (err) {
      setError(err.message || "Failed to add members to group.");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from this group?`)) return;

    setError("");
    setSuccessMessage("");

    try {
      const res = await GroupService.removeMember(groupId, userId, token);
      if (res && res.success) {
        setSuccessMessage(`User "${userName}" removed from group.`);
        await loadGroupDetails();
        if (onGroupUpdated) onGroupUpdated();
      }
    } catch (err) {
      setError(err.message || "Failed to remove member from group.");
    }
  };

  // Permission matrix toggle
  const handleTogglePermission = (permissionId) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
    );
    setSuccessMessage("");
  };

  const handleSelectAll = () => {
    setSelectedPermissionIds(allPermissions.map((p) => p.id));
    setSuccessMessage("");
  };

  const handleDeselectAll = () => {
    setSelectedPermissionIds([]);
    setSuccessMessage("");
  };

  const handleResetPermissions = () => {
    loadGroupDetails();
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    setIsSavingPermissions(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await GroupService.updatePermissions(groupId, selectedPermissionIds, token);
      if (res && res.success) {
        setSuccessMessage("Group permissions updated successfully.");
        await loadGroupDetails();
        if (onGroupUpdated) onGroupUpdated();
      }
    } catch (err) {
      setError(err.message || "Failed to save group permissions.");
    } finally {
      setIsSavingPermissions(false);
    }
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
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal-content-card"
          style={{ maxWidth: "860px", width: "90%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div>
              <h3 className="modal-title">{group?.name || "Manage Group"}</h3>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "2px 0 0 0" }}>
                {group?.description || "Manage team members and group-level permissions."}
              </p>
            </div>
            <button type="button" className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="auth-alert auth-alert-error" style={{ margin: "12px 24px 0 24px" }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-alert auth-alert-success" style={{ margin: "12px 24px 0 24px" }}>
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Navigation Tabs (Members | Permissions) */}
          <div className="main-navigation-tabs" style={{ padding: "12px 24px 0 24px", borderBottom: "1px solid #e2e8f0" }}>
            <button
              type="button"
              className={`nav-tab-button ${activeTab === "members" ? "active" : ""}`}
              onClick={() => setActiveTab("members")}
            >
              <Users size={16} />
              <span>Members ({members.length})</span>
            </button>

            <button
              type="button"
              className={`nav-tab-button ${activeTab === "permissions" ? "active" : ""}`}
              onClick={() => setActiveTab("permissions")}
            >
              <span>Group Permissions</span>
            </button>
          </div>

          {/* Body */}
          <div className="modal-body" style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "40px" }}>
                <Loader2 size={24} className="animate-spin" color="#2563eb" />
                <span style={{ fontSize: "0.9rem", color: "#475569", fontWeight: "600" }}>Loading group details...</span>
              </div>
            ) : activeTab === "members" ? (
              /* Members View */
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#0f172a" }}>
                    Group Members ({members.length})
                  </span>
                  <button
                    type="button"
                    className="btn-add-staff"
                    onClick={() => setIsAddPeopleOpen(true)}
                  >
                    <UserPlus size={16} />
                    <span>+ Add People</span>
                  </button>
                </div>

                {members.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <Users size={32} color="#94a3b8" style={{ marginBottom: "8px" }} />
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>No members in this group</h4>
                    <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 16px 0" }}>Click '+ Add People' to assign staff users to this group.</p>
                    <button type="button" className="btn-add-staff" onClick={() => setIsAddPeopleOpen(true)}>
                      <UserPlus size={16} />
                      <span>+ Add People</span>
                    </button>
                  </div>
                ) : (
                  <div className="staff-table-wrapper">
                    <table className="staff-table">
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m) => (
                          <tr key={m.id || m.user_id}>
                            <td>
                              <div className="staff-user-cell">
                                <div className="staff-avatar-circle">{getInitials(m.name)}</div>
                                <span className="staff-name-text">{m.name}</span>
                              </div>
                            </td>
                            <td>{m.email}</td>
                            <td>
                              <span className="badge-role">{m.role || group?.name}</span>
                            </td>
                            <td>
                              <span className={m.status === "active" ? "badge-status-active" : "badge-status-inactive"}>
                                {m.status || "Active"}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                style={{
                                  padding: "4px 10px",
                                  backgroundColor: "#fef2f2",
                                  color: "#dc2626",
                                  border: "1px solid #fca5a5",
                                  borderRadius: "6px",
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                                onClick={() => handleRemoveMember(m.id || m.user_id, m.name)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* Permissions Matrix View */
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", margin: "0" }}>Group Capabilities</h4>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "2px 0 0 0" }}>Members belonging to this group will inherit these permissions.</p>
                  </div>
                  <button
                    type="button"
                    className="btn-save-matrix"
                    onClick={handleSavePermissions}
                    disabled={isSavingPermissions}
                  >
                    {isSavingPermissions ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save Permissions</span>
                      </>
                    )}
                  </button>
                </div>

                <PermissionMatrix
                  allPermissions={allPermissions}
                  selectedPermissionIds={selectedPermissionIds}
                  onTogglePermission={handleTogglePermission}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onReset={handleResetPermissions}
                  isLoading={isSavingPermissions}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add People Modal */}
      <AddGroupMembersModal
        isOpen={isAddPeopleOpen}
        onClose={() => setIsAddPeopleOpen(false)}
        onSubmit={handleAddPeopleSubmit}
        staffList={allStaffList}
        currentMemberIds={members.map((m) => m.id || m.user_id)}
        isSubmitting={isSubmittingAdd}
      />
    </>
  );
};

export default ManageGroupModal;
