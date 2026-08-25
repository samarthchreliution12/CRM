import React, { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import useAuth from "../../hooks/useAuth";
import AuthService from "../../services/auth.service";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Activity,
  Clock,
  KeyRound,
  Edit2,
  Save,
  X,
  Lock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import "./Profile.css";

const Profile = () => {
  const { user, token, updateUserProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync formData with user context when user changes or edit mode resets
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
      });
    }
  }, [user]);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setGlobalError("");
    setSuccessMessage("");
    setFieldErrors({});
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setGlobalError("");
    setSuccessMessage("");
    setFieldErrors({});
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (globalError) {
      setGlobalError("");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name || !formData.name.trim()) {
      errors.name = "Name cannot be empty.";
    }

    if (!formData.email || !formData.email.trim()) {
      errors.email = "Please enter your email address.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Please enter a valid email address.";
      }
    }

    if (formData.mobile && formData.mobile.trim()) {
      const mobileClean = formData.mobile.trim().replace(/[\s\-()]/g, "");
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(mobileClean)) {
        errors.mobile = "Please enter a valid 10-digit mobile number.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await AuthService.updateProfile(
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile ? formData.mobile.trim().replace(/[\s\-()]/g, "") : null,
        },
        token
      );

      if (response && response.success) {
        updateUserProfile({
          name: formData.name.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile ? formData.mobile.trim().replace(/[\s\-()]/g, "") : null,
        });
        setIsEditing(false);
        setSuccessMessage("Profile updated successfully!");
      } else {
        setGlobalError(response.message || "Failed to update profile.");
      }
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 405) {
        setGlobalError(
          "Profile update endpoint (PUT /api/auth/me) is currently not implemented on the backend server. Please add this endpoint on the backend to save profile edits."
        );
      } else if (err.errors && Array.isArray(err.errors)) {
        const errorsObj = {};
        err.errors.forEach((item) => {
          if (item.field) errorsObj[item.field] = item.message;
        });
        setFieldErrors(errorsObj);
      } else {
        setGlobalError(err.message || "An error occurred while updating profile.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout title="My Profile">
      <div className="profile-container">
        {globalError && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={18} />
            <span>{globalError}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert auth-alert-success">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="profile-card">
          {/* Header Profile Section */}
          <div className="profile-header-section">
            <div className="profile-header-left">
              <div className="profile-large-avatar">{getInitials(user?.name)}</div>
              <div className="profile-title-area">
                <h2 className="profile-user-name">{user?.name || "User Profile"}</h2>
                <span className="profile-user-email">{user?.email}</span>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <span className="badge-role">{user?.role?.name || "Member"}</span>
                  <span className="badge-status">{user?.status || "Active"}</span>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              {!isEditing ? (
                <button type="button" className="btn-edit-profile" onClick={handleEditClick}>
                  <Edit2 size={16} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn-cancel-profile"
                    onClick={handleCancelClick}
                    disabled={isSubmitting}
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    form="profile-form"
                    className="btn-edit-profile"
                    disabled={isSubmitting}
                  >
                    <Save size={16} />
                    <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form / Details Grid */}
          <form id="profile-form" onSubmit={handleSubmit} noValidate>
            <div className="profile-grid">
              {/* Editable Name */}
              <div className={`profile-field-group ${isEditing ? "editing" : ""}`}>
                <span className="profile-field-label">
                  <User size={14} /> Full Name *
                </span>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      className={`profile-input ${fieldErrors.name ? "input-error" : ""}`}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.name && (
                      <span className="field-error-message" style={{ marginTop: "0.25rem" }}>
                        <AlertCircle size={14} /> {fieldErrors.name}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="profile-field-value">{user?.name}</span>
                )}
              </div>

              {/* Editable Email */}
              <div className={`profile-field-group ${isEditing ? "editing" : ""}`}>
                <span className="profile-field-label">
                  <Mail size={14} /> Email Address *
                </span>
                {isEditing ? (
                  <>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className={`profile-input ${fieldErrors.email ? "input-error" : ""}`}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.email && (
                      <span className="field-error-message" style={{ marginTop: "0.25rem" }}>
                        <AlertCircle size={14} /> {fieldErrors.email}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="profile-field-value">{user?.email}</span>
                )}
              </div>

              {/* Editable Mobile */}
              <div className={`profile-field-group ${isEditing ? "editing" : ""}`}>
                <span className="profile-field-label">
                  <Phone size={14} /> Mobile Number
                </span>
                {isEditing ? (
                  <>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="9876543210 (10 digits)"
                      className={`profile-input ${fieldErrors.mobile ? "input-error" : ""}`}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.mobile && (
                      <span className="field-error-message" style={{ marginTop: "0.25rem" }}>
                        <AlertCircle size={14} /> {fieldErrors.mobile}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="profile-field-value">{user?.mobile || "Not Provided"}</span>
                )}
              </div>

              {/* Read-Only Locked Role */}
              <div className="profile-field-group readonly-locked">
                <span className="profile-field-label">
                  <ShieldCheck size={14} /> System Role <Lock size={12} style={{ marginLeft: "auto" }} />
                </span>
                <span className="profile-field-value">
                  {user?.role?.name} ({user?.role?.description || "Access"})
                </span>
              </div>

              {/* Read-Only Locked Status */}
              <div className="profile-field-group readonly-locked">
                <span className="profile-field-label">
                  <Activity size={14} /> Account Status <Lock size={12} style={{ marginLeft: "auto" }} />
                </span>
                <span className="profile-field-value" style={{ color: "#16a34a" }}>
                  {user?.status}
                </span>
              </div>

              {/* Read-Only Locked Last Login */}
              <div className="profile-field-group readonly-locked">
                <span className="profile-field-label">
                  <Clock size={14} /> Last Login Timestamp <Lock size={12} style={{ marginLeft: "auto" }} />
                </span>
                <span className="profile-field-value">
                  {user?.last_login ? new Date(user.last_login).toLocaleString() : "Current Session"}
                </span>
              </div>
            </div>
          </form>

          {/* Granted Permissions Section */}
          <div style={{ marginTop: "2rem" }}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "700",
                color: "#0f172a",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <KeyRound size={18} color="#0284c7" /> Assigned System Permissions
            </h3>
            <div className="permissions-container">
              {user?.permissions && user.permissions.length > 0 ? (
                user.permissions.map((perm) => (
                  <span key={perm} className="permission-chip-badge">
                    {perm}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>No active permissions assigned.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
