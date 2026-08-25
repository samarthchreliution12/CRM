import React from "react";
import { Trash2, UserCheck, UserX, X } from "lucide-react";
import "./StaffConfirmModal.css";

const StaffConfirmModal = ({ isOpen, onClose, onConfirm, type = "deactivate", staffUser = null, isSubmitting = false }) => {
  if (!isOpen || !staffUser) return null;

  const isDelete = type === "delete";
  const isDeactivate = type === "deactivate";
  const isActivate = type === "activate";

  let title = `Deactivate ${staffUser.name}?`;
  let description = "This user will no longer be able to log in to the CRM.";
  let confirmBtnText = "Deactivate";
  let iconClass = "warning";
  let Icon = UserX;

  if (isDelete) {
    title = `Delete ${staffUser.name}?`;
    description = "This action cannot be undone. All access for this staff user will be permanently removed.";
    confirmBtnText = "Delete Staff";
    iconClass = "danger";
    Icon = Trash2;
  } else if (isActivate) {
    title = `Activate ${staffUser.name}?`;
    description = "This user will be restored to active status and will be able to log in.";
    confirmBtnText = "Activate";
    iconClass = "success";
    Icon = UserCheck;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#0f172a" }}>Confirm Action</span>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>

        <div className="confirm-modal-body">
          <div className={`confirm-icon-circle ${iconClass}`}>
            <Icon size={28} />
          </div>
          <h3 className="confirm-modal-title">{title}</h3>
          <p className="confirm-modal-desc">{description}</p>
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
            className={isDelete ? "btn-cancel-profile" : "btn-edit-profile"}
            style={
              isDelete
                ? { backgroundColor: "#dc2626", color: "#ffffff", border: "none" }
                : isDeactivate
                ? { backgroundColor: "#d97706", color: "#ffffff", border: "none" }
                : {}
            }
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isDelete
                ? "Deleting..."
                : isDeactivate
                ? "Deactivating..."
                : "Activating..."
              : confirmBtnText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffConfirmModal;
