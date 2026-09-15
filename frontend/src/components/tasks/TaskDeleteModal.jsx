import React from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";

const TaskDeleteModal = ({ task, isOpen = true, onClose, onConfirm, isDeleting, error = "" }) => {
  if (!isOpen || !task) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: "450px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary, #9E241D)" }}>
            <AlertTriangle size={20} />
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Delete Task?</h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose} disabled={isDeleting}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="banner-error" style={{ marginBottom: "0.875rem" }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
          <p style={{ margin: 0, fontSize: "0.925rem", color: "var(--text-primary, #25282A)", lineHeight: 1.5 }}>
            Are you sure you want to delete the task <strong>"{task.title}"</strong>?
          </p>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.825rem", color: "var(--primary, #9E241D)", fontWeight: 600 }}>
            This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-delete-confirm"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1.125rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "var(--primary, #9E241D)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Task</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDeleteModal;
