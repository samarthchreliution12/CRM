import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";

const CreateGroupModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group Name is required.");
      return;
    }
    setError("");
    onSubmit({ name: name.trim(), description: description.trim() });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Create Group</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="auth-alert auth-alert-error" style={{ marginBottom: "16px" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="modal-form-group">
              <label className="modal-form-label">Group Name *</label>
              <input
                type="text"
                className="modal-form-input"
                placeholder="e.g. Document Team, Sales Team"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="modal-form-group">
              <label className="modal-form-label">Description</label>
              <textarea
                className="modal-form-input"
                style={{ height: "80px", resize: "vertical", paddingTop: "8px" }}
                placeholder="Brief description of team responsibilities..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
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
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
