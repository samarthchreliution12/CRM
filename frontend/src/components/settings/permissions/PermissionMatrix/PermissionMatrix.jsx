import React from "react";
import { UserCheck, Users, FileText, LayoutDashboard, Shield, Loader2, UserPlus, List, CheckSquare } from "lucide-react";
import "./PermissionMatrix.css";

export const MODULES_CONFIG = [
  {
    name: "Dashboard",
    prefix: "dashboard",
    icon: LayoutDashboard,
    description: "System overview, KPIs & analytics",
  },
  {
    name: "Clients",
    isGroupHeader: true,
    icon: UserCheck,
    description: "Client relationship management & repository",
    submodules: [
      {
        name: "Client List",
        prefix: "client",
        icon: List,
        description: "Manage client directory & profiles",
      },
      {
        name: "Add Client",
        prefix: "client_add",
        fallbackPrefix: "client",
        allowedActions: ["create"], // Create action only! Read/Update/Verify/Delete show "-"
        icon: UserPlus,
        description: "Onboard & register new client profiles",
      },
      {
        name: "Documents",
        prefix: "document",
        icon: FileText,
        description: "File vault & document attachments",
      },
    ],
  },
  {
    name: "Lead",
    prefix: "lead",
    icon: Users,
    description: "Lead pipeline & prospect assignments",
  },
  {
    name: "Tasks",
    prefix: "task",
    icon: CheckSquare,
    description: "Manage task assignments & activities",
  },
];

export const ACTION_COLUMNS = [
  { label: "Read", suffix: "view" },
  { label: "Create", suffix: "create" },
  { label: "Update", suffix: "edit" },
  { label: "Verify", suffix: "verify" },
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

  const renderActionCells = (prefix, fallbackPrefix, allowedActions) => {
    return ACTION_COLUMNS.map((col) => {
      // If allowedActions is specified and does not include col.suffix, render "-" for non-applicable actions
      if (allowedActions && !allowedActions.includes(col.suffix)) {
        return (
          <td key={col.suffix} className="col-action">
            <div className="cell-checkbox-wrapper" style={{ opacity: 0.35, color: "#94a3b8", fontWeight: 700 }}>
              -
            </div>
          </td>
        );
      }

      const permKey = `${prefix}.${col.suffix}`.toLowerCase();
      let perm = permissionMapByKey[permKey];

      if (!perm && fallbackPrefix) {
        const fallbackKey = `${fallbackPrefix}.${col.suffix}`.toLowerCase();
        perm = permissionMapByKey[fallbackKey];
      }

      if (!perm && prefix === "document" && col.suffix === "edit") {
        perm = permissionMapByKey["document.update"];
      }

      if (!perm) {
        return (
          <td key={col.suffix} className="col-action">
            <div className="cell-checkbox-wrapper" style={{ opacity: 0.35, color: "#94a3b8", fontWeight: 700 }}>
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
              aria-label={`${col.label} (${perm.permission_key})`}
            />
          </div>
        </td>
      );
    });
  };

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
            <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem auto", color: "#9E241D" }} />
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
              {MODULES_CONFIG.map((item) => {
                if (item.isGroupHeader) {
                  const GroupIcon = item.icon || Shield;
                  return (
                    <React.Fragment key={item.name}>
                      <tr className="matrix-group-header-row">
                        <td colSpan={6}>
                          <div className="group-header-cell">
                            <GroupIcon size={16} className="group-header-icon" />
                            <span>{item.name}</span>
                          </div>
                        </td>
                      </tr>
                      {item.submodules.map((sub, idx) => {
                        const SubIcon = sub.icon || Shield;
                        const isLast = idx === item.submodules.length - 1;
                        const branchChar = isLast ? "└──" : "├──";
                        return (
                          <tr key={sub.name} className="submodule-row">
                            <td>
                              <div className="module-info-cell">
                                <span className="submodule-tree-branch">{branchChar}</span>
                                <div className="module-icon-box">
                                  <SubIcon size={16} />
                                </div>
                                <div>
                                  <div className="module-name-text">{sub.name}</div>
                                  <div className="module-subtext">{sub.description}</div>
                                </div>
                              </div>
                            </td>
                            {renderActionCells(sub.prefix, sub.fallbackPrefix, sub.allowedActions)}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                }

                const Icon = item.icon || Shield;
                return (
                  <tr key={item.prefix}>
                    <td>
                      <div className="module-info-cell">
                        <div className="module-icon-box">
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="module-name-text">{item.name}</div>
                          <div className="module-subtext">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    {renderActionCells(item.prefix, item.fallbackPrefix, item.allowedActions)}
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
