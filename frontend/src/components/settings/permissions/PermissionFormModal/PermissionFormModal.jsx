import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import "./PermissionFormModal.css";

const MODULE_OPTIONS = ["Client", "Lead", "Task", "Document", "Communication", "System"];

const PermissionFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) => {
  const isEditMode = Boolean(initialData);

  const [formData, setFormData] = useState({
    permission_key: "",
    module: "Client",
    description: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        permission_key: initialData.permission_key || "",
        module: initialData.module || "Client",
        description: initialData.description || "",
      });
    } else {
      setFormData({
        permission_key: "",
        module: "Client",
        description: "",
      });
    }
    setFieldErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.permission_key || !formData.permission_key.trim()) {
      errors.permission_key = "Permission Name is required";
    } else {
      const keyTrimmed = formData.permission_key.trim().toLowerCase();
      const keyRegex = /^[a-z0-9_]+\.[a-z0-9_]+$/;
      if (!keyRegex.test(keyTrimmed)) {
        errors.permission_key = "Permission Name must follow format 'module.action' (e.g. client.export)";
      }
    }

    if (!formData.module || !formData.module.trim()) {
      errors.module = "Module is required";
    }

    if (!formData.description || !formData.description.trim()) {
      errors.description = "Description is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      permission_key: formData.permission_key.trim().toLowerCase(),
      module: formData.module.trim(),
      description: formData.description.trim(),
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditMode ? "Edit Permission" : "Add New Permission"}</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {/* Permission Name */}
            <div className="modal-form-group">
              <label className="modal-form-label">Permission Name *</label>
              <input
                type="text"
                name="permission_key"
                value={formData.permission_key}
                onChange={handleChange}
                placeholder="e.g. client.export"
                className={`modal-form-input ${fieldErrors.permission_key ? "input-error" : ""}`}
                disabled={isSubmitting}
              />
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Use lowercase module and action separated by a dot (e.g. <code>client.export</code>, <code>lead.assign</code>).
              </span>
              {fieldErrors.permission_key && (
                <span className="field-error-message">
                  <AlertCircle size={14} /> {fieldErrors.permission_key}
                </span>
              )}
            </div>

            {/* Target Module */}
            <div className="modal-form-group">
              <label className="modal-form-label">Module *</label>
              <select
                name="module"
                value={formData.module}
                onChange={handleChange}
                className={`permission-select-input ${fieldErrors.module ? "input-error" : ""}`}
                disabled={isSubmitting}
              >
                {MODULE_OPTIONS.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
              {fieldErrors.module && (
                <span className="field-error-message">
                  <AlertCircle size={14} /> {fieldErrors.module}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="modal-form-group">
              <label className="modal-form-label">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what capabilities this permission grants..."
                className={`permission-textarea ${fieldErrors.description ? "input-error" : ""}`}
                disabled={isSubmitting}
              />
              {fieldErrors.description && (
                <span className="field-error-message">
                  <AlertCircle size={14} /> {fieldErrors.description}
                </span>
              )}
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
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving Changes..."
                  : "Adding Permission..."
                : isEditMode
                ? "Save Changes"
                : "Add Permission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PermissionFormModal;
