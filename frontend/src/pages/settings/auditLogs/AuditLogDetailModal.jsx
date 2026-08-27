import React from "react";
import { X, User, Clock, Shield, Database, Hash, Globe, ArrowRight, FileText } from "lucide-react";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return dateStr;
  }
};

const formatModuleLabel = (moduleStr) => {
  if (!moduleStr) return "General";
  const map = {
    CLIENTS: "Clients",
    DOCUMENTS: "Documents",
    COMMUNICATION: "Communication",
    USERS: "Users",
    GROUPS: "Groups",
    PERMISSIONS: "Permissions",
    SETTINGS: "Settings",
    AUTH: "Authentication",
  };
  return map[moduleStr.toUpperCase()] || moduleStr;
};

const formatValueDisplay = (val) => {
  if (val === null || val === undefined) return <span className="diff-null">null</span>;
  if (typeof val === "boolean") return <span className="diff-boolean">{val ? "true" : "false"}</span>;
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
};

const formatFieldLabel = (key) => {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const AuditLogDetailModal = ({ log, onClose }) => {
  if (!log) return null;

  const oldVals = log.old_values && typeof log.old_values === "object" ? log.old_values : {};
  const newVals = log.new_values && typeof log.new_values === "object" ? log.new_values : {};
  const changedKeys = Array.from(new Set([...Object.keys(oldVals), ...Object.keys(newVals)]));

  const isDeleteAction = log.action === "DELETE";

  const userInitials = log.user?.name
    ? log.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "SYS";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="audit-detail-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="audit-modal-header">
          <div className="audit-modal-header-title-group">
            <h3 className="audit-modal-title">Audit Log Details</h3>
            <span className={`action-pill action-${(log.action || "general").toLowerCase()}`}>
              {log.action}
            </span>
          </div>
          <button
            type="button"
            className="btn-audit-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="audit-modal-body">
          {/* Main Info Grid */}
          <div className="audit-info-grid">
            {/* User */}
            <div className="audit-info-item">
              <div className="audit-info-icon">
                <User size={16} />
              </div>
              <div className="audit-info-content">
                <span className="audit-info-label">User</span>
                <div className="audit-user-profile">
                  <div className="audit-user-avatar">{userInitials}</div>
                  <div className="audit-user-details">
                    <span className="audit-user-name">{log.user?.name || "System / Deleted User"}</span>
                    {log.user?.email && <span className="audit-user-email">{log.user.email}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Module */}
            <div className="audit-info-item">
              <div className="audit-info-icon">
                <Database size={16} />
              </div>
              <div className="audit-info-content">
                <span className="audit-info-label">Module</span>
                <span className="audit-info-value">{formatModuleLabel(log.module)}</span>
              </div>
            </div>

            {/* Affected Entity */}
            <div className="audit-info-item">
              <div className="audit-info-icon">
                <Hash size={16} />
              </div>
              <div className="audit-info-content">
                <span className="audit-info-label">Affected Record</span>
                <span className="audit-info-value">
                  {log.entity_type || "RECORD"} #{log.entity_id || "N/A"}
                  {isDeleteAction && <span className="deleted-tag"> (Deleted)</span>}
                </span>
              </div>
            </div>

            {/* Date & Time */}
            <div className="audit-info-item">
              <div className="audit-info-icon">
                <Clock size={16} />
              </div>
              <div className="audit-info-content">
                <span className="audit-info-label">Date & Time</span>
                <span className="audit-info-value">{formatDateTime(log.created_at)}</span>
              </div>
            </div>

            {/* IP Address */}
            {log.ip_address && (
              <div className="audit-info-item">
                <div className="audit-info-icon">
                  <Globe size={16} />
                </div>
                <div className="audit-info-content">
                  <span className="audit-info-label">IP Address</span>
                  <span className="audit-info-value">{log.ip_address}</span>
                </div>
              </div>
            )}

            {/* Log ID */}
            <div className="audit-info-item">
              <div className="audit-info-icon">
                <Shield size={16} />
              </div>
              <div className="audit-info-content">
                <span className="audit-info-label">Audit Record ID</span>
                <span className="audit-info-value">#{log.id}</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="audit-desc-card">
            <div className="audit-desc-header">
              <FileText size={16} />
              <span>Description</span>
            </div>
            <p className="audit-desc-text">{log.description || "No description provided."}</p>
          </div>

          {/* Diff Changes Section */}
          {changedKeys.length > 0 && (
            <div className="audit-changes-section">
              <h4 className="changes-section-title">Recorded Data Changes</h4>
              <div className="diff-table-wrapper">
                <table className="diff-table">
                  <thead>
                    <tr>
                      <th style={{ width: "30%" }}>FIELD</th>
                      <th style={{ width: "35%" }}>OLD VALUE</th>
                      <th style={{ width: "35%" }}>NEW VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changedKeys.map((key) => (
                      <tr key={key}>
                        <td className="diff-field-name">{formatFieldLabel(key)}</td>
                        <td className="diff-old-val">{formatValueDisplay(oldVals[key])}</td>
                        <td className="diff-new-val">
                          <div className="diff-new-wrapper">
                            <ArrowRight size={12} className="diff-arrow-icon" />
                            {formatValueDisplay(newVals[key])}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="audit-modal-footer">
          <button type="button" className="btn-audit-modal-done" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDetailModal;
