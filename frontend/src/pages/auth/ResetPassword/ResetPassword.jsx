import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import AuthLayout from "../../../components/auth/AuthLayout";
import PasswordInput from "../../../components/auth/PasswordInput";
import AuthService from "../../../services/auth.service";
import "./ResetPassword.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!token) {
      setGlobalError("Invalid or missing password reset token. Please request a new link.");
      return false;
    }

    if (!formData.password || !formData.password.trim()) {
      errors.password = "Please enter your new password.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }

    if (!formData.confirmPassword || !formData.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your new password.";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await AuthService.resetPassword(token, formData.password, formData.confirmPassword);
      if (response && response.success) {
        setIsSuccess(true);
      } else {
        setGlobalError(response.message || "Failed to reset password.");
      }
    } catch (err) {
      setGlobalError(err.message || "Invalid or expired password reset token.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-header">
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">Enter your new password below to reset your account credentials.</p>
      </div>

      {!token && !isSuccess && (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={18} />
          <span>Reset token is missing. Please request a new password reset link.</span>
        </div>
      )}

      {globalError && (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={18} />
          <span>{globalError}</span>
        </div>
      )}

      {isSuccess ? (
        <div>
          <div className="auth-alert auth-alert-success" style={{ flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={18} />
              <strong>Password Reset Successful!</strong>
            </div>
            <p style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>
              Your password has been updated successfully. You can now log in with your new password.
            </p>
          </div>

          <button
            type="button"
            className="btn-submit"
            onClick={() => navigate("/login")}
            style={{ width: "100%", marginTop: "1rem" }}
          >
            Go to Login
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <PasswordInput
            label="New Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter new password"
            error={fieldErrors.password}
            disabled={isSubmitting || !token}
            required
          />

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter new password"
            error={fieldErrors.confirmPassword}
            disabled={isSubmitting || !token}
            required
          />

          <button type="submit" className="btn-submit" disabled={isSubmitting || !token}>
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      <div className="auth-footer" style={{ marginTop: "1.5rem" }}>
        <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
