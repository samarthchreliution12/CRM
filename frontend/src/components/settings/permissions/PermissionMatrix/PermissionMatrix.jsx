import React from "react";
import { UserCheck, Users, CheckSquare, FileText, MessageSquare, Shield, Loader2 } from "lucide-react";
import "./PermissionMatrix.css";

export const MODULES_CONFIG = [
  {
    name: "Client",
    prefix: "client",
    icon: UserCheck,
    description: "Manage client records & wealth profiles",
  },
  {
    name: "Lead",
    prefix: "lead",
    icon: Users,
    description: "Lead pipeline & prospect assignments",
  },
  {
    name: "Task",
    prefix: "task",
    icon: CheckSquare,
    description: "Operational tasks & staff assignments",
  },
  {
    name: "Documents",
    prefix: "document",
    icon: FileText,
    description: "File vault & document attachments",
  },
  {
    name: "Communication",
    prefix: "communication",
    icon: MessageSquare,
    description: "Client messages & log entries",
  },
];

export const ACTION_COLUMNS = [
  { label: "Read", suffix: "view" },
  { label: "Create", suffix: "create" },
  { label: "Update", suffix: "edit" },
  { label: "Delete", suffix: "delete" },
];

const PermissionMatrix = ({
  allPermissions = [],
  selectedPermissionIds = [],
  onTogglePermission,
  onSelectAll,
  onDeselectAll,
  onReset,
  isLoading = false,
}) => {
  // Create a lookup map: permission_key -> permission object
  const permissionMapByKey = {};
  allPermissions.forEach((p) => {
    if (p.permission_key) {
      permissionMapByKey[p.permission_key.toLowerCase()] = p;
    }
  });

  return (
    <div>
      {/* Matrix Controls Header */}
      <div className="matrix-controls-bar">
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
            System Permission Matrix
          </h3>
          <span style={{ fontSize: "0.825rem", color: "#64748b" }}>
            Check capabilities to grant actions across CRM modules.
          </span>
        </div>

        <div className="matrix-action-buttons">
          <button
            type="button"
            className="btn-matrix-action"
            onClick={onSelectAll}
            disabled={isLoading || allPermissions.length === 0}
          >
            Select All
          </button>
          <button
            type="button"
            className="btn-matrix-action"
            onClick={onDeselectAll}
            disabled={isLoading || allPermissions.length === 0}
          >
            Deselect All
          </button>
          <button
            type="button"
            className="btn-matrix-action"
            onClick={onReset}
            disabled={isLoading}
          >
            Reset Matrix
          </button>
        </div>
      </div>

      {/* Matrix Table Container */}
      <div className="matrix-wrapper">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem auto", color: "#0284c7" }} />
            <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>Loading permissions from database...</p>
          </div>
        ) : (
          <table className="matrix-table">
            <thead>
              <tr>
                <th>CRM Module</th>
                {ACTION_COLUMNS.map((col) => (
                  <th key={col.suffix} className="col-action">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES_CONFIG.map((mod) => {
                const Icon = mod.icon || Shield;
                return (
                  <tr key={mod.prefix}>
                    <td>
                      <div className="module-info-cell">
                        <div className="module-icon-box">
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="module-name-text">{mod.name}</div>
                          <div className="module-subtext">{mod.description}</div>
                        </div>
                      </div>
                    </td>

                    {ACTION_COLUMNS.map((col) => {
                      const permKey = `${mod.prefix}.${col.suffix}`.toLowerCase();
                      const perm = permissionMapByKey[permKey];

                      if (!perm) {
                        return (
                          <td key={col.suffix} className="col-action">
                            <div className="cell-checkbox-wrapper" style={{ opacity: 0.3 }}>
                              -
                            </div>
                          </td>
                        );
                      }

                      const isChecked = selectedPermissionIds.includes(perm.id);

                      return (
                        <td key={col.suffix} className="col-action">
                          <div className="cell-checkbox-wrapper">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onTogglePermission(perm.id)}
                              className="matrix-checkbox"
                              title={`Permission Key: ${perm.permission_key} (ID: ${perm.id})`}
                              aria-label={`${mod.name} ${col.label} (${perm.permission_key})`}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PermissionMatrix;
