import React, { useState, useEffect, useCallback } from "react";
import PermissionMatrix from "../../../../components/settings/permissions/PermissionMatrix/PermissionMatrix";
import PermissionService from "../../../../services/permission.service";
import useAuth from "../../../../hooks/useAuth";
import { CheckCircle2, Save, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import "./Permissions.css";

const Permissions = () => {
  const { token } = useAuth();

  // Roles & Selection State
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  // System Permissions & Assigned Role Permissions State
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);

  // UI Feedback States
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 1. Initial Load: Fetch Roles & System Permissions
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        setIsLoadingRoles(true);
        setError("");

        // Fetch active roles
        const rolesRes = await PermissionService.getRoles(token);
        const activeRoles = rolesRes?.data?.roles || [];

        // Fetch all system permissions from database
        const sysPermsRes = await PermissionService.getAllPermissions(token);
        const sysPerms = sysPermsRes?.data?.permissions || [];

        if (isMounted) {
          setRoles(activeRoles);
          setAllPermissions(sysPerms);

          // Default selected role is Staff (role_id 2) or first role
          const staffRole = activeRoles.find((r) => r.name === "Staff");
          if (staffRole) {
            setSelectedRoleId(staffRole.id);
          } else if (activeRoles.length > 0) {
            setSelectedRoleId(activeRoles[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load roles and permissions from server.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // 2. Fetch assigned permissions whenever selectedRoleId changes
  const fetchRolePermissions = useCallback(
    async (roleId) => {
      if (!roleId) return;

      try {
        setIsLoadingPermissions(true);
        setError("");

        const res = await PermissionService.getRolePermissions(roleId, token);
        if (res && res.data) {
          const details = res.data.permission_details || [];
          const assignedIds = details.map((p) => p.id);
          setSelectedPermissionIds(assignedIds);
        }
      } catch (err) {
        setError(err.message || "Failed to load role permissions from database.");
        setSelectedPermissionIds([]);
      } finally {
        setIsLoadingPermissions(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
      setSuccessMessage("");
    }
  }, [selectedRoleId, fetchRolePermissions]);

  // 3. Handle Role Switch
  const handleRoleChange = (e) => {
    const newRoleId = parseInt(e.target.value, 10);
    setSelectedRoleId(newRoleId);
  };

  // 4. Handle Checkbox Toggling
  const handleTogglePermission = (permissionId) => {
    setSelectedPermissionIds((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
    setSuccessMessage("");
  };

  // 5. Select All Permissions
  const handleSelectAll = () => {
    const allIds = allPermissions.map((p) => p.id);
    setSelectedPermissionIds(allIds);
    setSuccessMessage("");
  };

  // 6. Deselect All Permissions
  const handleDeselectAll = () => {
    setSelectedPermissionIds([]);
    setSuccessMessage("");
  };

  // 7. Reset Matrix (Re-fetch assigned permissions from backend DB)
  const handleReset = () => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
      setSuccessMessage("");
    }
  };

  // 8. Save Matrix: Transactionally replace role_permissions in DB & Refetch
  const handleSaveMatrix = async () => {
    if (!selectedRoleId) return;

    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      // Send EXACT list of currently checked permission IDs
      await PermissionService.updateRolePermissions(
        selectedRoleId,
        selectedPermissionIds,
        token
      );

      // Show success message
      setSuccessMessage("Permissions saved successfully.");

      // Re-fetch role permissions from backend database to ensure state sync
      await fetchRolePermissions(selectedRoleId);
    } catch (err) {
      setError(err.message || "Failed to save role permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="permissions-view-container">
      {/* Global Error Banner */}
      {error && (
        <div className="banner-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Global Success Banner */}
      {successMessage && (
        <div className="banner-success">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header & Role Selector Section */}
      <div className="permissions-header">
        <div className="permissions-title-group">
          <h2 className="permissions-title">Permissions</h2>
          <p className="permissions-subtitle">
            Manage system capabilities and access levels across CRM roles and modules.
          </p>
        </div>

        <div className="permissions-header-controls">
          {/* Role Selector Dropdown */}
          <div className="role-selector-wrapper">
            <ShieldCheck size={16} className="role-selector-icon" />
            <label className="role-selector-label">Target Role:</label>
            {isLoadingRoles ? (
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Loading roles...</span>
            ) : (
              <select
                className="role-selector-select"
                value={selectedRoleId || ""}
                onChange={handleRoleChange}
                disabled={isSaving}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Save Matrix Button */}
          <button
            type="button"
            className="btn-save-matrix"
            onClick={handleSaveMatrix}
            disabled={isSaving || isLoadingPermissions || !selectedRoleId}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Matrix</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Role Summary Banner */}
      {selectedRole && (
        <div className="role-summary-info-bar">
          <span className="role-summary-badge">ROLE: {selectedRole.name}</span>
          <span className="role-summary-desc">{selectedRole.description || "Manage module permissions for this role."}</span>
          <span className="role-summary-count">
            {selectedPermissionIds.length} of {allPermissions.length} permissions active
          </span>
        </div>
      )}

      {/* Permission Matrix Component */}
      <PermissionMatrix
        allPermissions={allPermissions}
        selectedPermissionIds={selectedPermissionIds}
        onTogglePermission={handleTogglePermission}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onReset={handleReset}
        isLoading={isLoadingPermissions || isLoadingRoles}
      />
    </div>
  );
};

export default Permissions;
