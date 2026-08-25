import React, { useState, useEffect } from "react";
import { X, AlertCircle, Eye, EyeOff } from "lucide-react";
import "./StaffFormModal.css";

const StaffFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) => {
  const isEditMode = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        mobile: initialData.mobile || "",
        password: "",
        confirmPassword: "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
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

    if (!formData.name || !formData.name.trim()) {
      errors.name = "Full Name is required";
    }

    if (!formData.email || !formData.email.trim()) {
      errors.email = "Email Address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Please enter a valid email address";
      }
    }

    if (formData.mobile && formData.mobile.trim()) {
      const mobileClean = formData.mobile.trim().replace(/[\s\-()]/g, "");
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(mobileClean)) {
        errors.mobile = "Please enter a valid 10-digit mobile number";
      }
    }

    if (!isEditMode) {
      if (!formData.password || !formData.password.trim()) {
        errors.password = "Password is required";
      } else if (formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters long";
      }

      if (!formData.confirmPassword || !formData.confirmPassword.trim()) {
        errors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditMode) {
      onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile ? formData.mobile.trim().replace(/[\s\-()]/g, "") : null,
      });
    } else {
      onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile ? formData.mobile.trim().replace(/[\s\-()]/g, "") : null,
        password: formData.password,
      });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditMode ? "Edit Staff User" : "Add New Staff User"}</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {/* Full Name */}
            <div className="modal-form-group">
              <label className="modal-form-label">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className={`modal-form-input ${fieldErrors.name ? "input-error" : ""}`}
                disabled={isSubmitting}
              />
              {fieldErrors.name && (
                <span className="field-error-message">
                  <AlertCircle size={14} /> {fieldErrors.name}
                </span>
              )}
            </div>

            {/* Email Address */}
            <div className="modal-form-group">
              <label className="modal-form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                className={`modal-form-input ${fieldErrors.email ? "input-error" : ""}`}
                disabled={isSubmitting}
              />
              {fieldErrors.email && (
                <span className="field-error-message">
                  <AlertCircle size={14} /> {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Mobile Number */}
            <div className="modal-form-group">
              <label className="modal-form-label">Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="9876543210 (10 digits)"
                className={`modal-form-input ${fieldErrors.mobile ? "input-error" : ""}`}
                disabled={isSubmitting}
              />
              {fieldErrors.mobile && (
                <span className="field-error-message">
                  <AlertCircle size={14} /> {fieldErrors.mobile}
                </span>
              )}
            </div>

            {/* Role Display (Read-Only) */}
            <div className="modal-form-group">
              <label className="modal-form-label">Assigned Role</label>
              <input
                type="text"
                value="Staff"
                disabled
                className="modal-form-input"
              />
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Staff role is automatically assigned by the backend.
              </span>
            </div>

            {/* Password Fields (Add Mode Only) */}
            {!isEditMode && (
              <>
                <div className="modal-form-group">
                  <label className="modal-form-label">Password *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      className={`modal-form-input ${fieldErrors.password ? "input-error" : ""}`}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span className="field-error-message">
                      <AlertCircle size={14} /> {fieldErrors.password}
                    </span>
                  )}
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Confirm Password *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className={`modal-form-input ${fieldErrors.confirmPassword ? "input-error" : ""}`}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span className="field-error-message">
                      <AlertCircle size={14} /> {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>
              </>
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
              type="submit"
              className="btn-edit-profile"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving Changes..."
                  : "Creating Staff..."
                : isEditMode
                ? "Save Changes"
                : "Create Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffFormModal;
