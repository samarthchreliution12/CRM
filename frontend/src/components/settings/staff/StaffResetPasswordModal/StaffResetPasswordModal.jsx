import React, { useState, useEffect } from "react";
import { KeyRound, X, AlertCircle } from "lucide-react";
import PasswordInput from "../../../../components/auth/PasswordInput";

const StaffResetPasswordModal = ({ isOpen, onClose, onReset, staffUser = null, isSubmitting = false }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen || !staffUser) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    onReset(staffUser.id, newPassword);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <KeyRound size={20} color="#0284c7" />
            <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>
              Reset Password
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
              Set a new secure password for <strong>{staffUser.name}</strong> ({staffUser.email}).
            </p>

            {errorMsg && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "0.75rem 1rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <PasswordInput
              label="New Password *"
              name="newPassword"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Minimum 6 characters"
              disabled={isSubmitting}
              required
            />

            <PasswordInput
              label="Confirm New Password *"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Re-enter new password"
              disabled={isSubmitting}
              required
            />
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
              type="submit"
              className="btn-edit-profile"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffResetPasswordModal;
