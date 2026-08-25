import React from "react";
import { X, KeyRound, Layers, FileText, Calendar } from "lucide-react";
import "./PermissionDetailModal.css";

const PermissionDetailModal = ({ isOpen, onClose, permission }) => {
  if (!isOpen || !permission) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Permission Details</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="perm-detail-grid">
            <div className="perm-detail-card">
              <span className="detail-label">
                <KeyRound size={13} /> Permission Name
              </span>
              <span className="permission-key-badge" style={{ marginTop: "0.25rem" }}>
                {permission.permission_key}
              </span>
            </div>

            <div className="perm-detail-card">
              <span className="detail-label">
                <Layers size={13} /> Module
              </span>
              <div>
                <span className="module-badge" style={{ marginTop: "0.25rem" }}>
                  {permission.module}
                </span>
              </div>
            </div>

            <div className="perm-detail-card">
              <span className="detail-label">
                <FileText size={13} /> Description
              </span>
              <span className="detail-value" style={{ fontWeight: "500", fontSize: "0.9rem" }}>
                {permission.description}
              </span>
            </div>

            <div className="perm-detail-card">
              <span className="detail-label">
                <Calendar size={13} /> Registered Date
              </span>
              <span className="detail-value" style={{ fontSize: "0.85rem", color: "#64748b" }}>
                {permission.created_at ? new Date(permission.created_at).toLocaleString() : "System Default"}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel-profile" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionDetailModal;
