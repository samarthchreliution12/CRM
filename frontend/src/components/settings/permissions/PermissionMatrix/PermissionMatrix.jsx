import React from "react";
import {
  UserCheck,
  Users,
  FileText,
  LayoutDashboard,
  Shield,
  Loader2,
  UserPlus,
  List,
  CheckSquare,
  Calendar as CalendarIcon,
  MessageSquare,
  SlidersHorizontal,
  Settings,
  FolderGit2,
  KeyRound,
  Tag,
  Briefcase,
  ShieldAlert,
} from "lucide-react";
import "./PermissionMatrix.css";

export const MODULES_CONFIG = [
  {
    name: "Dashboard",
    prefix: "dashboard",
    icon: LayoutDashboard,
    allowedActions: ["view"],
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
        allowedActions: ["view", "create", "edit", "delete"],
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
        allowedActions: ["view", "create", "edit", "verify"],
        description: "File vault, document attachments & verification",
      },
    ],
  },
  {
    name: "Leads",
    isGroupHeader: true,
    icon: Users,
    description: "Lead pipeline & prospect assignments",
    submodules: [
      {
        name: "Lead List",
        prefix: "lead",
        icon: Users,
        allowedActions: ["view", "create", "edit", "delete"],
        description: "Prospect inquiries & conversion pipeline",
      },
    ],
  },
  {
    name: "Tasks",
    isGroupHeader: true,
    icon: CheckSquare,
    description: "Task activities & milestone management",
    submodules: [
      {
        name: "My Tasks",
        prefix: "task",
        icon: CheckSquare,
        allowedActions: ["view", "create", "edit", "delete"],
        description: "Personal assigned tasks & milestones",
      },
      {
        name: "All Tasks",
        prefix: "task",
        icon: List,
        allowedActions: ["view", "create", "edit", "delete"],
        description: "Company-wide task management & activities",
      },
    ],
  },
  {
    name: "Calendar",
    prefix: "calendar",
    fallbackPrefix: "task",
    icon: CalendarIcon,
    allowedActions: ["view", "create", "edit", "delete"],
    description: "Scheduled appointments, deadlines & event timelines",
  },
  {
    name: "Communication",
    isGroupHeader: true,
    icon: MessageSquare,
    description: "Internal messaging & WhatsApp communication",
    submodules: [
      {
        name: "Internal Communication",
        prefix: "communication",
        icon: MessageSquare,
        allowedActions: ["view", "create", "edit"],
        description: "Team chat channels & direct messaging",
      },
      {
        name: "WhatsApp Templates",
        prefix: "whatsapp",
        icon: FileText,
        allowedActions: ["view", "create", "edit"],
        description: "Approved message templates repository",
      },
      {
        name: "WhatsApp Configuration",
        prefix: "whatsapp",
        icon: SlidersHorizontal,
        allowedActions: ["view", "create", "edit"],
        description: "Workflow template triggers & automated events",
      },
      {
        name: "WhatsApp Settings",
        prefix: "whatsapp",
        icon: Settings,
        allowedActions: ["view", "edit"],
        description: "API gateway credentials & webhook status",
      },
    ],
  },
  {
    name: "Settings",
    isGroupHeader: true,
    icon: Settings,
    description: "System administration & access configurations",
    submodules: [
      {
        name: "Users",
        prefix: "staff",
        icon: Users,
        allowedActions: ["view", "create", "edit", "delete"],
        description: "Staff accounts & team invitations",
      },
      {
        name: "Groups / Roles",
        prefix: "role",
        icon: FolderGit2,
        allowedActions: ["view", "create", "edit", "delete"],
        description: "Access levels & security role definitions",
      },
      {
        name: "Permissions",
        prefix: "permission",
        icon: KeyRound,
        allowedActions: ["view", "edit"],
        description: "Role capability matrix & permission controls",
      },
      {
        name: "Client Types",
        prefix: "client_type",
        icon: Tag,
        allowedActions: ["view", "create", "edit", "delete"],
        description: "Client entity classifications (Individual, HUF, etc.)",
      },
      {
        name: "Client Services",
        prefix: "client_service",
        icon: Briefcase,
        allowedActions: ["view", "create", "edit", "delete"],
        description: "Advisory services catalog (Demat, Trading, etc.)",
      },
      {
        name: "Audit Logs",
        prefix: "audit",
        icon: ShieldAlert,
        allowedActions: ["view"],
        description: "Audit trail, security events & change logs",
      },
    ],
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

      // 1. Primary lookup by prefix.suffix
      const permKey = `${prefix}.${col.suffix}`.toLowerCase();
      let perm = permissionMapByKey[permKey];

      // Primary Suffix aliases:
      // view -> read
      if (!perm && col.suffix === "view") {
        perm = permissionMapByKey[`${prefix}.read`.toLowerCase()];
      }
      // edit -> update
      if (!perm && col.suffix === "edit") {
        perm = permissionMapByKey[`${prefix}.update`.toLowerCase()];
      }
      // create -> add
      if (!perm && col.suffix === "create") {
        perm = permissionMapByKey[`${prefix}.add`.toLowerCase()];
      }

      // 2. Fallback prefix lookup
      if (!perm && fallbackPrefix) {
        const fallbackKey = `${fallbackPrefix}.${col.suffix}`.toLowerCase();
        perm = permissionMapByKey[fallbackKey];
        if (!perm && col.suffix === "view") {
          perm = permissionMapByKey[`${fallbackPrefix}.read`.toLowerCase()];
        }
        if (!perm && col.suffix === "edit") {
          perm = permissionMapByKey[`${fallbackPrefix}.update`.toLowerCase()];
        }
        if (!perm && col.suffix === "create") {
          perm = permissionMapByKey[`${fallbackPrefix}.add`.toLowerCase()];
        }
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
