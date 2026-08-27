import React from "react";
import { X, AlertCircle } from "lucide-react";

const DeleteGroupModal = ({ isOpen, onClose, onConfirm, group, isSubmitting }) => {
  if (!isOpen || !group) return null;

  const memberCount = parseInt(group.member_count || group.memberCount || 0, 10);
  const hasMembers = memberCount > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Delete Group?</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: "0.9rem", color: "#334155", margin: "0 0 16px 0", lineHeight: "1.4" }}>
            Are you sure you want to delete the group <strong>"{group.name}"</strong>?
          </p>

          {hasMembers && (
            <div className="auth-alert auth-alert-error" style={{ marginBottom: "12px" }}>
              <AlertCircle size={18} />
              <span>Remove or reassign all members before deleting this group. ({memberCount} active member{memberCount > 1 ? "s" : ""})</span>
            </div>
          )}
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
            type="button"
            className="btn-confirm-delete"
            style={{
              padding: "8px 16px",
              backgroundColor: hasMembers ? "#94a3b8" : "#dc2626",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: hasMembers || isSubmitting ? "not-allowed" : "pointer",
            }}
            disabled={hasMembers || isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? "Deleting..." : "Delete Group"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteGroupModal;
